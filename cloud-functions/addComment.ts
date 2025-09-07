import cloud from '@lafjs/cloud'

export default async function (ctx: FunctionContext) {
  try {
    console.log('addComment 函数被调用，参数:', ctx.body);

    const { imageId, content, userId, userNickname } = ctx.body;

    // 验证必要参数
    if (!imageId || !content || !userId || !userNickname) {
      return {
        code: 400,
        message: '缺少必要参数：imageId, content, userId, userNickname',
        data: null
      };
    }

    // 验证评论内容（仅支持文字）
    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      return {
        code: 400,
        message: '评论内容不能为空',
        data: null
      };
    }

    if (trimmedContent.length > 500) {
      return {
        code: 400,
        message: '评论内容不能超过500字符',
        data: null
      };
    }

    // 获取数据库连接
    const db = cloud.database();

    // 验证图片是否存在
    const imageResult = await db.collection('images').doc(imageId).get();
    
    if (!imageResult.data) {
      return {
        code: 404,
        message: '图片不存在',
        data: null
      };
    }

    // 创建评论文档
    const commentDoc = {
      imageId: imageId,
      content: trimmedContent,
      userId: userId,
      userNickname: userNickname,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 插入评论
    const result = await db.collection('comments').add(commentDoc);

    if (result.id) {
      return {
        code: 200,
        message: '评论发表成功',
        data: {
          commentId: result.id
        }
      };
    } else {
      return {
        code: 500,
        message: '评论发表失败',
        data: null
      };
    }

  } catch (error) {
    console.error('添加评论失败:', error);
    return {
      code: 500,
      message: '服务器内部错误: ' + error.message,
      data: null
    };
  }
}
