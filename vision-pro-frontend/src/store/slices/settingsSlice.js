// src/store/slices/settingsSlice.js
import { createSlice } from '@reduxjs/toolkit'

// 获取本地存储的设置，设置默认值
const getInitialSettings = () => {
  const savedSettings = localStorage.getItem('settings')
  if (savedSettings) {
    return JSON.parse(savedSettings)
  }
  return {
    language: navigator.language.startsWith('zh') ? 'zh-CN' : 'en-US',
    notifications: {
      email: true,
      browser: true,
      sms: false,
      wechat: true,
      doNotDisturb: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00'
      }
    },
    displaySettings: {
      contentPerPage: 10,
      defaultView: 'table',
      showThumbnails: true,
      enableAnimations: true
    },
    uploadSettings: {
      defaultChunkSize: 5, // MB
      enableCompress: true,
      autoGenerateThumbnail: true
    }
  }
}

const settingsSlice = createSlice({
  name: 'settings',
  initialState: getInitialSettings(),
  reducers: {
    setLanguage: (state, action) => {
      state.language = action.payload
      localStorage.setItem('settings', JSON.stringify(state))
    },
    updateNotificationSettings: (state, action) => {
      state.notifications = {
        ...state.notifications,
        ...action.payload
      }
      localStorage.setItem('settings', JSON.stringify(state))
    },
    updateDisplaySettings: (state, action) => {
      state.displaySettings = {
        ...state.displaySettings,
        ...action.payload
      }
      localStorage.setItem('settings', JSON.stringify(state))
    },
    updateUploadSettings: (state, action) => {
      state.uploadSettings = {
        ...state.uploadSettings,
        ...action.payload
      }
      localStorage.setItem('settings', JSON.stringify(state))
    },
    resetSettings: (state) => {
      // 重置为默认设置
      const defaultSettings = getInitialSettings()
      Object.assign(state, defaultSettings)
      localStorage.setItem('settings', JSON.stringify(state))
    }
  }
})

export const {
  setLanguage,
  updateNotificationSettings,
  updateDisplaySettings,
  updateUploadSettings,
  resetSettings
} = settingsSlice.actions

export default settingsSlice.reducer
