import { configureStore } from '@reduxjs/toolkit'
import userReducer from './userSlice'

export const store = configureStore({
  reducer: {
    user: userReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // 忽略这些路径的序列化检查，因为Date对象不能序列化
        ignoredPaths: ['user.user.createdAt', 'user.user.lastLoginAt'],
      },
    }),
})

export default store
