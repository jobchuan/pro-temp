// src/services/api/authService.js
import { BaseApiService } from './base'
import { setToken, setRefreshToken } from '@/utils/tokenStorage'

class AuthApiService extends BaseApiService {
  /**
   * 用户登录
   * @param {string} email - 用户邮箱
   * @param {string} password - 用户密码
   * @returns {Promise<object>} - 登录响应
   */
  async login(email, password) {
    try {
      const response = await this.post('/users/login', { email, password })
      
      // 保存认证令牌
      if (response.success && response.data.token) {
        setToken(response.data.token)
        if (response.data.refreshToken) {
          setRefreshToken(response.data.refreshToken)
        }
      }
      
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * 用户注册
   * @param {object} userData - 用户注册数据
   * @returns {Promise<object>} - 注册响应
   */
  async register(userData) {
    try {
      const response = await this.post('/users/register', userData)
      
      // 保存认证令牌
      if (response.success && response.data.token) {
        setToken(response.data.token)
        if (response.data.refreshToken) {
          setRefreshToken(response.data.refreshToken)
        }
      }
      
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * 刷新访问令牌
   * @returns {Promise<string>} - 新的访问令牌
   */
  async refreshToken() {
    // 实现刷新令牌逻辑
    // 这里是示例实现，实际应该使用存储的refreshToken
    const response = await this.post('/users/refresh-token', {
      refreshToken: localStorage.getItem('refreshToken')
    })
    
    if (response.success && response.data.token) {
      setToken(response.data.token)
      return response.data.token
    }
    
    throw new Error('无法刷新令牌')
  }

  /**
   * 用户登出
   * @returns {Promise<object>} - 登出响应
   */
  async logout() {
    try {
      return await this.post('/users/logout')
    } catch (error) {
      throw error
    }
  }
}

export const authApiService = new AuthApiService()

// 导出刷新令牌函数以便HTTP客户端使用
export const refreshToken = async () => {
  return authApiService.refreshToken()
}
