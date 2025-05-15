// components/creator/ContentForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { creatorApi } from '../../services/apiService';
import FileUploader from './FileUploader';
import TagInput from './TagInput';
import './FileUploader.css';  // 添加这一行导入CSS

const ContentForm = () => {
  const { contentId } = useParams();
  const navigate = useNavigate();
  const isEditing = !!contentId;
  
  const [formData, setFormData] = useState({
    title: { 'zh-CN': '', 'en-US': '' },
    description: { 'zh-CN': '', 'en-US': '' },
    contentType: '180_video',
    files: {
      main: { url: '', size: 0 },
      thumbnail: { url: '', size: 0 }
    },
    tags: [],
    category: 'entertainment',
    pricing: {
      isFree: true,
      price: 0
    }
  });
  
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [mainFile, setMainFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  
  useEffect(() => {
    if (isEditing) {
      fetchContentDetails();
    }
  }, [contentId]);
  
  const fetchContentDetails = async () => {
    try {
      const response = await creatorApi.getContentDetails(contentId);
      const content = response.data.data.content;
      setFormData({
        title: content.title,
        description: content.description,
        contentType: content.contentType,
        files: content.files,
        tags: content.tags,
        category: content.category,
        pricing: content.pricing
      });
    } catch (error) {
      console.error('获取内容详情失败:', error);
      setError('无法加载内容详情。请稍后重试。');
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      // 处理嵌套对象，如 title.zh-CN
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      });
    } else if (name === 'isFree') {
      setFormData({
        ...formData,
        pricing: {
          ...formData.pricing,
          isFree: checked
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };
  
  const handleTagsChange = (tags) => {
    setFormData({
      ...formData,
      tags
    });
  };
  
const handleFileUpload = async (fileData, type) => {
  // 更新表单数据
  setFormData({
    ...formData,
    files: {
      ...formData.files,
      [type]: {
        url: fileData.url,
        size: fileData.size
      }
    }
  });
  
  if (type === 'main') {
    setMainFile(fileData);
  } else if (type === 'thumbnail') {
    setThumbnailFile(fileData);
  }
};
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    try {
      // 首先上传文件（如果需要）
      let updatedFormData = { ...formData };
      
      // 在真实实现中，这里需要上传文件并更新表单数据中的URL
      
      if (isEditing) {
        await creatorApi.updateContent(contentId, updatedFormData);
      } else {
        const response = await creatorApi.createContent(updatedFormData);
        const newContentId = response.data.data._id;
        navigate(`/creator/content/${newContentId}`);
      }
    } catch (error) {
      console.error('保存内容失败:', error);
      setError('保存内容失败。请检查您的输入并重试。');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return <div className="loading-spinner">加载内容中...</div>;
  }
  
  return (
    <div className="content-form-container">
      <h1>{isEditing ? '编辑内容' : '创建新内容'}</h1>
      
      {error && (
        <div className="error-message">{error}</div>
      )}
      
      <form onSubmit={handleSubmit} className="content-form">
        <div className="form-section">
          <h2>基本信息</h2>
          
          <div className="form-group">
            <label htmlFor="title.zh-CN">标题（中文）</label>
            <input
              type="text"
              id="title.zh-CN"
              name="title.zh-CN"
              value={formData.title['zh-CN']}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="title.en-US">标题（英文）</label>
            <input
              type="text"
              id="title.en-US"
              name="title.en-US"
              value={formData.title['en-US']}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description.zh-CN">描述（中文）</label>
            <textarea
              id="description.zh-CN"
              name="description.zh-CN"
              value={formData.description['zh-CN']}
              onChange={handleChange}
              rows="4"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description.en-US">描述（英文）</label>
            <textarea
              id="description.en-US"
              name="description.en-US"
              value={formData.description['en-US']}
              onChange={handleChange}
              rows="4"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="contentType">内容类型</label>
            <select
              id="contentType"
              name="contentType"
              value={formData.contentType}
              onChange={handleChange}
              required
            >
              <option value="180_video">180° 视频</option>
              <option value="180_photo">180° 照片</option>
              <option value="360_video">360° 视频</option>
              <option value="360_photo">360° 照片</option>
              <option value="spatial_video">空间视频</option>
              <option value="spatial_photo">空间照片</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="category">分类</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="travel">旅行</option>
              <option value="education">教育</option>
              <option value="entertainment">娱乐</option>
              <option value="sports">运动</option>
              <option value="news">新闻</option>
              <option value="documentary">纪录片</option>
              <option value="art">艺术</option>
              <option value="other">其他</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="tags">标签</label>
            <TagInput
              tags={formData.tags}
              onChange={handleTagsChange}
            />
          </div>
        </div>
        
<div className="form-group">
  <label>主内容文件</label>
  <FileUploader
    onFileUpload={(fileData) => handleFileUpload(fileData, 'main')}
    accept={formData.contentType.includes('video') ? 'video/*' : 'image/*'}
    currentFile={formData.files.main.url}
    fileCategory="main"
    maxFileSize={1024 * 1024 * 1024} // 1GB
  />
  <small>支持大文件上传，自动分片和断点续传。<br />
  视频支持：MP4, MOV, WEBM (最大1GB)<br />
  图片支持：JPG, PNG, WEBP</small>
</div>

<div className="form-group">
  <label>缩略图</label>
  <FileUploader
    onFileUpload={(fileData) => handleFileUpload(fileData, 'thumbnail')}
    accept="image/*"
    currentFile={formData.files.thumbnail.url}
    fileCategory="thumbnail"
    maxFileSize={10 * 1024 * 1024} // 10MB
    chunkSize={1 * 1024 * 1024} // 1MB
  />
  <small>请上传16:9宽高比的图片作为缩略图 (最大10MB)</small>
</div>
        
        <div className="form-section">
          <h2>定价</h2>
          
          <div className="form-group checkbox">
            <input
              type="checkbox"
              id="isFree"
              name="isFree"
              checked={formData.pricing.isFree}
              onChange={handleChange}
            />
            <label htmlFor="isFree">免费内容</label>
          </div>
          
          {!formData.pricing.isFree && (
            <div className="form-group">
              <label htmlFor="price">价格（人民币）</label>
              <input
                type="number"
                id="price"
                name="pricing.price"
                value={formData.pricing.price}
                onChange={handleChange}
                min="0"
                step="0.01"
              />
            </div>
          )}
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="secondary-button"
            onClick={() => navigate('/creator/contents')}
          >
            取消
          </button>
          
          <button 
            type="submit" 
            className="primary-button"
            disabled={submitting}
          >
            {submitting ? '保存中...' : (isEditing ? '更新内容' : '创建内容')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContentForm;