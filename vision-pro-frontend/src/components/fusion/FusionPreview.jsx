// components/fusion/FusionPreview.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Spin, Button, Progress, Slider, Tooltip } from '../ui/common';
import { creatorApi } from '../../services/apiService';

const FusionPreview = () => {
  const { fusionId } = useParams();
  const [fusion, setFusion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const timerRef = useRef(null);
  
  useEffect(() => {
    fetchFusionDetails();
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
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
  
  useEffect(() => {
    if (fusion && videoRef.current) {
      // 初始化视频事件监听
      const video = videoRef.current;
      
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('loadedmetadata', handleMetadataLoaded);
      video.addEventListener('ended', handleContentEnded);
      
      // 设置音量
      video.volume = volume;
      video.muted = muted;
      
      // 自动播放第一个内容
      if (fusion.settings.autoPlay) {
        playContent(0);
      } else {
        loadContent(0);
      }
      
      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('loadedmetadata', handleMetadataLoaded);
        video.removeEventListener('ended', handleContentEnded);
      };
    }
  }, [fusion]);
  
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      setProgress((video.currentTime / video.duration) * 100);
    }
  };
  
  const handleMetadataLoaded = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };
  
  const handleContentEnded = () => {
    const currentContent = fusion.contents[currentIndex];
    
    // 如果当前内容设置了循环，则重新播放
    if (currentContent.settings.loop) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      return;
    }
    
    // 否则播放下一个内容
    if (currentIndex < fusion.contents.length - 1) {
      playContent(currentIndex + 1);
    } else {
      // 如果是最后一个内容
      if (fusion.settings.loop) {
        // 如果融合内容设置了循环，回到第一个内容
        playContent(0);
      } else {
        // 否则停止播放
        setPlaying(false);
      }
    }
  };
  
  const loadContent = (index) => {
    if (!fusion?.contents[index]) return;
    
    setCurrentIndex(index);
    const content = fusion.contents[index].content;
    
    if (videoRef.current) {
      videoRef.current.src = content.files.main.url;
      videoRef.current.load();
    }
  };
  
  const playContent = (index) => {
    loadContent(index);
    
    if (videoRef.current) {
      videoRef.current.play()
        .then(() => {
          setPlaying(true);
        })
        .catch(error => {
          console.error('播放失败:', error);
          setPlaying(false);
        });
    }
  };
  
  const handlePlayPause = () => {
    if (playing) {
      videoRef.current.pause();
      setPlaying(false);
    } else {
      videoRef.current.play()
        .then(() => {
          setPlaying(true);
        })
        .catch(error => {
          console.error('播放失败:', error);
        });
    }
  };
  
  const handlePrevious = () => {
    if (currentIndex > 0) {
      playContent(currentIndex - 1);
    }
  };
  
  const handleNext = () => {
    if (currentIndex < fusion.contents.length - 1) {
      playContent(currentIndex + 1);
    }
  };
  
  const handleProgressChange = (value) => {
    if (videoRef.current) {
      const newTime = (value / 100) * videoRef.current.duration;
      videoRef.current.currentTime = newTime;
    }
  };
  
  const handleVolumeChange = (value) => {
    setVolume(value);
    
    if (videoRef.current) {
      videoRef.current.volume = value;
      setMuted(value === 0);
    }
  };
  
  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !muted;
      videoRef.current.muted = newMuted;
      setMuted(newMuted);
    }
  };
  
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error('全屏模式错误:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };
  
  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" tip="加载融合内容中..." />
      </div>
    );
  }
  
  if (!fusion) {
    return (
      <div className="error-container">
        <p>无法加载融合内容</p>
      </div>
    );
  }
  
  const currentContent = fusion.contents[currentIndex]?.content;
  const isVideo = currentContent?.contentType.includes('video');
  
  return (
    <div className="fusion-preview-container" ref={containerRef}>
      <div className="fusion-header">
        <h1>{fusion.title}</h1>
        <p className="fusion-description">{fusion.description}</p>
      </div>
      
      <div className="fusion-content-viewer">
        {isVideo ? (
          <video
            ref={videoRef}
            className="fusion-video"
            controlsList="nodownload"
            playsInline
          />
        ) : (
          <div className="fusion-image">
            <img src={currentContent?.files.main.url} alt={currentContent?.title?.['zh-CN']} />
          </div>
        )}
        
        <div className="fusion-controls">
          <div className="fusion-progress">
            <Progress 
              percent={progress} 
              status="active" 
              showInfo={false}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
          </div>
          
          <div className="controls-main">
            <Button 
              icon="step-backward" 
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            />
            
            <Button 
              icon={playing ? "pause" : "caret-right"} 
              onClick={handlePlayPause}
              shape="circle"
              size="large"
            />
            
            <Button 
              icon="step-forward" 
              onClick={handleNext}
              disabled={currentIndex === fusion.contents.length - 1}
            />
            
            <div className="volume-control">
              <Button 
                icon={muted ? "sound" : volume < 0.5 ? "sound" : "sound"} 
                onClick={toggleMute}
              />
              <Slider 
                value={muted ? 0 : volume} 
                onChange={handleVolumeChange} 
                min={0} 
                max={1} 
                step={0.01}
                style={{ width: 80 }}
              />
            </div>
            
            <div className="content-info">
              {currentIndex + 1} / {fusion.contents.length}
            </div>
            
            <Button 
              icon={fullscreen ? "fullscreen-exit" : "fullscreen"} 
              onClick={toggleFullscreen}
            />
          </div>
        </div>
      </div>
      
      <div className="fusion-playlist">
        <h3>内容列表</h3>
        <div className="playlist-items">
          {fusion.contents.map((item, index) => (
            <div 
              key={index}
              className={`playlist-item ${index === currentIndex ? 'active' : ''}`}
              onClick={() => playContent(index)}
            >
              <div className="playlist-thumbnail">
                <img 
                  src={item.content?.files?.thumbnail?.url || '/default-thumbnail.jpg'} 
                  alt={item.content?.title?.['zh-CN']} 
                />
              </div>
              <div className="playlist-item-info">
                <div className="playlist-item-title">
                  {item.content?.title?.['zh-CN'] || item.content?.title?.['en-US'] || '无标题'}
                </div>
                <div className="playlist-item-meta">
                  <span className="item-type">{getContentTypeText(item.content?.contentType)}</span>
                  <span className="item-duration">{formatDuration(item.content?.files?.main?.duration || 0)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 辅助函数
const getContentTypeText = (contentType) => {
  const typeMap = {
    '180_video': '180° 视频',
    '180_photo': '180° 照片',
    '360_video': '360° 视频',
    '360_photo': '360° 照片',
    'spatial_video': '空间视频',
    'spatial_photo': '空间照片'
  };
  return typeMap[contentType] || contentType;
};

const formatDuration = (seconds) => {
  if (!seconds) return '未知';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default FusionPreview;