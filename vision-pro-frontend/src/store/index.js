// src/store/index.js
import { configureStore } from '@reduxjs/toolkit'
import { combineReducers } from 'redux'

// 导入reducers
import themeReducer from './slices/themeSlice'
import uiReducer from './slices/uiSlice'
import settingsReducer from './slices/settingsSlice'
import notificationReducer from './slices/notificationSlice'

// 合并所有reducer
const rootReducer = combineReducers({
  theme: themeReducer,
  ui: uiReducer,
  settings: settingsReducer,
  notification: notificationReducer
})

// 创建store
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // 允许非序列化对象出现的路径
        ignoredActions: ['ui/openModal', 'ui/closeModal'],
        ignoredPaths: ['ui.modalProps']
      }
    })
})

// 导出类型
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
