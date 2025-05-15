// components/creator/ContentCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const ContentCard = ({ content, isSelected, onSelect }) => {
  const handleSelectChange = (e) => {
    onSelect(e.target.checked);
  };
  
  // 格式化发布日期
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('zh-CN', options);
  };
  
  // 获取状态显示文本和样式
  const getStatusInfo = (status) => {
    switch (status) {
      case 'published':
        return { text: '已发布', className: 'status-published' };
      case 'draft':
        return { text: '草稿', className: 'status-draft' };
      case 'reviewing':
        return { text: '审核中', className: 'status-reviewing' };
      case 'rejected':
        return { text: '被拒绝', className: 'status-rejected' };
      default:
        return { text: status, className: '' };
    }
  };
  
  const statusInfo = getStatusInfo(content.status);
  
  return (
    <div className={`content-card ${isSelected ? 'selected' : ''}`}>
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
        {content.contentType.includes('video') && (
          <div className="content-type-badge">视频</div>
        )}
        {content.contentType.includes('photo') && (
          <div className="content-type-badge">照片</div>
        )}
      </div>
      
      <div className="content-card-info">
        <h3 className="content-title">
          {content.title?.['zh-CN'] || content.title?.['en-US'] || '无标题'}
        </h3>
        
        <div className="content-meta">
          <span className={`content-status ${statusInfo.className}`}>{statusInfo.text}</span>
          <span className="content-date">{formatDate(content.createdAt || new Date())}</span>
        </div>
        
        <div className="content-stats">
          <span className="views-count">{content.views || 0} 次观看</span>
          <span className="likes-count">{content.likes || 0} 赞</span>
        </div>
        
        {content.pricing?.isFree === false && (
          <div className="content-price">￥{content.pricing?.price?.toFixed(2) || '0.00'}</div>
        )}
      </div>
      
      <div className="content-card-actions">
        <Link to={`/creator/content/${content._id}`} className="edit-btn">编辑</Link>
        <button className="preview-btn">预览</button>
      </div>
    </div>
  );
};

export default ContentCard;