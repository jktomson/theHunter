import cloud from '@lafjs/cloud'

export default async function (ctx: FunctionContext) {
  try {
    // 获取请求参数
    const { imageId } = ctx.body

    // 参数验证
    if (!imageId) {
      return {
        code: 400,
        message: '图片ID是必填项',
        data: null
      }
    }

    // 获取数据库连接
    const db = cloud.database()

    // 查询图片详情
    const imageQuery = await db.collection('images').doc(imageId).get()

    if (!imageQuery.data) {
      return {
        code: 404,
        message: '图片不存在',
        data: null
      }
    }

    const image = imageQuery.data

    // 检查图片是否活跃
    if (!image.isActive) {
      return {
        code: 404,
        message: '图片已被删除或不可用',
        data: null
      }
    }

    // 增加浏览次数
    try {
      await db.collection('images').doc(imageId).update({
        viewCount: cloud.database().command.inc(1),
        updatedAt: new Date()
      })
    } catch (updateError) {
      console.warn('更新浏览次数失败:', updateError)
      // 不影响主要功能，继续执行
    }

    // 格式化返回数据（包含完整的图片数据）
    const responseImage = {
      id: image._id,
      areaName: image.areaName,
      animalName: image.animalName,
      rating: image.rating,
      uploaderId: image.uploaderId,
      uploaderNickname: image.uploaderNickname,
      description: image.description,
      imageData: image.imageData,          // 完整的图片数据
      uploadTime: image.uploadTime,
      viewCount: (image.viewCount || 0) + 1, // 返回更新后的浏览次数
      likeCount: image.likeCount || 0,
      tags: image.tags || [],
      fileSize: image.fileSize,
      imageType: image.imageType,
      createdAt: image.createdAt
    }

    console.log(`图片详情查询成功: 图片ID ${imageId}`)

    return {
      code: 200,
      message: '查询成功',
      data: {
        image: responseImage
      }
    }

  } catch (error) {
    console.error('获取图片详情失败:', error)
    return {
      code: 500,
      message: '服务器内部错误',
      data: null
    }
  }
}
