import cloud from '@lafjs/cloud'
import crypto from "crypto";

export default async function (ctx: FunctionContext) {
  try {
    // 获取请求参数
    const { email, password, rememberMe = false } = ctx.body

    // 参数验证
    if (!email || !password) {
      return {
        code: 400,
        message: '邮箱和密码都是必填项',
        data: null
      }
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return {
        code: 400,
        message: '邮箱格式不正确',
        data: null
      }
    }

    // 获取数据库连接
    const db = cloud.database()

    // 查找用户
    const userQuery = await cloud.database().collection('users').where({
      email: email.toLowerCase()
    }).get()

    if (userQuery.data.length === 0) {
      return {
        code: 401,
        message: '邮箱或密码错误',
        data: null
      }
    }

    const user = userQuery.data[0]

    // 检查用户是否被禁用
    if (!user.isActive) {
      return {
        code: 403,
        message: '账户已被禁用，请联系管理员',
        data: null
      }
    }

    // 验证密码
    const hashedPassword = crypto
      .createHash("md5")                 // 使用 md5 算法
      .update(password + "thehunter_salt") // 加盐
      .digest("hex");                     // 输出 16 进制字符串

    console.log(hashedPassword);

    if (hashedPassword !== user.password) {
      return {
        code: 401,
        message: '邮箱或密码错误',
        data: null
      }
    }

    // 更新最后登录时间
    const now = new Date()
    await cloud.database().collection('users').doc(user._id).update({
      lastLoginAt: now,
      updatedAt: now
    })

    // 生成JWT Token（简单示例，实际项目建议使用更安全的token生成方式）
    const tokenPayload = {
      userId: user._id,
      email: user.email,
      nickname: user.nickname,
      loginTime: now.getTime()
    }

    // 这里使用简单的base64编码，实际项目应该使用JWT库
    const token = Buffer.from(JSON.stringify(tokenPayload)).toString('base64')

    // 设置token过期时间
    const expiresIn = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000 // 记住我：30天，否则：1天
    const expiresAt = new Date(now.getTime() + expiresIn)

    // 返回成功响应（不包含密码）
    const responseUser = {
      id: user._id,
      nickname: user.nickname,
      email: user.email,
      createdAt: user.createdAt,
      lastLoginAt: now,
      profile: user.profile || {
        avatar: '',
        bio: '',
        level: 1,
        experience: 0
      }
    }

    console.log(`用户登录成功: ${email}`)

    return {
      code: 200,
      message: '登录成功',
      data: {
        user: responseUser,
        token: token,
        expiresAt: expiresAt,
        rememberMe: rememberMe
      }
    }

  } catch (error) {
    console.error('登录失败:', error)
    return {
      code: 500,
      message: '服务器内部错误',
      data: null
    }
  }
}
