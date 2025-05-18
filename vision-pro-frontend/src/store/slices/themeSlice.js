// src/store/slices/themeSlice.js
import { createSlice } from '@reduxjs/toolkit'

// 获取本地存储的主题设置，默认为浅色模式
const getInitialTheme = () => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) {
    return JSON.parse(savedTheme)
  }
  // 匹配系统主题
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return { isDarkMode: true }
  }
  return { isDarkMode: false }
}

const themeSlice = createSlice({
  name: 'theme',
  initialState: getInitialTheme(),
  reducers: {
    toggleTheme: (state) => {
      state.isDarkMode = !state.isDarkMode
      // 保存到本地存储
      localStorage.setItem('theme', JSON.stringify(state))
    },
    setDarkMode: (state, action) => {
      state.isDarkMode = action.payload
      // 保存到本地存储
      localStorage.setItem('theme', JSON.stringify(state))
    }
  }
})

export const { toggleTheme, setDarkMode } = themeSlice.actions
export default themeSlice.reducer
