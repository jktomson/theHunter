import { createSlice } from '@reduxjs/toolkit'
import { loginUserAsync, registerUserAsync } from './userThunks'

// 从localStorage获取初始状态
const getInitialState = () => {
  try {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    const expiresAt = localStorage.getItem('expiresAt')

    if (!token || !userStr || !expiresAt) {
      return {
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null
      }
    }

    // 检查token是否过期
    if (new Date() > new Date(expiresAt)) {
      // 清除过期的数据
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('expiresAt')
      sessionStorage.removeItem('rememberMe')
      
      return {
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null
      }
    }

    return {
      user: JSON.parse(userStr),
      token: token,
      isAuthenticated: true,
      loading: false,
      error: null
    }
  } catch (error) {
    console.error('初始化用户状态失败:', error)
    return {
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null
    }
  }
}

const userSlice = createSlice({
  name: 'user',
  initialState: getInitialState(),
  reducers: {
    // 开始登录
    loginStart: (state) => {
      state.loading = true
      state.error = null
    },
    
    // 登录成功
    loginSuccess: (state, action) => {
      const { user, token, expiresAt } = action.payload
      state.user = user
      state.token = token
      state.isAuthenticated = true
      state.loading = false
      state.error = null
      
      // 同步到localStorage
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('expiresAt', expiresAt)
    },
    
    // 登录失败
    loginFailure: (state, action) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.loading = false
      state.error = action.payload
    },
    
    // 开始注册
    registerStart: (state) => {
      state.loading = true
      state.error = null
    },
    
    // 注册成功（通常注册后不自动登录，只清除loading状态）
    registerSuccess: (state) => {
      state.loading = false
      state.error = null
    },
    
    // 注册失败
    registerFailure: (state, action) => {
      state.loading = false
      state.error = action.payload
    },
    
    // 登出
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.loading = false
      state.error = null
      
      // 清除localStorage
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('expiresAt')
      sessionStorage.removeItem('rememberMe')
    },
    
    // 更新用户信息
    updateUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
        localStorage.setItem('user', JSON.stringify(state.user))
      }
    },
    
    // 清除错误
    clearError: (state) => {
      state.error = null
    },
    
    // 清除加载状态
    clearLoading: (state) => {
      state.loading = false
    }
  },
  
  // 处理异步actions
  extraReducers: (builder) => {
    builder
      // 处理登录
      .addCase(loginUserAsync.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginUserAsync.fulfilled, (state, action) => {
        const { user, token, expiresAt } = action.payload
        state.user = user
        state.token = token
        state.isAuthenticated = true
        state.loading = false
        state.error = null
      })
      .addCase(loginUserAsync.rejected, (state, action) => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
        state.loading = false
        state.error = action.payload
      })
      
      // 处理注册
      .addCase(registerUserAsync.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(registerUserAsync.fulfilled, (state) => {
        state.loading = false
        state.error = null
      })
      .addCase(registerUserAsync.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})

// 导出action creators
export const {
  loginStart,
  loginSuccess,
  loginFailure,
  registerStart,
  registerSuccess,
  registerFailure,
  logout,
  updateUser,
  clearError,
  clearLoading
} = userSlice.actions

// 选择器
export const selectUser = (state) => state.user.user
export const selectToken = (state) => state.user.token
export const selectIsAuthenticated = (state) => state.user.isAuthenticated
export const selectUserLoading = (state) => state.user.loading
export const selectUserError = (state) => state.user.error

// 导出reducer
export default userSlice.reducer
