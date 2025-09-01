import cloud from '@lafjs/cloud'

export default async function (ctx: FunctionContext) {
  try {
    // 获取请求参数
    const { imageId, userId, reason } = ctx.body

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
    if (!imageQuery.data) {
      return {
        code: 404,
        message: '图片不存在',
        data: null
      }
    }

    const image = imageQuery.data

    // 验证用户是否存在且有权限删除（只有上传者本人或管理员可以删除）
    const userQuery = await db.collection('users').doc(userId).get()
    if (!userQuery.data) {
      return {
        code: 404,
        message: '用户不存在',
        data: null
      }
    }

    const user = userQuery.data
    const isOwner = image.uploaderId === userId
    const isAdmin = user.role === 'admin' || user.isAdmin === true

    if (!isOwner && !isAdmin) {
      return {
        code: 403,
        message: '权限不足，只有图片上传者或管理员可以删除图片',
        data: null
      }
    }

    // 检查图片是否已经被删除
    if (!image.isActive) {
      return {
        code: 400,
        message: '图片已经被删除',
        data: null
      }
    }

    const now = new Date()

    // 软删除：将图片标记为不活跃而不是物理删除
    await db.collection('images').doc(imageId).update({
      isActive: false,
      deletedAt: now,
      deletedBy: userId,
      deleteReason: reason || '用户删除',
      updatedAt: now
    })

    // 删除相关的点赞记录
    try {
      await db.collection('imageLikes').where({
        imageId: imageId
      }).remove()
    } catch (cleanupError) {
      console.warn('清理点赞记录失败:', cleanupError)
      // 不影响主要功能
    }

    // 如果是用户自己删除，减少用户的上传统计
    if (isOwner) {
      try {
        await db.collection('users').doc(userId).update({
          'profile.uploadCount': cloud.database().command.inc(-1),
          updatedAt: now
        })
      } catch (updateError) {
        console.warn('更新用户统计失败:', updateError)
      }
    }

    console.log(`图片删除成功: 图片${imageId}被用户${userId}删除`)

    return {
      code: 200,
      message: '图片删除成功',
      data: {
        imageId: imageId,
        deletedAt: now,
        deletedBy: userId
      }
    }

  } catch (error) {
    console.error('删除图片失败:', error)
    return {
      code: 500,
      message: '服务器内部错误',
      data: null
    }
  }
}
