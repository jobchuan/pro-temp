// src/services/api/uploadService.js
import { BaseApiService } from './base'
import httpClient from '../http/client'

class UploadApiService extends BaseApiService {
  /**
   * 单文件上传
   * @param {File} file - 要上传的文件
   * @param {function} onProgress - 进度回调函数
   * @returns {Promise<object>} - 上传结果
   */
  async uploadSingleFile(file, onProgress) {
    return this.upload('/upload/single', file, onProgress)
  }

  /**
   * 多文件上传
   * @param {Array<File>} files - 要上传的文件数组
   * @param {function} onProgress - 进度回调函数
   * @returns {Promise<object>} - 上传结果
   */
  async uploadMultipleFiles(files, onProgress) {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })
    
    return httpClient.post('/upload/multiple', formData, {
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

  /**
   * 初始化分片上传
   * @param {object} data - 初始化数据
   * @returns {Promise<object>} - 初始化结果
   */
  async initChunkUpload(data) {
    return this.post('/upload/chunk/init', data)
  }

  /**
   * 上传分片
   * @param {object} chunkData - 分片数据
   * @param {function} onProgress - 进度回调函数
   * @returns {Promise<object>} - 上传结果
   */
  async uploadChunk(chunkData, onProgress) {
    const formData = new FormData()
    formData.append('chunk', chunkData.chunk)
    formData.append('identifier', chunkData.identifier)
    formData.append('chunkNumber', chunkData.chunkNumber.toString())
    
    return httpClient.post('/upload/chunk/upload', formData, {
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

  /**
   * 完成分片上传
   * @param {string} identifier - 上传标识符
   * @returns {Promise<object>} - 完成结果
   */
  async completeChunkUpload(identifier) {
    return this.post('/upload/chunk/complete', { identifier })
  }

  /**
   * 取消上传
   * @param {string} identifier - 上传标识符
   * @returns {Promise<object>} - 取消结果
   */
  async cancelUpload(identifier) {
    return this.delete(`/upload/chunk/${identifier}`)
  }

  /**
   * 获取上传进度
   * @param {string} identifier - 上传标识符
   * @returns {Promise<object>} - 进度信息
   */
  async getUploadProgress(identifier) {
    return this.get(`/upload/chunk/${identifier}/progress`)
  }
}

export const uploadApiService = new UploadApiService()
