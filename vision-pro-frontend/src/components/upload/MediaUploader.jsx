// src/components/upload/MediaUploader.jsx
import React, { useState } from 'react'
import { Upload, Button, message, Progress, Space, Modal, Spin } from 'antd'
import { 
  UploadOutlined, 
  PauseCircleOutlined, 
  PlayCircleOutlined, 
  DeleteOutlined,
  FileImageOutlined,
  VideoCameraOutlined
} from '@ant-design/icons'
import { useSingleUpload, useChunkUpload } from '@/hooks/useUpload'
import './MediaUploader.less'

const MediaUploader = ({ 
  accept = '*/*', 
  maxSize = 8 * 1024 * 1024 * 1024, // 默认8GB
  label = '上传文件',
  onSuccess, 
  showPreview = true,
  previewUrl,
  disabled = false
}) => {
  const [fileList, setFileList] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [currentFile, setCurrentFile] = useState(null)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [confirmModalVisible, setConfirmModalVisible] = useState(false)
  
  const isImage = accept.includes('image/')
  const isVideo = accept.includes('video/')
  
  // 单文件上传hook
  const singleUpload = useSingleUpload()
  
  // 分片上传hook
  const chunkUpload = useChunkUpload()
  
  // 处理文件上传前检查
  const beforeUpload = (file) => {
    // 检查文件类型
    if (accept !== '*/*') {
      const acceptTypes = accept.split(',').map(type => type.trim())
      const isAcceptType = acceptTypes.some(type => {
        if (type.endsWith('/*')) {
          const mainType = type.replace('/*', '')
          return file.type.startsWith(mainType)
        }
        return file.type === type
      })
      
      if (!isAcceptType) {
        message.error(`文件类型不支持，请上传${accept}格式`)
        return Upload.LIST_IGNORE
      }
    }
    
    // 检查文件大小
    if (file.size > maxSize) {
      message.error(`文件过大，最大支持${formatFileSize(maxSize)}`)
      return Upload.LIST_IGNORE
    }
    
    setCurrentFile(file)
    
    // 大文件使用分片上传
    if (file.size > 5 * 1024 * 1024) { // 大于5MB的文件
      setFileList([file])
      startChunkUpload(file)
      return false // 阻止默认上传行为
    }
    
    // 小文件使用普通上传
    setFileList([file])
    startSingleUpload(file)
    return false // 阻止默认上传行为
  }
  
  // 开始单文件上传
  const startSingleUpload = async (file) => {
    setIsUploading(true)
    
    try {
      const result = await singleUpload.uploadAsync(file)
      setIsUploading(false)
      
      if (result?.success && result?.data) {
        message.success('上传成功')
        if (onSuccess) {
          onSuccess(result.data)
        }
      } else {
        message.error('上传失败: ' + (result?.message || '未知错误'))
      }
    } catch (error) {
      setIsUploading(false)
      message.error('上传失败: ' + error.message)
    }
  }
  
  // 开始分片上传
  const startChunkUpload = async (file) => {
    setIsUploading(true)
    
    try {
      const result = await chunkUpload.startUpload(file)
      setIsUploading(false)
      
      if (result) {
        message.success('上传成功')
        if (onSuccess) {
          onSuccess(result)
        }
      }
    } catch (error) {
      setIsUploading(false)
      message.error('上传失败: ' + error.message)
    }
  }
  
  // 取消上传
  const handleCancel = () => {
    if (chunkUpload.isUploading) {
      setConfirmModalVisible(true)
    } else {
      cancelUpload()
    }
  }
  
  // 确认取消上传
  const confirmCancelUpload = () => {
    cancelUpload()
    setConfirmModalVisible(false)
  }
  
  // 执行取消上传
  const cancelUpload = () => {
    if (chunkUpload.isUploading) {
      chunkUpload.cancelUpload()
    }
    setFileList([])
    setCurrentFile(null)
    setIsUploading(false)
  }
  
  // 暂停/继续上传
  const togglePause = () => {
    // 暂停/继续功能需要后端支持，这里是示例
    message.info('此功能需要后端支持')
  }
  
  // 预览文件
  const handlePreview = () => {
    if (previewUrl) {
      setPreviewVisible(true)
    } else {
      message.info('预览不可用')
    }
  }
  
  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B'
    
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]
  }
  
  // 获取上传进度和状态
  const getUploadProgress = () => {
    if (singleUpload.isUploading) {
      return singleUpload.progress
    }
    
    if (chunkUpload.isUploading) {
      return chunkUpload.progress
    }
    
    return 0
  }
  
  // 渲染上传状态
  const renderUploadStatus = () => {
    const progress = getUploadProgress()
    const isChunkUpload = currentFile && currentFile.size > 5 * 1024 * 1024
    
    return (
      <div className="upload-status">
        {currentFile && (
          <div className="file-info">
            <div className="file-icon">
              {isImage ? <FileImageOutlined /> : isVideo ? <VideoCameraOutlined /> : <FileImageOutlined />}
            </div>
            <div className="file-details">
              <div className="file-name">{currentFile.name}</div>
              <div className="file-meta">{formatFileSize(currentFile.size)}</div>
            </div>
          </div>
        )}
        
        <Progress
          percent={progress}
          status={isUploading ? 'active' : 'normal'}
          strokeColor={{
            from: '#108ee9',
            to: '#87d068',
          }}
        />
        
        {isUploading && (
          <div className="upload-actions">
            <Space>
              {isChunkUpload && (
                <Button
                  size="small"
                  icon={<PauseCircleOutlined />}
                  onClick={togglePause}
                >
                  暂停
                </Button>
              )}
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={handleCancel}
              >
                取消
              </Button>
            </Space>
          </div>
        )}
        
        {!isUploading && currentFile && (
          <div className="upload-complete">
            <Space>
              {showPreview && previewUrl && (
                <Button
                  size="small"
                  onClick={handlePreview}
                >
                  预览
                </Button>
              )}
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={cancelUpload}
              >
                删除
              </Button>
            </Space>
          </div>
        )}
      </div>
    )
  }
  
  // 渲染文件预览
  const renderPreview = () => {
    if (!previewVisible || !previewUrl) return null
    
    return (
      <Modal
        open={previewVisible}
        title="文件预览"
        footer={null}
        onCancel={() => setPreviewVisible(false)}
      >
        {isImage ? (
          <img alt="预览" style={{ width: '100%' }} src={previewUrl} />
        ) : isVideo ? (
          <video
            controls
            style={{ width: '100%' }}
            src={previewUrl}
          >
            您的浏览器不支持视频播放
          </video>
        ) : (
          <div className="file-preview-fallback">
            <FileImageOutlined />
            <p>此文件类型无法预览</p>
          </div>
        )}
      </Modal>
    )
  }
  
  return (
    <div className="media-uploader">
      {/* 上传按钮 */}
      {(!currentFile && !isUploading) && (
        <Upload
          beforeUpload={beforeUpload}
          fileList={fileList}
          showUploadList={false}
          accept={accept}
          disabled={disabled}
        >
          <Button 
            icon={<UploadOutlined />} 
            disabled={disabled}
          >
            {label}
          </Button>
        </Upload>
      )}
      
      {/* 上传状态 */}
      {(currentFile || isUploading) && renderUploadStatus()}
      
      {/* 预览模态框 */}
      {renderPreview()}
      
      {/* 取消确认对话框 */}
      <Modal
        title="确认取消"
        open={confirmModalVisible}
        onOk={confirmCancelUpload}
        onCancel={() => setConfirmModalVisible(false)}
      >
        <p>正在上传中，确定要取消吗？</p>
      </Modal>
    </div>
  )
}

export default MediaUploader
