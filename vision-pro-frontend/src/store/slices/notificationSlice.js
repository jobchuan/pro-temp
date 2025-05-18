// src/store/slices/notificationSlice.js
import { createSlice } from '@reduxjs/toolkit'

const notificationSlice = createSlice({
  name: 'notification',
  initialState: {
    unreadCount: 0,
    notifications: [],
    isLoading: false,
    hasMore: true,
    page: 1
  },
  reducers: {
    setNotifications: (state, action) => {
      state.notifications = action.payload
    },
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload)
      state.unreadCount += 1
    },
    markAsRead: (state, action) => {
      const { notificationId } = action.payload
      const notification = state.notifications.find(n => n.id === notificationId)
      if (notification && !notification.read) {
        notification.read = true
        state.unreadCount = Math.max(0, state.unreadCount - 1)
      }
    },
    markAllAsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.read = true
      })
      state.unreadCount = 0
    },
    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload
    },
    removeNotification: (state, action) => {
      const { notificationId } = action.payload
      const index = state.notifications.findIndex(n => n.id === notificationId)
      if (index !== -1) {
        const wasUnread = !state.notifications[index].read
        state.notifications.splice(index, 1)
        if (wasUnread) {
          state.unreadCount = Math.max(0, state.unreadCount - 1)
        }
      }
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload
    },
    setHasMore: (state, action) => {
      state.hasMore = action.payload
    },
    setPage: (state, action) => {
      state.page = action.payload
    },
    appendNotifications: (state, action) => {
      state.notifications = [...state.notifications, ...action.payload]
    }
  }
})

export const {
  setNotifications,
  addNotification,
  markAsRead,
  markAllAsRead,
  setUnreadCount,
  removeNotification,
  setLoading,
  setHasMore,
  setPage,
  appendNotifications
} = notificationSlice.actions

export default notificationSlice.reducer
