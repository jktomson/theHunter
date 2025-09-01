import cloud from '@lafjs/cloud'

export default async function (ctx: FunctionContext) {
  try {
    // 获取请求参数
    const { 
      page = 1,           // 页码，默认第1页
      limit = 10,         // 每页数量，默认10条
      areaName,           // 筛选：区域名称
      animalName,         // 筛选：动物名称
      uploaderId,         // 筛选：上传者ID
      minRating,          // 筛选：最低评分
      sortBy = 'uploadTime', // 排序字段：uploadTime(上传时间), rating(评分), viewCount(浏览量), likeCount(点赞数)
      sortOrder = 'desc'  // 排序方向：desc(降序), asc(升序)
    } = ctx.body

    // 参数验证
    if (page < 1 || limit < 1 || limit > 50) {
      return {
        code: 400,
        message: '页码必须大于0，每页数量必须在1-50之间',
        data: null
      }
    }

    if (minRating && (minRating < 1 || minRating > 5)) {
      return {
        code: 400,
        message: '最低评分必须在1-5之间',
        data: null
      }
    }

    // 获取数据库连接
    const db = cloud.database()

    // 构建查询条件
    const whereConditions: any = {
      isActive: true  // 只查询活跃的图片
    }

    if (areaName) {
      whereConditions.areaName = areaName.trim()
    }

    if (animalName) {
      whereConditions.animalName = animalName.trim()
    }

    if (uploaderId) {
      whereConditions.uploaderId = uploaderId
    }

    if (minRating) {
      whereConditions.rating = db.command.gte(minRating)
    }

    // 构建排序条件
    const sortConditions: any = {}
    if (sortBy === 'uploadTime' || sortBy === 'rating' || sortBy === 'viewCount' || sortBy === 'likeCount') {
      sortConditions[sortBy] = sortOrder === 'asc' ? 1 : -1
    } else {
      // 默认按上传时间降序
      sortConditions.uploadTime = -1
    }

    // 计算跳过的记录数
    const skip = (page - 1) * limit

    // 查询图片列表（不包含完整的图片数据）
    const imagesQuery = await db.collection('images')
      .where(whereConditions)
      .field({
        imageData: false,  // 排除图片数据字段，节省带宽
        _id: true,
        areaName: true,
        animalName: true,
        rating: true,
        uploaderId: true,
        uploaderNickname: true,
        description: true,
        uploadTime: true,
        viewCount: true,
        likeCount: true,
        tags: true,
        fileSize: true,
        imageType: true,
        createdAt: true
      })
      .orderBy(sortConditions)
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

    // 格式化返回数据
    const formattedImages = images.map(image => ({
      id: image._id,
      areaName: image.areaName,
      animalName: image.animalName,
      rating: image.rating,
      uploaderId: image.uploaderId,
      uploaderNickname: image.uploaderNickname,
      description: image.description,
      uploadTime: image.uploadTime,
      viewCount: image.viewCount,
      likeCount: image.likeCount,
      tags: image.tags,
      fileSize: image.fileSize,
      imageType: image.imageType,
      // 添加缩略图URL（如果需要的话，可以生成缩略图）
      thumbnailUrl: `/api/image/${image._id}/thumbnail`,
      fullImageUrl: `/api/image/${image._id}/full`
    }))

    console.log(`图片列表查询成功: 第${page}页，共${total}条记录`)

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
          uploaderId: uploaderId || null,
          minRating: minRating || null,
          sortBy: sortBy,
          sortOrder: sortOrder
        }
      }
    }

  } catch (error) {
    console.error('获取图片列表失败:', error)
    return {
      code: 500,
      message: '服务器内部错误',
      data: null
    }
  }
}
