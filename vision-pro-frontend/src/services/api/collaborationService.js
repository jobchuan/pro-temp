// src/services/api/collaborationService.js
import { BaseApiService } from './base'

class CollaborationApiService extends BaseApiService {
  /**
   * 获取协作项目列表
   * @param {object} params - 查询参数
   * @returns {Promise<object>} - 协作项目列表
   */
  async getCollaborations(params) {
    return this.get('/creator/collaborations', params)
  }

  /**
   * 创建协作项目
   * @param {object} data - 协作项目数据
   * @returns {Promise<object>} - 创建的协作项目
   */
  async createCollaboration(data) {
    return this.post('/creator/collaborations', data)
  }

  /**
   * 获取协作项目详情
   * @param {string} collaborationId - 协作项目ID
   * @returns {Promise<object>} - 协作项目详情
   */
  async getCollaborationDetail(collaborationId) {
    return this.get(`/creator/collaborations/${collaborationId}`)
  }

  /**
   * 更新协作项目
   * @param {string} collaborationId - 协作项目ID
   * @param {object} data - 更新数据
   * @returns {Promise<object>} - 更新后的协作项目
   */
  async updateCollaboration(collaborationId, data) {
    return this.put(`/creator/collaborations/${collaborationId}`, data)
  }

  /**
   * 删除协作项目
   * @param {string} collaborationId - 协作项目ID
   * @returns {Promise<object>} - 删除响应
   */
  async deleteCollaboration(collaborationId) {
    return this.delete(`/creator/collaborations/${collaborationId}`)
  }

  /**
   * 获取协作者列表
   * @param {string} collaborationId - 协作项目ID
   * @returns {Promise<object>} - 协作者列表
   */
  async getCollaborators(collaborationId) {
    return this.get(`/creator/collaborations/${collaborationId}/collaborators`)
  }

  /**
   * 邀请协作者
   * @param {object} data - 邀请数据
   * @returns {Promise<object>} - 邀请响应
   */
  async inviteCollaborator(data) {
    return this.post('/creator/collaborations/invite', data)
  }

  /**
   * 移除协作者
   * @param {string} collaborationId - 协作项目ID
   * @param {string} collaboratorId - 协作者ID
   * @returns {Promise<object>} - 移除响应
   */
  async removeCollaborator(collaborationId, collaboratorId) {
    return this.delete(`/creator/collaborations/${collaborationId}/collaborators/${collaboratorId}`)
  }

  /**
   * 更新协作者角色
   * @param {string} collaborationId - 协作项目ID
   * @param {string} collaboratorId - 协作者ID
   * @param {string} role - 新角色
   * @returns {Promise<object>} - 更新响应
   */
  async updateCollaboratorRole(collaborationId, collaboratorId, role) {
    return this.put(`/creator/collaborations/${collaborationId}/collaborators/${collaboratorId}`, { role })
  }

  /**
   * 获取协作项目内容列表
   * @param {string} collaborationId - 协作项目ID
   * @returns {Promise<object>} - 内容列表
   */
  async getCollaborationContents(collaborationId) {
    return this.get(`/creator/collaborations/${collaborationId}/contents`)
  }

  /**
   * 添加内容到协作项目
   * @param {string} collaborationId - 协作项目ID
   * @param {string} contentId - 内容ID
   * @returns {Promise<object>} - 添加响应
   */
  async addContentToCollaboration(collaborationId, contentId) {
    return this.post(`/creator/collaborations/${collaborationId}/contents`, { contentId })
  }

  /**
   * 从协作项目移除内容
   * @param {string} collaborationId - 协作项目ID
   * @param {string} contentId - 内容ID
   * @returns {Promise<object>} - 移除响应
   */
  async removeContentFromCollaboration(collaborationId, contentId) {
    return this.delete(`/creator/collaborations/${collaborationId}/contents/${contentId}`)
  }

  /**
   * 获取协作项目活动历史
   * @param {string} collaborationId - 协作项目ID
   * @returns {Promise<object>} - 活动历史
   */
  async getCollaborationActivities(collaborationId) {
    return this.get(`/creator/collaborations/${collaborationId}/activities`)
  }

  /**
   * 发送消息到协作项目
   * @param {object} data - 消息数据
   * @returns {Promise<object>} - 发送响应
   */
  async sendMessage(data) {
    return this.post('/creator/collaborations/message', data)
  }

  /**
   * 更新协作项目状态
   * @param {string} collaborationId - 协作项目ID
   * @param {string} status - 新状态
   * @returns {Promise<object>} - 更新响应
   */
  async updateCollaborationStatus(collaborationId, status) {
    return this.put(`/creator/collaborations/${collaborationId}/status`, { status })
  }
  
  /**
   * 响应协作邀请
   * @param {string} inviteId - 邀请ID
   * @param {boolean} accept - 是否接受
   * @returns {Promise<object>} - 响应结果
   */
  async respondToInvite(inviteId, accept) {
    return this.post(`/creator/collaborations/invites/${inviteId}/respond`, { accept })
  }
  
  /**
   * 获取邀请列表
   * @returns {Promise<object>} - 邀请列表
   */
  async getInvites() {
    return this.get('/creator/collaborations/invites')
  }
}

export const collaborationApiService = new CollaborationApiService()
