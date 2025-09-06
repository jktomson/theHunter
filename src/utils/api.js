// API配置
const API_BASE_URL = 'https://w8n28ll4is.bja.sealos.run'

// 通用请求函数
const request = async (endpoint, options = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`
    const defaultOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }

    const config = { ...defaultOptions, ...options }
    
    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body)
    }

    const response = await fetch(url, config)
    const data = await response.json()

    return data
  } catch (error) {
    console.error('API请求失败:', error)
    throw new Error('网络请求失败，请检查网络连接')
  }
}

// 用户注册API
export const registerUser = async (userData) => {
  const { nickname, email, password } = userData
  
  try {
    const response = await request('/register', {
      method: 'POST',
      body: {
        nickname: nickname.trim(),
        email: email.trim().toLowerCase(),
        password
      }
    })

    return response
  } catch (error) {
    throw error
  }
}

// 用户登录API
export const loginUser = async (loginData) => {
  const { email, password, rememberMe = false } = loginData
  
  try {
    const response = await request('/login', {
      method: 'POST',
      body: {
        email: email.trim().toLowerCase(),
        password,
        rememberMe
      }
    })

    // 如果登录成功，保存token到localStorage
    if (response.code === 200 && response.data.token) {
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      localStorage.setItem('expiresAt', response.data.expiresAt)
      
      // 如果选择了记住我，也保存到sessionStorage
      if (rememberMe) {
        sessionStorage.setItem('rememberMe', 'true')
      }
    }

    return response
  } catch (error) {
    throw error
  }
}

export const uploadImage = async (loadImageData) => {
  const {imageData, areaName, animalName, rating, uploaderId, uploaderNickname} = loadImageData

  try {
    const response = await request('/uploadImage', {
      method: 'POST', 
      body: {
        imageData: imageData,
        areaName: areaName,
        animalName: animalName,
        rating: rating,
        uploaderId: uploaderId,
        uploaderNickname: uploaderNickname
      }
    })
    if (response.code === 200) {
      alert('图片分享成功');
    }
    return response
  } catch (error) {
    throw error
  }
}

// 用户登出
export const logoutUser = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  localStorage.removeItem('expiresAt')
  sessionStorage.removeItem('rememberMe')
}

// 获取当前用户信息
export const getCurrentUser = () => {
  try {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    const expiresAt = localStorage.getItem('expiresAt')

    if (!token || !userStr || !expiresAt) {
      return null
    }

    // 检查token是否过期
    if (new Date() > new Date(expiresAt)) {
      logoutUser()
      return null
    }

    return JSON.parse(userStr)
  } catch (error) {
    console.error('获取用户信息失败:', error)
    logoutUser()
    return null
  } 
}

// 检查用户是否已登录
export const isAuthenticated = () => {
  return getCurrentUser() !== null
}

// 获取认证头
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

// 获取风景图片
export const getLandscapeImages = async (filters = {}) => {
  try {
    const response = await request('/getLandscapeImages', {
      method: 'POST',
      body: {
        areaName: filters.areaName || '',
        page: filters.page || 1,
        timestamp: filters.timestamp || null,
        sortBy: filters.sortBy || 'uploadTime',
        sortOrder: filters.sortOrder || 'desc',
        limit: filters.limit || 12
      }
    })

    return response
  } catch (error) {
    console.error('获取风景图片失败:', error)
    throw error
  }
}

// 获取奖杯图片
export const getTrophyImages = async (filters = {}) => {
  try {
    const response = await request('/getTrophyImages', {
      method: 'POST',
      body: {
        areaName: filters.areaName || '',
        animalName: filters.animalName || '',
        rating: filters.rating !== undefined && filters.rating !== null ? filters.rating : null,
        page: filters.page || 1,
        timestamp: filters.timestamp || null,
        sortBy: filters.sortBy || 'uploadTime',
        sortOrder: filters.sortOrder || 'desc',
        limit: filters.limit || 12
      }
    })

    return response
  } catch (error) {
    console.error('获取奖杯图片失败:', error)
    throw error
  }
}
