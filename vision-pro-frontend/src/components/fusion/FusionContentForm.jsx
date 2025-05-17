// src/components/fusion/FusionContentForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { creatorApi } from '../../services/apiService';

const FusionContentForm = () => {
  const { fusionId } = useParams();
  const navigate = useNavigate();
  const isEditing = !!fusionId;
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'entertainment',
    coverImage: null,
    contents: [],
    settings: {
      autoPlay: true,
      loop: false,
      shuffle: false,
      transitionDuration: 1000
    },
    status: 'draft'
  });
  
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  
  useEffect(() => {
    if (isEditing) {
      fetchFusionDetails();
    }
  }, [fusionId]);
  
  const fetchFusionDetails = async () => {
    try {
      const response = await creatorApi.getFusionDetails(fusionId);
      setFormData(response.data.data.fusion);
    } catch (error) {
      console.error('获取融合内容详情失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      if (isEditing) {
        await creatorApi.updateFusion(fusionId, formData);
        alert('融合内容已更新');
      } else {
        const response = await creatorApi.createFusion(formData);
        navigate(`/creator/fusion/${response.data.data._id}`);
      }
    } catch (error) {
      console.error('保存融合内容失败:', error);
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return <div className="loading-spinner">加载融合内容中...</div>;
  }
  
  return (
    <div className="fusion-form-container">
      <div className="fusion-form-header">
        <h1>{isEditing ? '编辑融合内容' : '创建融合内容'}</h1>
      </div>
      
      <form onSubmit={handleSubmit} className="fusion-form">
        <div className="form-group">
          <label htmlFor="title">标题</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">描述</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="category">分类</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
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
        
        <div className="form-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate('/creator/fusions')}
          >
            取消
          </button>
          
          <button
            type="submit"
            className="primary-button"
            disabled={submitting}
          >
            {submitting ? '保存中...' : (isEditing ? '更新' : '创建')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FusionContentForm;