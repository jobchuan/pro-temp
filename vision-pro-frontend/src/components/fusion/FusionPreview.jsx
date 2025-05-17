// src/components/fusion/FusionPreview.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { creatorApi } from '../../services/apiService';

const FusionPreview = () => {
  const { fusionId } = useParams();
  const [fusion, setFusion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  
  useEffect(() => {
    fetchFusionDetails();
  }, [fusionId]);
  
  const fetchFusionDetails = async () => {
    try {
      const response = await creatorApi.getFusionDetails(fusionId);
      setFusion(response.data.data.fusion);
      
      // 记录查看
      await creatorApi.recordFusionView(fusionId);
    } catch (error) {
      console.error('获取融合内容详情失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePlay = () => {
    setPlaying(!playing);
  };
  
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };
  
  const handleNext = () => {
    if (fusion && currentIndex < fusion.contents.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };
  
  if (loading) {
    return <div className="loading-spinner">加载融合内容中...</div>;
  }
  
  if (!fusion) {
    return <div className="error-message">无法加载融合内容</div>;
  }
  
  const currentContent = fusion.contents[currentIndex]?.content;
  
  return (
    <div className="fusion-preview">
      <div className="fusion-header">
        <h1>{fusion.title}</h1>
        <p>{fusion.description}</p>
      </div>
      
      <div className="fusion-content-viewer">
        {currentContent && (
          <div className="content-display">
            {currentContent.contentType.includes('video') ? (
              <video
                src={currentContent.files?.main?.url}
                poster={currentContent.files?.thumbnail?.url}
                controls
              />
            ) : (
              <img
                src={currentContent.files?.main?.url}
                alt={currentContent.title?.['zh-CN']}
              />
            )}
          </div>
        )}
        
        <div className="fusion-controls">
          <button onClick={handlePrevious} disabled={currentIndex === 0}>
            上一个
          </button>
          
          <button onClick={handlePlay}>
            {playing ? '暂停' : '播放'}
          </button>
          
          <button 
            onClick={handleNext} 
            disabled={!fusion || currentIndex >= fusion.contents.length - 1}
          >
            下一个
          </button>
        </div>
      </div>
      
      <div className="fusion-playlist">
        <h3>内容列表</h3>
        
        <div className="playlist-items">
          {fusion.contents.map((item, index) => (
            <div 
              key={index}
              className={`playlist-item ${index === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(index)}
            >
              <div className="item-thumbnail">
                <img 
                  src={item.content?.files?.thumbnail?.url || '/default-thumbnail.jpg'} 
                  alt={item.content?.title?.['zh-CN']} 
                />
              </div>
              <div className="item-info">
                <h4>{item.content?.title?.['zh-CN'] || '无标题'}</h4>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FusionPreview;