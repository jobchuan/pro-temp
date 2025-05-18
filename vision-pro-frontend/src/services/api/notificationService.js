// src/services/api/notificationService.js
import { BaseApiService } from './base'

class NotificationApiService extends BaseApiService {
  /**
   * 获取通知列表
   * @param {object} params - 查询参数
   * @returns {Promise<object>} - 通知列表和分页信息
   */
  async getNotifications(params) {
    return this.get('/notifications', params)
  }

  /**
   * 获取未读通知数量
   * @returns {Promise<object>} - 未读通知数量
   */
  async getUnreadCount() {
    return this.get('/notifications/unread/count')
  }

  /**
   * 标记通知为已读
   * @param {string} notificationId - 通知ID
   * @returns {Promise<object>} - 操作结果
   */
  async markAsRead(notificationId) {
    return this.put(`/notifications/${notificationId}/read`)
  }

  /**
   * 标记所有通知为已读
   * @returns {Promise<object>} - 操作结果
   */
  async markAllAsRead() {
    return this.put('/notifications/read-all')
  }

  /**
   * 删除通知
   * @param {string} notificationId - 通知ID
   * @returns {Promise<object>} - 操作结果
   */
  async deleteNotification(notificationId) {
    return this.delete(`/notifications/${notificationId}`)
  }
  
  /**
   * 获取通知设置
   * @returns {Promise<object>} - 通知设置
   */
  async getNotificationSettings() {
    return this.get('/notifications/settings')
  }
  
  /**
   * 更新通知设置
   * @param {object} settings - 通知设置
   * @returns {Promise<object>} - 操作结果
   */
  async updateNotificationSettings(settings) {
    return this.put('/notifications/settings', settings)
  }
}

export const notificationApiService = new NotificationApiService()
