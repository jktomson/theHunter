import cloud from '@lafjs/cloud'

export default async function (ctx: FunctionContext) {
  try {
    // 获取请求参数
    const { 
      imageData,     // base64编码的图片数据
      areaName,      // 区域名称
      animalName,    // 动物名称  
      rating,        // 评分 (1-5星)
      uploaderId,    // 上传者ID
      uploaderNickname, // 上传者昵称
      description    // 图片描述（可选）
    } = ctx.body

    // 参数验证
    if (!imageData || !areaName || !animalName || !rating || !uploaderId || !uploaderNickname) {
      return {
        code: 400,
        message: '图片数据、区域、动物、评分、上传者信息都是必填项',
        data: null
      }
    }

    // 验证评分范围
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return {
        code: 400,
        message: '评分必须是1-5之间的整数',
        data: null
      }
    }

    // 验证图片数据格式 (base64)
    if (!imageData.startsWith('data:image/')) {
      return {
        code: 400,
        message: '图片格式不正确，请上传有效的图片文件',
        data: null
      }
    }

    // 验证图片大小 (限制为5MB)
    const imageSizeInBytes = (imageData.length * 3) / 4 // base64 转字节大小的估算
    const maxSizeInBytes = 5 * 1024 * 1024 // 5MB
    if (imageSizeInBytes > maxSizeInBytes) {
      return {
        code: 400,
        message: '图片大小不能超过5MB',
        data: null
      }
    }

    // 获取数据库连接
    const db = cloud.database()

    // 验证上传者是否存在
    const userQuery = await db.collection('users').doc(uploaderId).get()
    if (!userQuery.data) {
      return {
        code: 404,
        message: '上传者不存在',
        data: null
      }
    }

    // 创建图片记录
    const now = new Date()
    const imageDoc = {
      areaName: areaName.trim(),           // 区域名称
      animalName: animalName.trim(),       // 动物名称
      rating: rating,                      // 评分 (1-5)
      uploaderId: uploaderId,              // 上传者ID
      uploaderNickname: uploaderNickname.trim(), // 上传者昵称
      description: description ? description.trim() : '', // 图片描述
      imageData: imageData,                // base64图片数据
      uploadTime: now,                     // 上传时间
      createdAt: now,                      // 创建时间
      updatedAt: now,                      // 更新时间
      isActive: true,                      // 是否活跃
      viewCount: 0,                        // 浏览次数
      likeCount: 0,                        // 点赞次数
      tags: [areaName.trim(), animalName.trim()], // 标签，便于搜索
      fileSize: Math.round(imageSizeInBytes),      // 文件大小（字节）
      imageType: imageData.substring(5, imageData.indexOf(';')) // 图片类型，如 "image/jpeg"
    }

    // 插入图片到数据库
    const result = await db.collection('images').add(imageDoc)

    if (!result.id) {
      return {
        code: 500,
        message: '图片上传失败，请稍后重试',
        data: null
      }
    }

    // 更新用户的上传统计（可选功能）
    try {
      await db.collection('users').doc(uploaderId).update({
        'profile.uploadCount': cloud.database().command.inc(1), // 上传数量+1
        'profile.experience': cloud.database().command.inc(10), // 经验值+10
        updatedAt: now
      })
    } catch (updateError) {
      console.warn('更新用户统计失败:', updateError)
      // 不影响主要功能，继续执行
    }

    // 返回成功响应（不包含完整的图片数据以节省带宽）
    const responseImage = {
      id: result.id,
      areaName: imageDoc.areaName,
      animalName: imageDoc.animalName,
      rating: imageDoc.rating,
      uploaderId: imageDoc.uploaderId,
      uploaderNickname: imageDoc.uploaderNickname,
      description: imageDoc.description,
      uploadTime: imageDoc.uploadTime,
      viewCount: imageDoc.viewCount,
      likeCount: imageDoc.likeCount,
      tags: imageDoc.tags,
      fileSize: imageDoc.fileSize,
      imageType: imageDoc.imageType
    }

    console.log(`图片上传成功: 用户${uploaderNickname}上传了${areaName}-${animalName}的图片`)

    return {
      code: 200,
      message: '图片上传成功',
      data: {
        image: responseImage
      }
    }

  } catch (error) {
    console.error('图片上传失败:', error)
    return {
      code: 500,
      message: '服务器内部错误',
      data: null
    }
  }
}
