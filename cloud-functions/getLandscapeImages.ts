import cloud from '@lafjs/cloud'
import { FunctionContext } from './types'

export default async function (ctx: FunctionContext) {
  try {
    // 获取请求参数
    const { 
      page = 1,           // 页码，默认第1页
      limit = 12,         // 每页数量，默认12条
      sortBy = 'uploadTime', // 排序字段
      sortOrder = 'desc',  // 排序方向
      timestamp = null    // 查询时间戳，用于保证分页一致性
    } = ctx.body

    // 参数验证
    if (page < 1 || limit < 1 || limit > 50) {
      return {
        code: 400,
        message: '页码必须大于0，每页数量必须在1-50之间',
        data: null
      }
    }

    // 获取数据库连接
    const db = cloud.database()

    // 构建查询条件 - 只查询风景图片
    const whereConditions: any = {
      isActive: true,
      animalName: '风景'  // 筛选风景图片
    }

    // 如果提供了时间戳，只查询在该时间点之前上传的图片
    // 这样可以保证分页期间新上传的图片不会影响已显示的内容
    if (timestamp) {
      whereConditions.uploadTime = db.command.lte(new Date(timestamp))
    }

    // 构建排序条件
    let sortField = 'uploadTime'
    let sortDirection = 'desc'
    
    if (sortBy === 'uploadTime' || sortBy === 'viewCount' || sortBy === 'likeCount') {
      sortField = sortBy
      sortDirection = sortOrder === 'asc' ? 'asc' : 'desc'
    }

    // 计算跳过的记录数
    const skip = (page - 1) * limit

    console.log('查询条件:', { whereConditions, sortField, sortDirection, skip, limit })

    // 查询风景图片列表
    const imagesQuery = await db.collection('images')
      .where(whereConditions)
      .field({
        _id: true,
        areaName: true,
        animalName: true,
        uploaderId: true,
        uploaderNickname: true,
        description: true,
        imageData: true,
        uploadTime: true,
        viewCount: true,
        likeCount: true,
        fileSize: true,
        imageType: true
      })
      .orderBy(sortField, sortDirection)
      .orderBy('_id', 'desc') // 辅助排序确保一致性
      .skip(skip)
      .limit(limit + 1) // 多查询一条用于判断是否有下一页
      .get()

    const images = imagesQuery.data || []
    console.log(`查询到 ${images.length} 条记录，limit=${limit}`)

    // 判断是否有下一页
    const hasNextPage = images.length > limit
    if (hasNextPage) {
      images.pop() // 移除多查询的那一条
    }

    console.log(`处理后 ${images.length} 条记录，hasNextPage=${hasNextPage}`)

    // 获取查询时间戳（用于后续分页保持一致性）
    const queryTimestamp = timestamp || new Date().toISOString()

    // 格式化返回数据
    const formattedImages = images.map(image => {
      // 清理和验证图片数据
      let cleanImageData = image.imageData;
      if (cleanImageData) {
        // 移除可能的data:image前缀
        cleanImageData = cleanImageData.replace(/^data:image\/[a-z]+;base64,/, '');
        // 简单验证base64格式（只包含有效字符）
        const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
        if (!base64Regex.test(cleanImageData)) {
          console.error('无效的base64数据格式:', image._id);
          cleanImageData = null;
        }
      }

      return {
        id: image._id,
        areaName: image.areaName,
        animalName: image.animalName,
        uploaderId: image.uploaderId,
        uploaderNickname: image.uploaderNickname,
        description: image.description || '',
        imageData: cleanImageData,
        uploadTime: image.uploadTime,
        viewCount: image.viewCount || 0,
        likeCount: image.likeCount || 0,
        fileSize: image.fileSize,
        imageType: image.imageType || 'image/jpeg'
      }
    })

    console.log(`风景图片查询成功: 第${page}页，返回${formattedImages.length}条记录，hasNextPage=${hasNextPage}`)

    return {
      code: 200,
      message: '查询成功',
      data: {
        images: formattedImages,
        pagination: {
          currentPage: page,
          hasNextPage: hasNextPage,
          itemsPerPage: limit,
          timestamp: queryTimestamp // 传递时间戳给前端
        },
        filters: {
          animalName: '风景',
          sortBy: sortBy,
          sortOrder: sortOrder
        }
      }
    }

  } catch (error) {
    console.error('获取风景图片失败:', error)
    return {
      code: 500,
      message: '服务器内部错误',
      data: null
    }
  }
}
