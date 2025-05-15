// components/creator/ContentFilters.jsx
import React, { useState } from 'react';

const ContentFilters = ({ filters, onFilterChange }) => {
  const [searchText, setSearchText] = useState(filters.search || '');
  
  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
  };
  
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onFilterChange({ search: searchText });
  };
  
  const handleStatusChange = (e) => {
    onFilterChange({ status: e.target.value });
  };
  
  const handleContentTypeChange = (e) => {
    onFilterChange({ contentType: e.target.value });
  };
  
  const handleClearFilters = () => {
    setSearchText('');
    onFilterChange({
      status: '',
      contentType: '',
      search: ''
    });
  };
  
  return (
    <div className="content-filters">
      <form onSubmit={handleSearchSubmit} className="search-form">
        <input
          type="text"
          placeholder="搜索内容..."
          value={searchText}
          onChange={handleSearchChange}
          className="search-input"
        />
        <button type="submit" className="search-btn">搜索</button>
      </form>
      
      <div className="filter-controls">
        <div className="filter-group">
          <label htmlFor="status-filter">状态:</label>
          <select
            id="status-filter"
            value={filters.status}
            onChange={handleStatusChange}
          >
            <option value="">全部状态</option>
            <option value="published">已发布</option>
            <option value="draft">草稿</option>
            <option value="reviewing">审核中</option>
            <option value="rejected">被拒绝</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="type-filter">内容类型:</label>
          <select
            id="type-filter"
            value={filters.contentType}
            onChange={handleContentTypeChange}
          >
            <option value="">全部类型</option>
            <option value="180_video">180° 视频</option>
            <option value="180_photo">180° 照片</option>
            <option value="360_video">360° 视频</option>
            <option value="360_photo">360° 照片</option>
            <option value="spatial_video">空间视频</option>
            <option value="spatial_photo">空间照片</option>
          </select>
        </div>
        
        <button 
          type="button" 
          className="clear-filters-btn"
          onClick={handleClearFilters}
        >
          清除筛选
        </button>
      </div>
    </div>
  );
};

export default ContentFilters;