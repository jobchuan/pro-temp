// src/services/api/commentService.js
import { BaseApiService } from './base'

class CommentApiService extends BaseApiService {
  /**
   * 获取评论列表
   * @param {object} params - 查询参数
   * @returns {Promise<object>} - 评论列表
   */
  async getComments(params) {
    return this.get('/creator/comments', params)
  }

  /**
   * 获取创作者收到的评论
   * @param {object} params - 查询参数
   * @returns {Promise<object>} - 评论列表
   */
  async getCreatorComments(params) {
    return this.get('/creator/comments/received', params)
  }

  /**
   * 获取评论详情
   * @param {string} commentId - 评论ID
   * @returns {Promise<object>} - 评论详情
   */
  async getCommentDetail(commentId) {
    return this.get(`/creator/comments/${commentId}`)
  }

  /**
   * 回复评论
   * @param {object} data - 回复数据
   * @returns {Promise<object>} - 回复结果
   */
  async replyComment(data) {
    return this.post('/creator/comments/reply', data)
  }

  /**
   * 更新评论状态
   * @param {string} commentId - 评论ID
   * @param {string} status - 新状态
   * @returns {Promise<object>} - 更新结果
   */
  async updateCommentStatus(commentId, status) {
    return this.put(`/creator/comments/${commentId}/status`, { status })
  }

  /**
   * 删除评论
   * @param {string} commentId - 评论ID
   * @returns {Promise<object>} - 删除结果
   */
  async deleteComment(commentId) {
    return this.delete(`/creator/comments/${commentId}`)
  }

  /**
   * 获取评论举报
   * @param {string} commentId - 评论ID
   * @returns {Promise<object>} - 举报列表
   */
  async getCommentReports(commentId) {
    return this.get(`/creator/comments/${commentId}/reports`)
  }

  /**
   * 获取内容的评论
   * @param {string} contentId - 内容ID
   * @param {object} params - 查询参数
   * @returns {Promise<object>} - 评论列表
   */
  async getContentComments(contentId, params) {
    return this.get(`/contents/${contentId}/comments`, params)
  }

  /**
   * 发表评论
   * @param {object} data - 评论数据
   * @returns {Promise<object>} - 发表结果
   */
  async postComment(data) {
    return this.post('/comments', data)
  }

  /**
   * 喜欢评论
   * @param {string} commentId - 评论ID
   * @returns {Promise<object>} - 操作结果
   */
  async likeComment(commentId) {
    return this.post(`/comments/${commentId}/like`)
  }

  /**
   * 取消喜欢评论
   * @param {string} commentId - 评论ID
   * @returns {Promise<object>} - 操作结果
   */
  async unlikeComment(commentId) {
    return this.delete(`/comments/${commentId}/like`)
  }

  /**
   * 举报评论
   * @param {string} commentId - 评论ID
   * @param {object} data - 举报数据
   * @returns {Promise<object>} - 举报结果
   */
  async reportComment(commentId, data) {
    return this.post(`/comments/${commentId}/report`, data)
  }

  /**
   * 获取评论统计
   * @returns {Promise<object>} - 评论统计
   */
  async getCommentStats() {
    return this.get('/creator/comments/stats')
  }

  /**
   * 批量更新评论状态
   * @param {object} data - 更新数据
   * @returns {Promise<object>} - 更新结果
   */
  async batchUpdateCommentStatus(data) {
    return this.put('/creator/comments/batch/status', data)
  }
}

export const commentApiService = new CommentApiService()
