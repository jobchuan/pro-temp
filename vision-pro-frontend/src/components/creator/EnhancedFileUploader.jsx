// components/creator/EnhancedFileUploader.jsx
import React, { useState, useEffect, useRef } from 'react';
import { uploadApi } from '../../services/apiService';
import { 
  generateFileIdentifier, 
  sliceFile, 
  saveUploadState, 
  getUploadState, 
  clearUploadState,
  getFileCategory
} from '../../utils/fileUtils';

const EnhancedFileUploader = ({ 
  onFileUpload, 
  accept, 
  currentFile, 
  maxFileSize = 1024 * 1024 * 1024, // 默认最大1GB
  chunkSize = 2 * 1024 * 1024, // 默认2MB一块
  fileCategory = 'content', // 文件类别：content, thumbnail 等
  contentType = '180_video' // 内容类型，用于显示适当的提示
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [resumable, setResumable] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [processingStatus, setProcessingStatus] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  
  const abortControllerRef = useRef(null);
  const chunksRef = useRef([]);
  const totalChunksRef = useRef(0);
  const uploadedChunksRef = useRef([]);
  const processingIntervalRef = useRef(null);
  
  // 检查是否可以恢复上传
  useEffect(() => {
    if (selectedFile) {
      const fileId = generateFileIdentifier(selectedFile);
      setIdentifier(fileId);
      
      const savedState = getUploadState(fileId);
      if (savedState && savedState.fileName === selectedFile.name) {
        setResumable(true);
        setUploadStatus(`发现之前上传的记录，可以继续上传`);
        uploadedChunksRef.current = savedState.uploadedChunks || [];
      } else {
        setResumable(false);
        setUploadStatus('');
        uploadedChunksRef.current = [];
      }
    }
  }, [selectedFile]);
  
  useEffect(() => {
    // 组件卸载时清除处理状态轮询
    return () => {
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
      }
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // 检查文件大小
    if (file.size > maxFileSize) {
      setUploadError(`文件大小超过限制（最大 ${(maxFileSize / (1024 * 1024)).toFixed(2)} MB）`);
      return;
    }
    
    // 检查文件类型
    if (accept && !validateFileType(file, accept)) {
      setUploadError(`文件类型不支持。请上传 ${accept.replace(/\./g, '')} 格式的文件`);
      return;
    }
    
    setSelectedFile(file);
    setUploadProgress(0);
    setUploadError('');
    setUploadStatus('准备上传');
    setProcessingStatus('');
    setProcessingProgress(0);
  };
  
  const validateFileType = (file, accept) => {
    // 将accept字符串转换为数组
    const acceptedTypes = accept.split(',').map(type => type.trim().toLowerCase());
    
    // 如果accept包含通配符如image/*或video/*
    if (acceptedTypes.includes('image/*') && file.type.startsWith('image/')) return true;
    if (acceptedTypes.includes('video/*') && file.type.startsWith('video/')) return true;
    
    // 检查文件的MIME类型
    if (acceptedTypes.includes(file.type.toLowerCase())) return true;
    
    // 检查文件扩展名
    const fileExtension = `.${file.name.split('.').pop().toLowerCase()}`;
    if (acceptedTypes.includes(fileExtension)) return true;
    
    return false;
  };
  
  const startUpload = async (resume = false) => {
    if (!selectedFile) return;
    
    try {
      setIsUploading(true);
      setUploadError('');
      
      // 创建中止控制器
      abortControllerRef.current = new AbortController();
      
      // 切分文件
      const chunks = sliceFile(selectedFile, chunkSize);
      chunksRef.current = chunks;
      totalChunksRef.current = chunks.length;
      
      // 初始化上传
      const initResponse = await uploadApi.initChunkUpload({
        filename: selectedFile.name,
        fileType: selectedFile.type,
        fileSize: selectedFile.size,
        totalChunks: chunks.length,
        identifier,
        category: fileCategory,
        contentType: contentType // 传递内容类型
      });
      
      // 如果恢复上传，使用保存的已上传块信息
      if (resume && uploadedChunksRef.current.length > 0) {
        setUploadStatus(`继续上传，从第 ${uploadedChunksRef.current.length + 1}/${chunks.length} 个分片开始`);
      } else {
        uploadedChunksRef.current = [];
        setUploadStatus('开始上传');
      }
      
      // 上传所有分片
      await uploadChunks();
      
    } catch (error) {
      console.error('上传初始化失败:', error);
      setUploadError(error.response?.data?.message || '上传初始化失败');
      setIsUploading(false);
    }
  };
  
  const uploadChunks = async () => {
    try {
      const chunks = chunksRef.current;
      const totalChunks = totalChunksRef.current;
      
      // 保存上传状态用于断点续传
      saveUploadState(identifier, {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        totalChunks,
        uploadedChunks: uploadedChunksRef.current
      });
      
      // 计算上传起始时间，用于显示上传速度
      const startTime = Date.now();
      let lastChunkTime = startTime;
      let uploadSpeeds = [];
      
      // 逐个上传分片
      for (let i = 0; i < totalChunks; i++) {
        // 如果该分片已上传，则跳过
        if (uploadedChunksRef.current.includes(i)) {
          continue;
        }
        
        setUploadStatus(`上传分片 ${i + 1}/${totalChunks}`);
        
        // 记录当前分片的上传开始时间
        const chunkStartTime = Date.now();
        
        try {
          // 修改：确保FormData格式正确
          const formData = new FormData();
          formData.append('chunk', chunks[i]);
          formData.append('chunkNumber', i.toString());
          formData.append('totalChunks', totalChunks.toString());
          formData.append('identifier', identifier);
          formData.append('filename', selectedFile.name);
          
          await uploadApi.uploadChunk(formData, (progress) => {
            // 计算总体进度
            const completedChunks = [...uploadedChunksRef.current];
            if (!completedChunks.includes(i)) {
              completedChunks.push(i);
            }
            const overallProgress = 
              (completedChunks.length - 1 + progress / 100) / totalChunks * 100;
            setUploadProgress(Math.round(overallProgress));
          });
          
          // 记录当前分片的上传结束时间
          const chunkEndTime = Date.now();
          const chunkSize = chunks[i].size;
          const chunkTimeElapsed = chunkEndTime - chunkStartTime;
          const uploadSpeed = chunkSize / (chunkTimeElapsed / 1000);
          
          // 添加到上传速度历史记录
          uploadSpeeds.push(uploadSpeed);
          
          // 只保留最近5个分片的速度记录
          if (uploadSpeeds.length > 5) {
            uploadSpeeds.shift();
          }
          
          // 计算平均上传速度
          const avgSpeed = uploadSpeeds.reduce((a, b) => a + b, 0) / uploadSpeeds.length;
          const speedText = formatSpeed(avgSpeed);
          
          // 估算剩余时间
          const remainingChunks = totalChunks - uploadedChunksRef.current.length - 1;
          const remainingSize = remainingChunks * chunks[i].size;
          const estimatedTime = remainingSize / avgSpeed;
          const timeText = formatTime(estimatedTime);
          
          setUploadStatus(`上传分片 ${i + 1}/${totalChunks} - ${speedText} - 剩余时间约 ${timeText}`);
          
          // 添加到已上传分片列表
          uploadedChunksRef.current.push(i);
          
          // 更新断点续传信息
          saveUploadState(identifier, {
            fileName: selectedFile.name,
            fileSize: selectedFile.size,
            totalChunks,
            uploadedChunks: uploadedChunksRef.current
          });
        } catch (error) {
          console.error(`分片${i}上传失败:`, error);
          setUploadError(`分片${i+1}上传失败: ${error.response?.data?.message || error.message || '未知错误'}`);
          throw error; // 重新抛出错误以中断上传过程
        }
      }
      
      // 所有分片上传完成，通知服务器合并
      setUploadStatus('完成上传，正在处理文件...');
      
      const completeResponse = await uploadApi.completeChunkUpload({
        identifier,
        filename: selectedFile.name,
        fileType: selectedFile.type,
        totalChunks,
        contentType // 传递内容类型
      });
      
      // 清除断点续传记录
      clearUploadState(identifier);
      
      // 设置为完成状态
      setUploadProgress(100);
      
      // 开始轮询处理进度
      if (fileCategory === 'main' && selectedFile.type.startsWith('video')) {
        const processId = completeResponse.data.data.processId;
        if (processId) {
          startProcessingPolling(processId);
        } else {
          setUploadStatus('上传成功');
          setIsUploading(false);
          
          // 通知父组件上传完成
          if (completeResponse.data.success) {
            const fileData = completeResponse.data.data;
            onFileUpload({
              url: fileData.url,
              size: selectedFile.size,
              name: selectedFile.name,
              type: selectedFile.type
            });
          }
        }
      } else {
        setUploadStatus('上传成功');
        setIsUploading(false);
        
        // 通知父组件上传完成
        if (completeResponse.data.success) {
          const fileData = completeResponse.data.data;
          onFileUpload({
            url: fileData.url,
            size: selectedFile.size,
            name: selectedFile.name,
            type: selectedFile.type
          });
        }
      }
    } catch (error) {
      console.error('文件上传失败:', error);
      setUploadError(error.response?.data?.message || '文件上传失败');
      setUploadStatus('上传失败，可以稍后重试');
      setIsUploading(false);
    }
  };
  
  const startProcessingPolling = (processId) => {
    if (processingIntervalRef.current) {
      clearInterval(processingIntervalRef.current);
    }
    
    setProcessingStatus('正在处理视频文件...');
    setProcessingProgress(0);
    
    processingIntervalRef.current = setInterval(async () => {
      try {
        const response = await uploadApi.checkProcessingStatus(processId);
        const { status, progress, result } = response.data.data;
        
        setProcessingProgress(progress);
        
        if (status === 'completed') {
          clearInterval(processingIntervalRef.current);
          processingIntervalRef.current = null;
          setProcessingStatus('处理完成');
          setIsUploading(false);
          
          // 通知父组件上传完成
          onFileUpload({
            url: result.url,
            size: selectedFile.size,
            name: selectedFile.name,
            type: selectedFile.type,
            ...result // 包含处理后的其他信息如时长、分辨率等
          });
        } else if (status === 'failed') {
          clearInterval(processingIntervalRef.current);
          processingIntervalRef.current = null;
          setProcessingStatus('');
          setUploadError('视频处理失败: ' + (result?.error || '未知错误'));
          setIsUploading(false);
        } else {
          setProcessingStatus(`正在处理视频文件: ${status === 'processing' ? '转码中' : status}`);
        }
      } catch (error) {
        console.error('检查处理状态失败:', error);
      }
    }, 3000); // 每3秒检查一次
  };
  
  const handleCancelUpload = async () => {
    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
        processingIntervalRef.current = null;
      }
      
      // 通知服务器取消上传
      if (identifier) {
        await uploadApi.cancelUpload(identifier);
      }
      
    } catch (error) {
      console.error('取消上传失败:', error);
    } finally {
      setIsUploading(false);
      setProcessingStatus('');
      setUploadStatus('上传已取消');
    }
  };
  
  const formatSpeed = (bytesPerSecond) => {
    if (bytesPerSecond < 1024) {
      return `${bytesPerSecond.toFixed(2)} B/s`;
    } else if (bytesPerSecond < 1024 * 1024) {
      return `${(bytesPerSecond / 1024).toFixed(2)} KB/s`;
    } else {
      return `${(bytesPerSecond / (1024 * 1024)).toFixed(2)} MB/s`;
    }
  };
  
  const formatTime = (seconds) => {
    if (seconds < 60) {
      return `${Math.ceil(seconds)}秒`;
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}分${Math.ceil(seconds % 60)}秒`;
    } else {
      return `${Math.floor(seconds / 3600)}小时${Math.floor((seconds % 3600) / 60)}分`;
    }
  };
  
  // 根据内容类型提供相应的上传指导
  const getUploadGuide = () => {
    if (contentType.includes('video')) {
      return (
        <div className="upload-guide">
          <h4>视频上传指南</h4>
          <ul>
            <li>支持格式: MP4, MOV, WEBM</li>
            <li>推荐分辨率: 
              {contentType === '180_video' && ' 3840×1920 (4K) 或 2560×1280 (2.5K)'}
              {contentType === '360_video' && ' 6400×3200 (6K) 或 5760×2880 (6K)'}
              {contentType === 'spatial_video' && ' 8192×4096 (8K) 或 5760×2880 (6K)'}
            </li>
            <li>最大文件大小: {(maxFileSize / (1024 * 1024 * 1024)).toFixed(1)}GB</li>
            <li>帧率: 30FPS 或 60FPS</li>
            <li>编码: H.264/H.265</li>
          </ul>
        </div>
      );
    } else if (contentType.includes('photo')) {
      return (
        <div className="upload-guide">
          <h4>图片上传指南</h4>
          <ul>
            <li>支持格式: JPG, PNG, WEBP</li>
            <li>推荐分辨率:
              {contentType === '180_photo' && ' 6400×3200 (6K) 或 4096×2048 (4K)'}
              {contentType === '360_photo' && ' 8192×4096 (8K) 或 6400×3200 (6K)'}
              {contentType === 'spatial_photo' && ' 8192×8192 (8K) 或 6144×6144 (6K)'}
            </li>
            <li>最大文件大小: {(maxFileSize / (1024 * 1024)).toFixed(0)}MB</li>
          </ul>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="file-uploader">
      {currentFile && (
        <div className="current-file">
          <div className="current-file-info">
            <p className="current-file-name">{currentFile.split('/').pop()}</p>
            <span className="current-file-status">已上传</span>
          </div>
          {accept.includes('image') && currentFile && (
            <img 
              src={currentFile} 
              alt="Current file" 
              className="thumbnail" 
            />
          )}
          {!accept.includes('image') && (
            <div className="file-icon">
              {selectedFile?.type.includes('video') ? '🎬' : '📄'}
            </div>
          )}
        </div>
      )}
      
      {getUploadGuide()}
      
      <div className="upload-controls">
        <input
          type="file"
          id={`file-${fileCategory}`}
          accept={accept}
          onChange={handleFileSelect}
          disabled={isUploading}
          className="file-input"
        />
        <label htmlFor={`file-${fileCategory}`} className="file-label">
          {selectedFile ? selectedFile.name : "选择文件"}
        </label>
        
        {selectedFile && !isUploading && (
          <div className="upload-buttons">
            <button
              type="button"
              className="upload-button"
              onClick={() => startUpload(false)}
            >
              开始上传
            </button>
            
            {resumable && (
              <button
                type="button"
                className="resume-button"
                onClick={() => startUpload(true)}
              >
                继续上传
              </button>
            )}
          </div>
        )}
        
        {isUploading && (
          <button
            type="button"
            className="cancel-button"
            onClick={handleCancelUpload}
          >
            取消上传
          </button>
        )}
      </div>
      
      {uploadError && (
        <div className="upload-error">
          {uploadError}
        </div>
      )}
      
      {uploadStatus && (
        <div className="upload-status">
          {uploadStatus}
        </div>
      )}
      
      {(isUploading || uploadProgress > 0) && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div 
              className="progress-bar-fill" 
              style={{width: `${uploadProgress}%`}}
            ></div>
          </div>
          <p>{uploadProgress}%</p>
        </div>
      )}
      
      {processingStatus && (
        <div className="processing-status">
          <div className="processing-info">
            {processingStatus}
          </div>
          <div className="progress-bar">
            <div 
              className="progress-bar-fill" 
              style={{width: `${processingProgress}%`}}
            ></div>
          </div>
          <p>{processingProgress}%</p>
        </div>
      )}
      
      {selectedFile && (
        <div className="file-info">
          <p>文件名: {selectedFile.name}</p>
          <p>文件大小: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
          <p>文件类型: {selectedFile.type || '未知'}</p>
        </div>
      )}
    </div>
  );
};

export default EnhancedFileUploader;