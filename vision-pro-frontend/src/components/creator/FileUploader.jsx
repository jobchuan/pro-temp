// components/creator/FileUploader.jsx
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

const FileUploader = ({ 
  onFileUpload, 
  accept, 
  currentFile, 
  maxFileSize = 1024 * 1024 * 1024, // 默认最大1GB
  chunkSize = 2 * 1024 * 1024, // 默认2MB一块
  fileCategory = 'content' // 文件类别：content, thumbnail 等
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [resumable, setResumable] = useState(false);
  const [identifier, setIdentifier] = useState('');
  
  const abortControllerRef = useRef(null);
  const chunksRef = useRef([]);
  const totalChunksRef = useRef(0);
  const uploadedChunksRef = useRef([]);
  
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
  
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // 检查文件大小
    if (file.size > maxFileSize) {
      setUploadError(`文件大小超过限制（最大 ${(maxFileSize / (1024 * 1024)).toFixed(2)} MB）`);
      return;
    }
    
    setSelectedFile(file);
    setUploadProgress(0);
    setUploadError('');
    setUploadStatus('准备上传');
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
        category: fileCategory
      });
      
      // 如果恢复上传，使用保存的已上传块信息
      if (resume && uploadedChunksRef.current.length > 0) {
        setUploadStatus(`继续上传，从第 ${uploadedChunksRef.current.length + 1} 个分片开始`);
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
      
      // 逐个上传分片
      for (let i = 0; i < totalChunks; i++) {
        // 如果该分片已上传，则跳过
        if (uploadedChunksRef.current.includes(i)) {
          continue;
        }
        
        setUploadStatus(`上传分片 ${i + 1}/${totalChunks}`);
        
        await uploadApi.uploadChunk({
          chunk: chunks[i],
          chunkNumber: i,
          totalChunks,
          identifier
        }, (progress) => {
          // 计算总体进度
          const completedChunks = [...uploadedChunksRef.current];
          if (!completedChunks.includes(i)) {
            completedChunks.push(i);
          }
          const overallProgress = 
            (completedChunks.length - 1 + progress / 100) / totalChunks * 100;
          setUploadProgress(Math.round(overallProgress));
        });
        
        // 添加到已上传分片列表
        uploadedChunksRef.current.push(i);
        
        // 更新断点续传信息
        saveUploadState(identifier, {
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          totalChunks,
          uploadedChunks: uploadedChunksRef.current
        });
      }
      
      // 所有分片上传完成，通知服务器合并
      setUploadStatus('完成上传，处理文件中...');
      const completeResponse = await uploadApi.completeChunkUpload({
        identifier,
        filename: selectedFile.name,
        totalChunks
      });
      
      // 清除断点续传记录
      clearUploadState(identifier);
      
      // 设置为完成状态
      setUploadProgress(100);
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
    } catch (error) {
      console.error('文件上传失败:', error);
      setUploadError(error.response?.data?.message || '文件上传失败');
      setUploadStatus('上传失败，可以稍后重试');
      setIsUploading(false);
    }
  };
  
  const handleCancelUpload = async () => {
    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // 通知服务器取消上传
      if (identifier) {
        await uploadApi.cancelUpload(identifier);
      }
      
    } catch (error) {
      console.error('取消上传失败:', error);
    } finally {
      setIsUploading(false);
      setUploadStatus('上传已取消');
    }
  };
  
  return (
    <div className="file-uploader">
      {currentFile && (
        <div className="current-file">
          <p>当前文件: {currentFile.split('/').pop()}</p>
          <img 
            src={accept.includes('image') ? currentFile : '/file-icon.png'} 
            alt="Current file" 
            className={accept.includes('image') ? 'thumbnail' : 'file-icon'}
          />
        </div>
      )}
      
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
      
      {selectedFile && (
        <div className="file-info">
          <p>文件大小: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
          <p>文件类型: {selectedFile.type || '未知'}</p>
        </div>
      )}
    </div>
  );
};

export default FileUploader;