import cloud from '@lafjs/cloud'
import { FunctionContext } from './types'

export default async function (ctx: FunctionContext) {
  try {
    // 获取请求参数
    const { 
      areaName,           // 区域名称（可选）
      animalName,         // 动物名称（可选）
      rating,             // 评级筛选（可选）
      page = 1,           // 页码，默认第1页
      limit = 20,         // 每页数量，默认20条
      sortBy = 'uploadTime', // 排序字段
      sortOrder = 'desc'  // 排序方向
    } = ctx.body

    // 参数验证
    if (page < 1 || limit < 1 || limit > 50) {
      return {
        code: 400,
        message: '页码必须大于0，每页数量必须在1-50之间',
        data: null
      }
    }

    if (rating && (rating < 0 || rating > 5)) {
      return {
        code: 400,
        message: '评级必须在0-5之间',
        data: null
      }
    }

    // 获取数据库连接
    const db = cloud.database()

    // 构建查询条件 - 排除风景图片，只查询动物奖杯
    const whereConditions: any = {
      isActive: true,
      animalName: db.command.neq('风景')  // 排除风景图片
    }

    // 添加可选筛选条件
    if (areaName) {
      whereConditions.areaName = areaName.trim()
    }

    if (animalName) {
      whereConditions.animalName = animalName.trim()
    }

    if (rating !== undefined && rating !== null) {
      whereConditions.rating = rating
    }

    // 构建排序条件
    let sortField = 'uploadTime'
    let sortDirection = -1 // 默认降序
    
    if (sortBy === 'uploadTime' || sortBy === 'viewCount' || sortBy === 'likeCount' || sortBy === 'rating') {
      sortField = sortBy
      sortDirection = sortOrder === 'asc' ? 1 : -1
    }

    // 计算跳过的记录数
    const skip = (page - 1) * limit

    // 查询奖杯图片列表（包含完整的图片数据用于瀑布流展示）
    const imagesQuery = await db.collection('images')
      .where(whereConditions)
      .field({
        _id: true,
        areaName: true,
        animalName: true,
        rating: true,
        uploaderId: true,
        uploaderNickname: true,
        description: true,
        imageData: true,        // 包含图片数据
        uploadTime: true,
        viewCount: true,
        likeCount: true,
        fileSize: true,
        imageType: true
      })
      .orderBy(sortField, sortDirection === 1 ? 'asc' : 'desc')
      .skip(skip)
      .limit(limit)
      .get()

    // 获取总数
    const countQuery = await db.collection('images')
      .where(whereConditions)
      .count()

    const images = imagesQuery.data || []
    const total = countQuery.total || 0

    // 计算分页信息
    const totalPages = Math.ceil(total / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    // 评级文本映射
    const getRatingText = (rating: number) => {
      const ratingMap = {
        0: '无评级',
        1: '青铜',
        2: '白银', 
        3: '黄金',
        4: '钻石',
        5: '奇珍异兽'
      }
      return ratingMap[rating] || '未知'
    }

    // 格式化返回数据
    const formattedImages = images.map(image => ({
      id: image._id,
      areaName: image.areaName,
      animalName: image.animalName,
      rating: image.rating,
      ratingText: getRatingText(image.rating),
      uploaderId: image.uploaderId,
      uploaderNickname: image.uploaderNickname,
      description: image.description || '',
      imageData: image.imageData,
      uploadTime: image.uploadTime,
      viewCount: image.viewCount || 0,
      likeCount: image.likeCount || 0,
      fileSize: image.fileSize,
      imageType: image.imageType
    }))

    console.log(`奖杯图片查询成功: 区域=${areaName || '全部'}, 动物=${animalName || '全部'}, 评级=${rating ?? '全部'}, 第${page}页，共${total}条记录`)

    return {
      code: 200,
      message: '查询成功',
      data: {
        images: formattedImages,
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage: hasNextPage,
          hasPrevPage: hasPrevPage
        },
        filters: {
          areaName: areaName || null,
          animalName: animalName || null,
          rating: rating ?? null,
          sortBy: sortBy,
          sortOrder: sortOrder
        }
      }
    }

  } catch (error) {
    console.error('获取奖杯图片失败:', error)
    return {
      code: 500,
      message: '服务器内部错误',
      data: null
    }
  }
}
