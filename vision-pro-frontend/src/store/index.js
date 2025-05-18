// src/store/index.js
import { configureStore } from '@reduxjs/toolkit'
import { combineReducers } from 'redux'

// 导入reducers
const themeReducer = (state = { isDarkMode: false }, action) => {
  switch (action.type) {
    case 'TOGGLE_THEME':
      return { ...state, isDarkMode: !state.isDarkMode }
    case 'SET_DARK_MODE':
      return { ...state, isDarkMode: action.payload }
    default:
      return state
  }
}

const uiReducer = (state = { sidebarCollapsed: false }, action) => {
  switch (action.type) {
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed }
    default:
      return state
  }
}

// 合并所有reducer
const rootReducer = combineReducers({
  theme: themeReducer,
  ui: uiReducer
})

// 创建store
export const store = configureStore({
  reducer: rootReducer
})

// 导出类型 - 修复TypeScript语法错误
// export type RootState = ReturnType<typeof store.getState>
// export type AppDispatch = typeof store.dispatch