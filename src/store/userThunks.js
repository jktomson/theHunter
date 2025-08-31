import { createAsyncThunk } from '@reduxjs/toolkit'
import { registerUser as apiRegisterUser, loginUser as apiLoginUser } from '../utils/api'

// 异步登录action
export const loginUserAsync = createAsyncThunk(
  'user/loginAsync',
  async (loginData, { rejectWithValue }) => {
    try {
      const response = await apiLoginUser(loginData)
      
      if (response.code === 200) {
        return {
          user: response.data.user,
          token: response.data.token,
          expiresAt: response.data.expiresAt
        }
      } else {
        return rejectWithValue(response.message || '登录失败')
      }
    } catch (error) {
      return rejectWithValue(error.message || '网络错误，请重试')
    }
  }
)

// 异步注册action
export const registerUserAsync = createAsyncThunk(
  'user/registerAsync',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await apiRegisterUser(userData)
      
      if (response.code === 200) {
        return response.data
      } else {
        return rejectWithValue(response.message || '注册失败')
      }
    } catch (error) {
      return rejectWithValue(error.message || '网络错误，请重试')
    }
  }
)
