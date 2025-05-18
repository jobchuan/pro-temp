// src/services/api/userService.js
import { BaseApiService } from './base'

class UserApiService extends BaseApiService {
  /**
   * 获取当前用户信息
   * @returns {Promise<object>} - 用户信息
   */
  async getCurrentUser() {
    return this.get('/users/me')
  }

  /**
   * 更新用户资料
   * @param {object} data - 更新数据
   * @returns {Promise<object>} - 更新后的用户资料
   */
  async updateProfile(data) {
    return this.put('/users/profile', data)
  }

  /**
   * 修改密码
   * @param {object} data - 包含当前密码和新密码的对象
   * @returns {Promise<object>} - 响应结果
   */
  async changePassword(data) {
    return this.put('/users/change-password', data)
  }
  
  /**
   * 获取创作者信息
   * @param {string} creatorId - 创作者ID
   * @returns {Promise<object>} - 创作者信息
   */
  async getCreatorProfile(creatorId) {
    return this.get(`/users/creator/${creatorId}`)
  }
  
  /**
   * 更新创作者信息
   * @param {object} data - 创作者信息
   * @returns {Promise<object>} - 更新后的创作者信息
   */
  async updateCreatorProfile(data) {
    return this.put('/users/creator-profile', data)
  }
}

export const userApiService = new UserApiService()
