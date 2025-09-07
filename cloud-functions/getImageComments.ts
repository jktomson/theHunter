import cloud from '@lafjs/cloud'

export default async function (ctx: FunctionContext) {
  try {
    console.log('getImageComments 函数被调用，参数:', ctx.body);

    const { imageId } = ctx.body;

    if (!imageId) {
      return {
        code: 400,
        message: '缺少必要参数：imageId',
        data: null
      };
    }

    // 获取数据库连接
    const db = cloud.database();

    // 获取图片信息
    const imageResult = await db.collection('images').doc(imageId).get();

    if (!imageResult.data) {
      return {
        code: 404,
        message: '图片不存在',
        data: null
      };
    }

    const imageInfo = imageResult.data;

    // 获取图片的评论，按时间倒序排列
    const commentsResult = await db.collection('comments')
      .where({ imageId: imageId })
      .orderBy('createdAt', 'desc')
      .get();

    // 格式化图片信息
    const formattedImageInfo = {
      id: imageInfo._id,
      imageUrl: imageInfo.imageData,
      areaName: imageInfo.areaName,
      animalName: imageInfo.animalName,
      rating: imageInfo.rating || 0,
      uploaderNickname: imageInfo.uploaderNickname,
      uploadTime: imageInfo.uploadTime
    };

    // 格式化评论信息
    const formattedComments = commentsResult.data.map(comment => ({
      id: comment._id,
      content: comment.content,
      userNickname: comment.userNickname,
      userId: comment.userId,
      createdAt: comment.createdAt
    }));

    return {
      code: 200,
      message: '获取评论成功',
      data: {
        imageInfo: formattedImageInfo,
        comments: formattedComments
      }
    };

  } catch (error) {
    console.error('获取评论失败:', error);
    return {
      code: 500,
      message: '服务器内部错误: ' + error.message,
      data: null
    };
  }
}
