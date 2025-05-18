// src/services/api/base.js
import httpClient from '../http/client'

export class BaseApiService {
  /**
   * 执行GET请求
   * @param {string} url - 请求URL
   * @param {object} params - URL查询参数
   * @returns {Promise<object>} - 响应数据
   */
  async get(url, params) {
    return httpClient.get(url, { params })
  }

  /**
   * 执行POST请求
   * @param {string} url - 请求URL
   * @param {object} data - 请求体数据
   * @returns {Promise<object>} - 响应数据
   */
  async post(url, data) {
    return httpClient.post(url, data)
  }

  /**
   * 执行PUT请求
   * @param {string} url - 请求URL
   * @param {object} data - 请求体数据
   * @returns {Promise<object>} - 响应数据
   */
  async put(url, data) {
    return httpClient.put(url, data)
  }

  /**
   * 执行DELETE请求
   * @param {string} url - 请求URL
   * @returns {Promise<object>} - 响应数据
   */
  async delete(url) {
    return httpClient.delete(url)
  }

  /**
   * 上传单个文件
   * @param {string} url - 上传URL
   * @param {File} file - 文件对象
   * @param {function} onProgress - 进度回调函数
   * @returns {Promise<object>} - 响应数据
   */
  async upload(url, file, onProgress) {
    const formData = new FormData()
    formData.append('file', file)
    
    return httpClient.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(percentCompleted)
        }
      }
    })
  }
}
