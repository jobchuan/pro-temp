// src/services/api/fusionService.js
import { BaseApiService } from './base'

class FusionApiService extends BaseApiService {
  /**
   * 获取融合内容列表
   * @param {object} params - 查询参数
   * @returns {Promise<object>} - 融合内容列表
   */
  async getFusions(params) {
    return this.get('/fusions', params)
  }

  /**
   * 创建融合内容
   * @param {object} data - 融合内容数据
   * @returns {Promise<object>} - 创建的融合内容
   */
  async createFusion(data) {
    return this.post('/fusions', data)
  }

  /**
   * 获取融合内容详情
   * @param {string} fusionId - 融合内容ID
   * @returns {Promise<object>} - 融合内容详情
   */
  async getFusionDetail(fusionId) {
    return this.get(`/fusions/${fusionId}`)
  }

  /**
   * 更新融合内容
   * @param {string} fusionId - 融合内容ID
   * @param {object} data - 更新数据
   * @returns {Promise<object>} - 更新后的融合内容
   */
  async updateFusion(fusionId, data) {
    return this.put(`/fusions/${fusionId}`, data)
  }

  /**
   * 删除融合内容
   * @param {string} fusionId - 融合内容ID
   * @returns {Promise<object>} - 删除响应
   */
  async deleteFusion(fusionId) {
    return this.delete(`/fusions/${fusionId}`)
  }

  /**
   * 发布融合内容
   * @param {string} fusionId - 融合内容ID
   * @returns {Promise<object>} - 发布响应
   */
  async publishFusion(fusionId) {
    return this.post(`/fusions/${fusionId}/publish`)
  }

  /**
   * 获取融合内容源列表
   * @param {string} fusionId - 融合内容ID
   * @returns {Promise<object>} - 源列表
   */
  async getFusionSources(fusionId) {
    return this.get(`/fusions/${fusionId}/sources`)
  }

  /**
   * 添加融合内容源
   * @param {string} fusionId - 融合内容ID
   * @param {object} data - 源数据
   * @returns {Promise<object>} - 添加响应
   */
  async addFusionSource(fusionId, data) {
    return this.post(`/fusions/${fusionId}/sources`, data)
  }

  /**
   * 更新融合内容源
   * @param {string} fusionId - 融合内容ID
   * @param {string} sourceId - 源ID
   * @param {object} data - 更新数据
   * @returns {Promise<object>} - 更新响应
   */
  async updateFusionSource(fusionId, sourceId, data) {
    return this.put(`/fusions/${fusionId}/sources/${sourceId}`, data)
  }

  /**
   * 删除融合内容源
   * @param {string} fusionId - 融合内容ID
   * @param {string} sourceId - 源ID
   * @returns {Promise<object>} - 删除响应
   */
  async deleteFusionSource(fusionId, sourceId) {
    return this.delete(`/fusions/${fusionId}/sources/${sourceId}`)
  }

  /**
   * 更新融合内容源顺序
   * @param {string} fusionId - 融合内容ID
   * @param {Array<object>} sources - 源顺序数据
   * @returns {Promise<object>} - 更新响应
   */
  async updateFusionSourceOrder(fusionId, sources) {
    return this.put(`/fusions/${fusionId}/sources/order`, { sources })
  }

  /**
   * 获取融合内容分析数据
   * @param {string} fusionId - 融合内容ID
   * @param {object} params - 查询参数
   * @returns {Promise<object>} - 分析数据
   */
  async getFusionAnalytics(fusionId, params) {
    return this.get(`/fusions/${fusionId}/analytics`, params)
  }

  /**
   * 上传融合内容缩略图
   * @param {string} fusionId - 融合内容ID
   * @param {File} file - 缩略图文件
   * @param {function} onProgress - 进度回调函数
   * @returns {Promise<object>} - 上传响应
   */
  async uploadFusionThumbnail(fusionId, file, onProgress) {
    const formData = new FormData()
    formData.append('thumbnail', file)
    
    return this.upload(`/fusions/${fusionId}/thumbnail`, formData, onProgress)
  }

  /**
   * 获取融合内容分享链接
   * @param {string} fusionId - 融合内容ID
   * @returns {Promise<object>} - 分享链接
   */
  async getFusionShareLink(fusionId) {
    return this.get(`/fusions/${fusionId}/share`)
  }

  /**
   * 更新融合内容权限设置
   * @param {string} fusionId - 融合内容ID
   * @param {object} permissions - 权限设置
   * @returns {Promise<object>} - 更新响应
   */
  async updateFusionPermissions(fusionId, permissions) {
    return this.put(`/fusions/${fusionId}/permissions`, permissions)
  }
}

export const fusionApiService = new FusionApiService()
