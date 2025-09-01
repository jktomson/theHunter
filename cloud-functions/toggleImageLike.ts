import cloud from '@lafjs/cloud'

export default async function (ctx: FunctionContext) {
  try {
    // 获取请求参数
    const { imageId, userId } = ctx.body

    // 参数验证
    if (!imageId || !userId) {
      return {
        code: 400,
        message: '图片ID和用户ID都是必填项',
        data: null
      }
    }

    // 获取数据库连接
    const db = cloud.database()

    // 验证图片是否存在
    const imageQuery = await db.collection('images').doc(imageId).get()
    if (!imageQuery.data || !imageQuery.data.isActive) {
      return {
        code: 404,
        message: '图片不存在',
        data: null
      }
    }

    // 验证用户是否存在
    const userQuery = await db.collection('users').doc(userId).get()
    if (!userQuery.data) {
      return {
        code: 404,
        message: '用户不存在',
        data: null
      }
    }

    // 检查用户是否已经点赞过这张图片
    const likeQuery = await db.collection('imageLikes').where({
      imageId: imageId,
      userId: userId
    }).get()

    let isLiked = likeQuery.data.length > 0
    let likeCount = imageQuery.data.likeCount || 0

    if (isLiked) {
      // 取消点赞
      await db.collection('imageLikes').where({
        imageId: imageId,
        userId: userId
      }).remove()

      // 减少图片的点赞数
      await db.collection('images').doc(imageId).update({
        likeCount: cloud.database().command.inc(-1),
        updatedAt: new Date()
      })

      likeCount = Math.max(0, likeCount - 1)
      isLiked = false

      console.log(`取消点赞成功: 用户${userId}取消点赞图片${imageId}`)

      return {
        code: 200,
        message: '取消点赞成功',
        data: {
          isLiked: false,
          likeCount: likeCount
        }
      }
    } else {
      // 添加点赞
      const now = new Date()
      await db.collection('imageLikes').add({
        imageId: imageId,
        userId: userId,
        createdAt: now
      })

      // 增加图片的点赞数
      await db.collection('images').doc(imageId).update({
        likeCount: cloud.database().command.inc(1),
        updatedAt: now
      })

      likeCount = likeCount + 1
      isLiked = true

      // 给上传者增加经验值（可选功能）
      try {
        await db.collection('users').doc(imageQuery.data.uploaderId).update({
          'profile.experience': cloud.database().command.inc(5), // 获得点赞奖励5经验值
          updatedAt: now
        })
      } catch (updateError) {
        console.warn('更新上传者经验值失败:', updateError)
      }

      console.log(`点赞成功: 用户${userId}点赞图片${imageId}`)

      return {
        code: 200,
        message: '点赞成功',
        data: {
          isLiked: true,
          likeCount: likeCount
        }
      }
    }

  } catch (error) {
    console.error('点赞操作失败:', error)
    return {
      code: 500,
      message: '服务器内部错误',
      data: null
    }
  }
}
