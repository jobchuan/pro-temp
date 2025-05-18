// src/services/api/analyticsService.js
import { BaseApiService } from './base'

class AnalyticsApiService extends BaseApiService {
  /**
   * 获取分析概览
   * @returns {Promise<object>} - 分析概览数据
   */
  async getAnalyticsOverview() {
    return this.get('/creator/analytics/overview')
  }

  /**
   * 获取内容分析
   * @param {string} contentId - 内容ID
   * @param {string} period - 时间段
   * @returns {Promise<object>} - 内容分析数据
   */
  async getContentAnalytics(contentId, period) {
    return this.get(`/creator/analytics/contents/${contentId}`, { period })
  }

  /**
   * 获取分析趋势
   * @param {object} params - 查询参数
   * @returns {Promise<object>} - 分析趋势数据
   */
  async getAnalyticsTrends(params) {
    return this.get('/creator/analytics/trends', params)
  }

  /**
   * 获取受众分析
   * @returns {Promise<object>} - 受众分析数据
   */
  async getAudienceAnalytics() {
    return this.get('/creator/analytics/audience')
  }
  
  /**
   * 导出内容数据
   * @param {string} contentId - 内容ID
   * @param {string} format - 导出格式
   * @returns {Promise<Blob>} - 导出文件数据
   */
  async exportContentData(contentId, format) {
    return httpClient.get(`/creator/contents/${contentId}/export/${format}`, {
      responseType: 'blob'
    })
  }
}

export const analyticsApiService = new AnalyticsApiService()
