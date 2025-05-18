// src/services/api/contentService.js
import { BaseApiService } from './base'

class ContentApiService extends BaseApiService {
  /**
   * 获取内容列表
   * @param {object} params - 查询参数
   * @returns {Promise<object>} - 内容列表和分页信息
   */
  async getContentList(params) {
    return this.get('/contents', params)
  }

  /**
   * 获取用户内容列表
   * @param {object} params - 查询参数
   * @returns {Promise<object>} - 用户内容列表和分页信息
   */
  async getUserContentList(params) {
    return this.get('/contents/user', params)
  }

  /**
   * 创建新内容
   * @param {object} data - 内容数据
   * @returns {Promise<object>} - 创建的内容
   */
  async createContent(data) {
    return this.post('/contents', data)
  }

  /**
   * 获取内容详情
   * @param {string} contentId - 内容ID
   * @returns {Promise<object>} - 内容详情
   */
  async getContentDetail(contentId) {
    return this.get(`/contents/${contentId}`)
  }

  /**
   * 更新内容
   * @param {string} contentId - 内容ID
   * @param {object} data - 更新数据
   * @returns {Promise<object>} - 更新后的内容
   */
  async updateContent(contentId, data) {
    return this.put(`/contents/${contentId}`, data)
  }

  /**
   * 删除内容
   * @param {string} contentId - 内容ID
   * @returns {Promise<object>} - 删除响应
   */
  async deleteContent(contentId) {
    return this.delete(`/contents/${contentId}`)
  }
  
  /**
   * 批量更新内容状态
   * @param {Array<string>} contentIds - 内容ID数组
   * @param {string} status - 目标状态
   * @returns {Promise<object>} - 更新响应
   */
  async batchUpdateStatus(contentIds, status) {
    return this.put('/creator/contents/batch/status', {
      contentIds,
      status
    })
  }
  
  /**
   * 批量添加标签
   * @param {Array<string>} contentIds - 内容ID数组
   * @param {Array<string>} tags - 标签数组
   * @returns {Promise<object>} - 更新响应
   */
  async batchAddTags(contentIds, tags) {
    return this.put('/creator/contents/batch/tags/add', {
      contentIds,
      tags
    })
  }
}

export const contentApiService = new ContentApiService()
