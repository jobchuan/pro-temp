// src/services/api/tagsService.js
import { BaseApiService } from './base'

class TagsApiService extends BaseApiService {
  /**
   * 获取常用标签
   * @returns {Promise<object>} - 常用标签列表
   */
  async getCommonTags() {
    return this.get('/tags/common')
  }

  /**
   * 获取用户常用标签
   * @returns {Promise<object>} - 用户常用标签列表
   */
  async getUserTags() {
    return this.get('/tags/user')
  }

  /**
   * 获取标签建议
   * @param {string} query - 搜索关键词
   * @returns {Promise<object>} - 标签建议列表
   */
  async getTagSuggestions(query) {
    return this.get('/tags/suggestions', { query })
  }
}

export const tagsApiService = new TagsApiService()
