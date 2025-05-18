// src/services/http/client.js
import axios from 'axios'
import { message } from 'antd'
import { getToken, setToken, clearTokens } from '@/utils/tokenStorage'

// 先声明refreshToken变量，稍后再导入函数
// 这样避免循环依赖问题
let refreshTokenFunc

// 创建axios实例
const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Accept-Language': localStorage.getItem('language') || 'zh-CN'
  }
})

// 请求拦截器
httpClient.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
httpClient.interceptors.response.use(
  (response) => {
    // 只返回响应数据部分
    return response.data
  },
  async (error) => {
    const originalRequest = error.config
    
    // 处理401错误(未授权)，尝试刷新token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        // 动态导入refreshToken函数，避免循环依赖
        if (!refreshTokenFunc) {
          // 导入整个模块而不是解构，防止循环引用问题
          const authModule = await import('../api/authService')
          refreshTokenFunc = authModule.refreshToken
        }
        
        const newToken = await refreshTokenFunc()
        setToken(newToken)
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`
        return httpClient(originalRequest)
      } catch (refreshError) {
        // 刷新token失败，清除tokens并跳转到登录页
        clearTokens()
        message.error('登录已过期，请重新登录')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }
    
    // 其他错误处理
    if (error.response) {
      // 服务器响应错误
      const status = error.response.status
      const errorData = error.response.data
      
      switch (status) {
        case 400:
          message.error(errorData.message || '请求参数错误')
          break
        case 403:
          message.error('您没有权限执行此操作')
          break
        case 404:
          message.error('请求的资源不存在')
          break
        case 500:
          message.error('服务器错误，请稍后重试')
          break
        default:
          message.error(errorData.message || `请求错误: ${status}`)
      }
    } else if (error.request) {
      // 请求发送但没有收到响应
      message.error('网络错误，请检查您的网络连接')
    } else {
      // 请求配置错误
      message.error(`请求错误: ${error.message}`)
    }
    
    return Promise.reject(error)
  }
)

export default httpClient
