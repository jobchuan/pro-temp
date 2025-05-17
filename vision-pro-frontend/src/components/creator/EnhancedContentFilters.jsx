// components/creator/EnhancedContentFilters.jsx
import React, { useState, useEffect } from 'react';
import { DatePicker, Select, Input, Button, Checkbox, Tag } from '../ui/common';
import { creatorApi } from '../../services/apiService';

const EnhancedContentFilters = ({ filters, onFilterChange, totalCount }) => {
  const [searchText, setSearchText] = useState(filters.search || '');
  const [advancedFiltersVisible, setAdvancedFiltersVisible] = useState(false);
  const [allTags, setAllTags] = useState([]);
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [selectedTags, setSelectedTags] = useState(filters.tags || []);
  const [dateRange, setDateRange] = useState([
    filters.dateFrom ? new Date(filters.dateFrom) : null,
    filters.dateTo ? new Date(filters.dateTo) : null
  ]);
  const [loading, setLoading] = useState(false);
  
  // 获取所有标签
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await creatorApi.getAllTags();
        setAllTags(response.data.data.tags);
      } catch (error) {
        console.error('获取标签失败:', error);
      }
    };
    
    fetchTags();
  }, []);
  
  // 当用户输入时提供标签建议
  useEffect(() => {
    if (searchText && searchText.includes('#')) {
      const tagInput = searchText.split('#').pop().trim();
      if (tagInput) {
        const suggestions = allTags
          .filter(tag => tag.toLowerCase().includes(tagInput.toLowerCase()))
          .slice(0, 5);
        setTagSuggestions(suggestions);
      } else {
        setTagSuggestions([]);
      }
    } else {
      setTagSuggestions([]);
    }
  }, [searchText, allTags]);
  
  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
  };
  
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onFilterChange({ search: searchText });
  };
  
  const handleStatusChange = (value) => {
    onFilterChange({ status: value });
  };
  
  const handleContentTypeChange = (value) => {
    onFilterChange({ contentType: value });
  };
  
  const handleCategoryChange = (value) => {
    onFilterChange({ category: value });
  };
  
  const handleSortChange = (value) => {
    onFilterChange({ sort: value });
  };
  
  const handleTagSelect = (tag) => {
    if (!selectedTags.includes(tag)) {
      const newTags = [...selectedTags, tag];
      setSelectedTags(newTags);
      onFilterChange({ tags: newTags });
    }
  };
  
  const handleTagRemove = (tag) => {
    const newTags = selectedTags.filter(t => t !== tag);
    setSelectedTags(newTags);
    onFilterChange({ tags: newTags });
  };
  
  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
    onFilterChange({
      dateFrom: dates[0] ? dates[0].toISOString().split('T')[0] : null,
      dateTo: dates[1] ? dates[1].toISOString().split('T')[0] : null
    });
  };
  
  const handlePricingChange = (e) => {
    onFilterChange({ pricing: e.target.checked ? 'paid' : null });
  };
  
  const handlePublishStatusChange = (value) => {
    onFilterChange({ publishStatus: value });
  };
  
  const handleClearFilters = () => {
    setSearchText('');
    setSelectedTags([]);
    setDateRange([null, null]);
    setAdvancedFiltersVisible(false);
    
    onFilterChange({
      status: '',
      contentType: '',
      category: '',
      search: '',
      tags: [],
      dateFrom: null,
      dateTo: null,
      pricing: null,
      publishStatus: '',
      sort: '-createdAt'
    });
  };
  
  const handleTagSuggestionClick = (tag) => {
    // 替换搜索框中的标签输入
    const parts = searchText.split('#');
    parts.pop(); // 移除正在输入的标签
    setSearchText(parts.join('#') + (parts.length > 0 ? '#' : '') + tag + ' ');
    setTagSuggestions([]);
  };
  
  return (
    <div className="content-filters">
      <form onSubmit={handleSearchSubmit} className="search-form">
        <div className="search-input-wrapper">
          <Input
            type="text"
            placeholder="搜索内容 (使用 # 搜索标签)"
            value={searchText}
            onChange={handleSearchChange}
            className="search-input"
            suffix={<Button type="primary" htmlType="submit">搜索</Button>}
          />
          {tagSuggestions.length > 0 && (
            <div className="tag-suggestions">
              {tagSuggestions.map(tag => (
                <div 
                  key={tag} 
                  className="tag-suggestion-item"
                  onClick={() => handleTagSuggestionClick(tag)}
                >
                  #{tag}
                </div>
              ))}
            </div>
          )}
        </div>
      </form>
      
      <div className="basic-filters">
        <div className="filter-group">
          <label htmlFor="status-filter">状态:</label>
          <Select
            id="status-filter"
            value={filters.status}
            onChange={handleStatusChange}
            style={{ width: 140 }}
          >
            <Select.Option value="">全部状态</Select.Option>
            <Select.Option value="published">已发布</Select.Option>
            <Select.Option value="draft">草稿</Select.Option>
            <Select.Option value="pending_review">审核中</Select.Option>
            <Select.Option value="rejected">被拒绝</Select.Option>
            <Select.Option value="archived">已归档</Select.Option>
          </Select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="type-filter">内容类型:</label>
          <Select
            id="type-filter"
            value={filters.contentType}
            onChange={handleContentTypeChange}
            style={{ width: 140 }}
          >
            <Select.Option value="">全部类型</Select.Option>
            <Select.Option value="180_video">180° 视频</Select.Option>
            <Select.Option value="180_photo">180° 照片</Select.Option>
            <Select.Option value="360_video">360° 视频</Select.Option>
            <Select.Option value="360_photo">360° 照片</Select.Option>
            <Select.Option value="spatial_video">空间视频</Select.Option>
            <Select.Option value="spatial_photo">空间照片</Select.Option>
          </Select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="sort-filter">排序方式:</label>
          <Select
            id="sort-filter"
            value={filters.sort || '-createdAt'}
            onChange={handleSortChange}
            style={{ width: 160 }}
          >
            <Select.Option value="-createdAt">最新创建</Select.Option>
            <Select.Option value="createdAt">最早创建</Select.Option>
            <Select.Option value="-updatedAt">最近更新</Select.Option>
            <Select.Option value="-stats.views">最多观看</Select.Option>
            <Select.Option value="-stats.likes">最多点赞</Select.Option>
            <Select.Option value="-stats.comments">最多评论</Select.Option>
          </Select>
        </div>
        
        <div className="toggle-advanced-filters">
          <Button 
            type="text" 
            onClick={() => setAdvancedFiltersVisible(!advancedFiltersVisible)}
          >
            {advancedFiltersVisible ? '收起高级筛选' : '显示高级筛选'}
          </Button>
          
          <Button 
            type="text" 
            onClick={handleClearFilters}
            className="clear-filters-btn"
          >
            清除筛选
          </Button>
        </div>
      </div>
      
      {advancedFiltersVisible && (
        <div className="advanced-filters">
          <div className="filter-row">
            <div className="filter-group">
              <label>分类:</label>
              <Select
                value={filters.category}
                onChange={handleCategoryChange}
                style={{ width: 140 }}
              >
                <Select.Option value="">全部分类</Select.Option>
                <Select.Option value="travel">旅行</Select.Option>
                <Select.Option value="education">教育</Select.Option>
                <Select.Option value="entertainment">娱乐</Select.Option>
                <Select.Option value="sports">运动</Select.Option>
                <Select.Option value="news">新闻</Select.Option>
                <Select.Option value="documentary">纪录片</Select.Option>
                <Select.Option value="art">艺术</Select.Option>
                <Select.Option value="other">其他</Select.Option>
              </Select>
            </div>
            
            <div className="filter-group">
              <label>创建日期:</label>
              <DatePicker.RangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
                placeholder={['开始日期', '结束日期']}
              />
            </div>
            
            <div className="filter-group">
              <label>发布状态:</label>
              <Select
                value={filters.publishStatus}
                onChange={handlePublishStatusChange}
                style={{ width: 140 }}
              >
                <Select.Option value="">全部</Select.Option>
                <Select.Option value="first_publish">首次发布</Select.Option>
                <Select.Option value="republished">已重新发布</Select.Option>
                <Select.Option value="scheduled">计划发布</Select.Option>
              </Select>
            </div>
            
            <div className="filter-group">
              <Checkbox
                checked={filters.pricing === 'paid'}
                onChange={handlePricingChange}
              >
                仅付费内容
              </Checkbox>
            </div>
          </div>
          
          <div className="filter-row">
            <div className="filter-group tags-filter">
              <label>已选标签:</label>
              <div className="selected-tags">
                {selectedTags.map(tag => (
                  <Tag 
                    key={tag} 
                    closable 
                    onClose={() => handleTagRemove(tag)}
                  >
                    {tag}
                  </Tag>
                ))}
                {selectedTags.length === 0 && <span className="no-tags">未选择标签</span>}
              </div>
            </div>
          </div>
          
          <div className="popular-tags">
            <label>常用标签:</label>
            <div className="tags-cloud">
              {allTags.slice(0, 15).map(tag => (
                <Tag 
                  key={tag} 
                  onClick={() => handleTagSelect(tag)}
                  className={selectedTags.includes(tag) ? 'selected-tag' : ''}
                >
                  {tag}
                </Tag>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {(Object.keys(filters).some(key => 
        ['status', 'contentType', 'category', 'search', 'tags', 'dateFrom', 'dateTo', 'pricing', 'publishStatus']
          .includes(key) && filters[key] && 
          (Array.isArray(filters[key]) ? filters[key].length > 0 : true)
      )) && (
        <div className="active-filters">
          <span>筛选条件:</span>
          {filters.status && (
            <Tag closable onClose={() => onFilterChange({ status: '' })}>
              状态: {getStatusText(filters.status)}
            </Tag>
          )}
          {filters.contentType && (
            <Tag closable onClose={() => onFilterChange({ contentType: '' })}>
              类型: {getContentTypeText(filters.contentType)}
            </Tag>
          )}
          {filters.category && (
            <Tag closable onClose={() => onFilterChange({ category: '' })}>
              分类: {getCategoryText(filters.category)}
            </Tag>
          )}
          {filters.search && (
            <Tag closable onClose={() => { setSearchText(''); onFilterChange({ search: '' }); }}>
              搜索: {filters.search}
            </Tag>
          )}
          {filters.dateFrom && (
            <Tag closable onClose={() => onFilterChange({ dateFrom: null })}>
              开始日期: {new Date(filters.dateFrom).toLocaleDateString()}
            </Tag>
          )}
          {filters.dateTo && (
            <Tag closable onClose={() => onFilterChange({ dateTo: null })}>
              结束日期: {new Date(filters.dateTo).toLocaleDateString()}
            </Tag>
          )}
          {filters.pricing === 'paid' && (
            <Tag closable onClose={() => onFilterChange({ pricing: null })}>
              仅付费内容
            </Tag>
          )}
          {filters.publishStatus && (
            <Tag closable onClose={() => onFilterChange({ publishStatus: '' })}>
              发布状态: {getPublishStatusText(filters.publishStatus)}
            </Tag>
          )}
        </div>
      )}
      
      <div className="filter-results-info">
        共找到 <strong>{totalCount}</strong> 个内容
      </div>
    </div>
  );
};

// 辅助函数
const getStatusText = (status) => {
  const statusMap = {
    'published': '已发布',
    'draft': '草稿',
    'pending_review': '审核中',
    'rejected': '被拒绝',
    'archived': '已归档'
  };
  return statusMap[status] || status;
};

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

const getPublishStatusText = (status) => {
  const statusMap = {
    'first_publish': '首次发布',
    'republished': '已重新发布',
    'scheduled': '计划发布'
  };
  return statusMap[status] || status;
};

export default EnhancedContentFilters;