// src/hooks/useUpload.js
import { useState, useCallback } from 'react'
import { useQuery, useMutation } from 'react-query'
import { message } from 'antd'
import { uploadApiService } from '@/services/api/uploadService'

/**
 * 单文件上传Hook
 * @returns {object} - 上传控制对象
 */
export const useSingleUpload = () => {
  const [progress, setProgress] = useState(0)
  
  // 上传mutation
  const mutation = useMutation(
    (file) => uploadApiService.uploadSingleFile(file, setProgress),
    {
      onError: (error) => {
        message.error('上传失败：' + (error.message || '未知错误'))
        setProgress(0)
      }
    }
  )
  
  return {
    upload: mutation.mutate,          // 触发上传
    uploadAsync: mutation.mutateAsync, // Promise方式触发上传
    isUploading: mutation.isLoading,  // 上传中状态
    result: mutation.data,            // 上传结果
    error: mutation.error,            // 上传错误
    progress,                         // 上传进度
    reset: () => {                    // 重置状态
      mutation.reset()
      setProgress(0)
    }
  }
}

/**
 * 多文件上传Hook
 * @returns {object} - 上传控制对象
 */
export const useMultipleUpload = () => {
  const [progress, setProgress] = useState(0)
  
  // 上传mutation
  const mutation = useMutation(
    (files) => uploadApiService.uploadMultipleFiles(files, setProgress),
    {
      onError: (error) => {
        message.error('上传失败：' + (error.message || '未知错误'))
        setProgress(0)
      }
    }
  )
  
  return {
    upload: mutation.mutate,
    uploadAsync: mutation.mutateAsync,
    isUploading: mutation.isLoading,
    result: mutation.data,
    error: mutation.error,
    progress,
    reset: () => {
      mutation.reset()
      setProgress(0)
    }
  }
}

/**
 * 分片上传Hook
 * @returns {object} - 分片上传控制对象
 */
export const useChunkUpload = () => {
  const [identifier, setIdentifier] = useState(null)
  const [totalProgress, setTotalProgress] = useState(0)
  const [status, setStatus] = useState('idle') // idle, initializing, uploading, completing, completed, error
  
  // 初始化上传mutation
  const initMutation = useMutation(
    (data) => uploadApiService.initChunkUpload(data),
    {
      onSuccess: (response) => {
        if (response.success && response.data) {
          setIdentifier(response.data.identifier)
          setStatus('uploading')
          return response.data
        }
        throw new Error('初始化失败：' + (response.message || '未知错误'))
      },
      onError: (error) => {
        setStatus('error')
        message.error('初始化上传失败：' + (error.message || '未知错误'))
      }
    }
  )
  
  // 上传分片mutation
  const uploadChunkMutation = useMutation(
    (chunkData) => uploadApiService.uploadChunk(chunkData)
  )
  
  // 完成上传mutation
  const completeUploadMutation = useMutation(
    (identifier) => uploadApiService.completeChunkUpload(identifier),
    {
      onSuccess: (response) => {
        if (response.success) {
          setStatus('completed')
          setTotalProgress(100)
          return response.data
        }
        throw new Error('完成上传失败：' + (response.message || '未知错误'))
      },
      onError: (error) => {
        setStatus('error')
        message.error('完成上传失败：' + (error.message || '未知错误'))
      }
    }
  )
  
  // 取消上传mutation
  const cancelUploadMutation = useMutation(
    (identifier) => uploadApiService.cancelUpload(identifier),
    {
      onSuccess: () => {
        reset()
        message.info('上传已取消')
      }
    }
  )
  
  // 获取上传进度
  const { data: progressData, refetch: refetchProgress } = useQuery(
    ['uploadProgress', identifier],
    () => uploadApiService.getUploadProgress(identifier),
    {
      enabled: !!identifier && status === 'uploading',
      refetchInterval: 2000, // 每2秒查询一次
      onSuccess: (response) => {
        if (response.success && response.data) {
          const progress = parseInt(response.data.progress) || 0
          setTotalProgress(progress)
        }
      }
    }
  )
  
  // 重置状态
  const reset = useCallback(() => {
    setIdentifier(null)
    setTotalProgress(0)
    setStatus('idle')
    initMutation.reset()
    uploadChunkMutation.reset()
    completeUploadMutation.reset()
  }, [initMutation, uploadChunkMutation, completeUploadMutation])
  
  // 开始上传
  const startUpload = useCallback(async (file, chunkSize = 5 * 1024 * 1024) => {
    try {
      setStatus('initializing')
      
      // 计算分片数量
      const totalChunks = Math.ceil(file.size / chunkSize)
      
      // 初始化上传
      const initResponse = await initMutation.mutateAsync({
        fileName: file.name,
        fileSize: file.size,
        chunkSize,
        totalChunks
      })
      
      if (!initResponse.success || !initResponse.data) {
        throw new Error('初始化上传失败')
      }
      
      const uploadIdentifier = initResponse.data.identifier
      setIdentifier(uploadIdentifier)
      
      // 上传分片
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize
        const end = Math.min(start + chunkSize, file.size)
        const chunk = file.slice(start, end)
        
        await uploadChunkMutation.mutateAsync({
          chunk,
          identifier: uploadIdentifier,
          chunkNumber: i + 1
        })
        
        // 刷新进度
        await refetchProgress()
      }
      
      // 完成上传
      setStatus('completing')
      const completeResponse = await completeUploadMutation.mutateAsync(uploadIdentifier)
      
      return completeResponse.data
    } catch (error) {
      setStatus('error')
      message.error('上传失败：' + (error.message || '未知错误'))
      throw error
    }
  }, [initMutation, uploadChunkMutation, completeUploadMutation, refetchProgress])
  
  // 取消上传
  const cancelUpload = useCallback(() => {
    if (identifier) {
      cancelUploadMutation.mutate(identifier)
    } else {
      reset()
    }
  }, [identifier, cancelUploadMutation, reset])
  
  return {
    startUpload,      // 开始上传函数
    cancelUpload,     // 取消上传函数
    progress: totalProgress, // 总进度
    status,           // 上传状态
    isUploading: status === 'initializing' || status === 'uploading' || status === 'completing', // 是否正在上传
    result: completeUploadMutation.data?.data, // 上传结果
    error: initMutation.error || uploadChunkMutation.error || completeUploadMutation.error, // 错误
    reset             // 重置函数
  }
}
