// components/creator/EnhancedContentCard.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Tag, Tooltip, Button } from '../ui/common';

const EnhancedContentCard = ({ 
  content, 
  isSelected, 
  onSelect,
  onAction
}) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  
  const handleSelectChange = (e) => {
    onSelect(e.target.checked);
  };
  
  const handleMenuAction = (action) => {
    setMenuVisible(false);
    onAction(action, content._id);
  };
  
  // 获取状态显示文本和样式
  const getStatusInfo = (status) => {
    switch (status) {
      case 'published':
        return { text: '已发布', className: 'status-published', color: 'green' };
      case 'draft':
        return { text: '草稿', className: 'status-draft', color: 'gray' };
      case 'pending_review':
        return { text: '审核中', className: 'status-reviewing', color: 'blue' };
      case 'rejected':
        return { text: '被拒绝', className: 'status-rejected', color: 'red' };
      case 'archived':
        return { text: '已归档', className: 'status-archived', color: 'orange' };
      default:
        return { text: status, className: '', color: 'default' };
    }
  };
  
  // 获取内容类型文本
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
  
  // 计算完成率
  const calculateCompletionRate = () => {
    let total = 0;
    let completed = 0;
    
    // 检查必填字段是否已填写
    if (content.title?.['zh-CN']) completed++;
    total++;
    
    if (content.description?.['zh-CN']) completed++;
    total++;
    
    if (content.files?.main?.url) completed++;
    total++;
    
    if (content.files?.thumbnail?.url) completed++;
    total++;
    
    if (content.category && content.category !== 'other') completed++;
    total++;
    
    if (content.tags && content.tags.length > 0) completed++;
    total++;
    
    return Math.round((completed / total) * 100);
  };
  
  const statusInfo = getStatusInfo(content.status);
  const completionRate = calculateCompletionRate();
  const isIncomplete = completionRate < 100 && content.status !== 'published';
  const hasCollaborators = content.collaboration?.isCollaborative;
  
  // Custom dropdown menu component
  const ActionDropdown = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
      <div className="custom-dropdown" onMouseLeave={() => setIsOpen(false)}>
        <button className="more-btn" onClick={() => setIsOpen(!isOpen)}>
          ⋮
        </button>
        {isOpen && (
          <div className="dropdown-menu">
            {children}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <Card 
      className={`content-card ${isSelected ? 'selected' : ''} ${isIncomplete ? 'incomplete' : ''}`}
      hoverable
    >
      <div className="content-card-selection">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleSelectChange}
        />
      </div>
      
      <div className="content-card-thumbnail">
        <img 
          src={content.files?.thumbnail?.url || '/default-thumbnail.jpg'} 
          alt={content.title?.['zh-CN']} 
        />
        
        <div className="content-type-badge">
          {getContentTypeText(content.contentType)}
        </div>
        
        {hasCollaborators && (
          <Tooltip title="协作内容">
            <div className="collaboration-badge">👥</div>
          </Tooltip>
        )}
        
        {isIncomplete && (
          <Tooltip title={`完成度: ${completionRate}%`}>
            <div className="completion-indicator">
              <div className="progress-bar">
                <div 
                  className="progress-bar-fill" 
                  style={{width: `${completionRate}%`}}
                ></div>
              </div>
            </div>
          </Tooltip>
        )}
      </div>
      
      <div className="content-card-info">
        <h3 className="content-title">
          {content.title?.['zh-CN'] || content.title?.['en-US'] || '无标题'}
        </h3>
        
        <div className="content-meta">
          <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
          <span className="content-date">
            {content.publishedAt ? formatDate(content.publishedAt, '发布于') : formatDate(content.createdAt)}
          </span>
        </div>
        
        <div className="content-stats">
          <Tooltip title="观看次数">
            <span className="views-count">
              <i className="icon-eye"></i>
              {formatNumber(content.stats?.views || 0)}
            </span>
          </Tooltip>
          
          <Tooltip title="点赞数">
            <span className="likes-count">
              <i className="icon-heart"></i>
              {formatNumber(content.stats?.likes || 0)}
            </span>
          </Tooltip>
          
          <Tooltip title="评论数">
            <span className="comments-count">
              <i className="icon-message"></i>
              {formatNumber(content.stats?.comments || 0)}
            </span>
          </Tooltip>
        </div>
        
        {!content.pricing?.isFree && (
          <div className="content-price">
            ￥{content.pricing?.price?.toFixed(2) || '0.00'}
          </div>
        )}
        
        {content.tags && content.tags.length > 0 && (
          <div className="content-tags">
            {content.tags.slice(0, 3).map(tag => (
              <Tag key={tag} size="small">{tag}</Tag>
            ))}
            {content.tags.length > 3 && (
              <Tooltip title={content.tags.slice(3).join(', ')}>
                <Tag size="small">+{content.tags.length - 3}</Tag>
              </Tooltip>
            )}
          </div>
        )}
      </div>
      
      <div className="content-card-actions">
        <Link to={`/creator/content/${content._id}`} className="edit-btn">
          编辑
        </Link>
        
        <Button 
          className="preview-btn" 
          onClick={() => setPreviewModalVisible(true)}
        >
          预览
        </Button>
        
        <ActionDropdown>
          <button onClick={() => handleMenuAction('edit')}>编辑</button>
          <button onClick={() => handleMenuAction('preview')}>预览</button>
          <button onClick={() => handleMenuAction('duplicate')}>复制</button>
          <div className="dropdown-divider"></div>
          
          {content.status !== 'published' && 
            <button onClick={() => handleMenuAction('status', { id: content._id, status: 'published' })}>
              发布
            </button>
          }
          
          {content.status === 'published' && 
            <button onClick={() => handleMenuAction('status', { id: content._id, status: 'draft' })}>
              取消发布
            </button>
          }
          
          {content.status !== 'pending_review' && content.status !== 'published' && 
            <button onClick={() => handleMenuAction('status', { id: content._id, status: 'pending_review' })}>
              提交审核
            </button>
          }
          
          {content.status !== 'archived' && 
            <button onClick={() => handleMenuAction('status', { id: content._id, status: 'archived' })}>
              归档
            </button>
          }
          
          <div className="dropdown-divider"></div>
          <button className="danger" onClick={() => handleMenuAction('delete')}>删除</button>
        </ActionDropdown>
      </div>
      
      {previewModalVisible && (
        <PreviewModal 
          content={content}
          visible={previewModalVisible}
          onClose={() => setPreviewModalVisible(false)}
        />
      )}
    </Card>
  );
};

// 预览模态框组件
const PreviewModal = ({ content, visible, onClose }) => {
  return (
    <div className={`preview-modal ${visible ? 'visible' : ''}`}>
      <div className="preview-modal-content">
        <div className="preview-header">
          <h3>{content.title?.['zh-CN'] || content.title?.['en-US'] || '无标题'}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="preview-body">
          {content.contentType.includes('video') ? (
            <div className="video-preview">
              <video 
                controls 
                src={content.files?.main?.url}
                poster={content.files?.thumbnail?.url}
              />
            </div>
          ) : (
            <div className="image-preview">
              <img src={content.files?.main?.url} alt={content.title?.['zh-CN']} />
            </div>
          )}
          
          <div className="preview-info">
            <div className="preview-description">
              <h4>描述</h4>
              <p>{content.description?.['zh-CN'] || '无描述'}</p>
            </div>
            
            <div className="preview-details">
              <div className="detail-item">
                <span className="label">类型:</span>
                <span className="value">{getContentTypeText(content.contentType)}</span>
              </div>
              <div className="detail-item">
                <span className="label">分类:</span>
                <span className="value">{getCategoryText(content.category)}</span>
              </div>
              <div className="detail-item">
                <span className="label">定价:</span>
                <span className="value">
                  {content.pricing?.isFree ? '免费' : `￥${content.pricing?.price?.toFixed(2) || '0.00'}`}
                </span>
              </div>
              <div className="detail-item">
                <span className="label">标签:</span>
                <span className="value">
                  {content.tags && content.tags.length > 0 
                    ? content.tags.join(', ') 
                    : '无标签'}
                </span>
              </div>
            </div>
          </div>
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

const getCategoryText = (category) => {
  const categoryMap = {
    'travel': '旅行',
    'education': '教育',
    'entertainment': '娱乐',
    'sports': '运动',
    'news': '新闻',
    'documentary': '纪录片',
    'art': '艺术',
    'other': '其他'
  };
  return categoryMap[category] || category;
};

const formatDate = (dateString, prefix = '') => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return `${prefix} ${date.toLocaleDateString('zh-CN', options)}`;
};

const formatNumber = (num) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  return num.toString();
};

export default EnhancedContentCard;