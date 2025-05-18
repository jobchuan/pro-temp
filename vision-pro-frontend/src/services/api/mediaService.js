// src/services/api/mediaService.js
import { BaseApiService } from './base'
import httpClient from '../http/client'

class MediaApiService extends BaseApiService {
  /**
   * 获取媒体资源列表
   * @param {object} params - 查询参数
   * @returns {Promise<object>} - 媒体资源列表
   */
  async getMediaList(params) {
    return this.get('/media', params)
  }

  /**
   * 上传单个媒体文件
   * @param {File} file - 文件对象
   * @param {string} folderId - 文件夹ID
   * @param {object} metadata - 媒体元数据
   * @param {function} onProgress - 上传进度回调
   * @returns {Promise<object>} - 上传结果
   */
  async uploadMedia(file, folderId, metadata, onProgress) {
    const formData = new FormData()
    formData.append('file', file)
    
    if (folderId) {
      formData.append('folderId', folderId)
    }
    
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata))
    }
    
    return httpClient.post('/media/upload', formData, {
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
   * 上传VR媒体文件
   * @param {File} file - 文件对象
   * @param {string} mediaType - 媒体类型
   * @param {string} folderId - 文件夹ID
   * @param {object} metadata - 媒体元数据
   * @param {function} onProgress - 上传进度回调
   * @returns {Promise<object>} - 上传结果
   */
  async uploadVRMedia(file, mediaType, folderId, metadata, onProgress) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('mediaType', mediaType)
    
    if (folderId) {
      formData.append('folderId', folderId)
    }
    
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata))
    }
    
    return httpClient.post('/media/vr/upload', formData, {
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
   * 创建文件夹
   * @param {object} data - 文件夹数据
   * @returns {Promise<object>} - 创建结果
   */
  async createFolder(data) {
    return this.post('/media/folder', data)
  }

  /**
   * 获取文件夹详情
   * @param {string} folderId - 文件夹ID
   * @returns {Promise<object>} - 文件夹详情
   */
  async getFolderDetail(folderId) {
    return this.get(`/media/folder/${folderId}`)
  }

  /**
   * 重命名文件夹
   * @param {string} folderId - 文件夹ID
   * @param {object} data - 更新数据
   * @returns {Promise<object>} - 更新结果
   */
  async renameFolder(folderId, data) {
    return this.put(`/media/folder/${folderId}`, data)
  }

  /**
   * 重命名媒体资源
   * @param {string} mediaId - 媒体资源ID
   * @param {object} data - 更新数据
   * @returns {Promise<object>} - 更新结果
   */
  async renameMedia(mediaId, data) {
    return this.put(`/media/${mediaId}`, data)
  }

  /**
   * 更新媒体资源元数据
   * @param {string} mediaId - 媒体资源ID
   * @param {object} metadata - 媒体元数据
   * @returns {Promise<object>} - 更新结果
   */
  async updateMediaMetadata(mediaId, metadata) {
    return this.put(`/media/${mediaId}/metadata`, metadata)
  }

  /**
   * 移动媒体资源
   * @param {Array<object>} items - 要移动的资源列表
   * @param {string} targetFolderId - 目标文件夹ID
   * @returns {Promise<object>} - 移动结果
   */
  async moveItems(items, targetFolderId) {
    return this.post('/media/move', {
      items,
      targetFolderId
    })
  }

  /**
   * 复制媒体资源
   * @param {Array<string>} mediaIds - 要复制的媒体资源ID
   * @param {string} targetFolderId - 目标文件夹ID
   * @returns {Promise<object>} - 复制结果
   */
  async copyMedia(mediaIds, targetFolderId) {
    return this.post('/media/copy', {
      mediaIds,
      targetFolderId
    })
  }

  /**
   * 删除资源（文件夹或媒体）
   * @param {Array<object>} items - 要删除的资源列表
   * @returns {Promise<object>} - 删除结果
   */
  async deleteItems(items) {
    return this.post('/media/delete', { items })
  }
  
  /**
   * 获取媒体资源用量统计
   * @returns {Promise<object>} - 用量统计
   */
  async getStorageUsage() {
    return this.get('/media/storage-usage')
  }
}

export const mediaApiService = new MediaApiService()
