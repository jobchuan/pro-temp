// components/creator/FileUploader.jsx
import React, { useState } from 'react';

const FileUploader = ({ onFileUpload, accept, currentFile }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setSelectedFile(file);
    simulateUpload(file);
  };
  
  // 模拟上传过程，实际开发中替换为真实上传逻辑
  const simulateUpload = (file) => {
    setIsUploading(true);
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 10;
        if (newProgress >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          onFileUpload(file);
          return 100;
        }
        return newProgress;
      });
    }, 300);
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
          id="file"
          accept={accept}
          onChange={handleFileSelect}
          disabled={isUploading}
          className="file-input"
        />
        <label htmlFor="file" className="file-label">
          {selectedFile ? selectedFile.name : "选择文件"}
        </label>
      </div>
      
      {isUploading && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div 
              className="progress-bar-fill" 
              style={{width: `${progress}%`}}
            ></div>
          </div>
          <p>{progress}%</p>
        </div>
      )}
    </div>
  );
};

export default FileUploader;