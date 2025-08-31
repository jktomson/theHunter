import cloud from '@lafjs/cloud'
import crypto from "crypto"

export default async function (ctx: FunctionContext) {
  try {
    // 获取请求参数
    const { nickname, email, password } = ctx.body

    // 参数验证
    if (!nickname || !email || !password) {
      return {
        code: 400,
        message: '昵称、邮箱和密码都是必填项',
        data: null
      }
    }

    // 验证昵称长度
    if (nickname.trim().length < 2 || nickname.trim().length > 20) {
      return {
        code: 400,
        message: '昵称长度必须在2-20个字符之间',
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

    // 验证密码长度
    if (password.length < 6 || password.length > 20) {
      return {
        code: 400,
        message: '密码长度必须在6-20个字符之间',
        data: null
      }
    }

    // 获取数据库连接
    const db = cloud.database()

    // 检查邮箱是否已经存在
    const existingUser = await cloud.database().collection('users').where({
      email: email.toLowerCase()
    }).get()

    if (existingUser.data.length > 0) {
      return {
        code: 409,
        message: '该邮箱已被注册',
        data: null
      }
    }

    // 检查昵称是否已经存在
    const existingNickname = await cloud.database().collection('users').where({
      nickname: nickname.trim()
    }).get()

    if (existingNickname.data.length > 0) {
      return {
        code: 409,
        message: '该昵称已被使用',
        data: null
      }
    }

    // 加密密码
    const hashedPassword = crypto
      .createHash("md5")                 // 使用 md5 算法
      .update(password + "thehunter_salt") // 加盐
      .digest("hex");                     // 输出 16 进制字符串

    console.log(hashedPassword);

    // 创建用户记录
    const now = new Date()
    const userDoc = {
      nickname: nickname.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
      isActive: true,
      lastLoginAt: null,
      profile: {
        avatar: '',
        bio: '',
        level: 1,
        experience: 0
      }
    }

    // 插入用户到数据库
    const result = await cloud.database().collection('users').add(userDoc)

    if (!result.id) {
      return {
        code: 500,
        message: '注册失败，请稍后重试',
        data: null
      }
    }

    // 返回成功响应（不包含密码）
    const responseUser = {
      id: result.id,
      nickname: userDoc.nickname,
      email: userDoc.email,
      createdAt: userDoc.createdAt,
      profile: userDoc.profile
    }

    console.log(`用户注册成功: ${email}`)

    return {
      code: 200,
      message: '注册成功',
      data: {
        user: responseUser
      }
    }

  } catch (error) {
    console.error('注册失败:', error)
    return {
      code: 500,
      message: '服务器内部错误',
      data: null
    }
  }
}
