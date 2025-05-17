// components/fusion/FusionContentFilters.jsx
import React, { useState } from 'react';
import { Input, Select, Button } from '../ui/common';

const FusionContentFilters = ({ filters, onFilterChange }) => {
  const [searchText, setSearchText] = useState(filters.search || '');
  
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
  
  const handleCategoryChange = (value) => {
    onFilterChange({ category: value });
  };
  
  const handleSortChange = (value) => {
    onFilterChange({ sort: value });
  };
  
  const handleClearFilters = () => {
    setSearchText('');
    onFilterChange({
      status: '',
      category: '',
      search: '',
      sort: '-createdAt'
    });
  };
  
  return (
    <div className="fusion-filters">
      <form onSubmit={handleSearchSubmit} className="search-form">
        <Input
          placeholder="搜索融合内容"
          value={searchText}
          onChange={handleSearchChange}
          suffix={<Button type="primary" htmlType="submit">搜索</Button>}
        />
      </form>
      
      <div className="filter-controls">
        <div className="filter-group">
          <label>状态:</label>
          <Select
            value={filters.status}
            onChange={handleStatusChange}
            style={{ width: 120 }}
          >
            <Select.Option value="">全部状态</Select.Option>
            <Select.Option value="published">已发布</Select.Option>
            <Select.Option value="draft">草稿</Select.Option>
            <Select.Option value="archived">已归档</Select.Option>
          </Select>
        </div>
        
        <div className="filter-group">
          <label>分类:</label>
          <Select
            value={filters.category}
            onChange={handleCategoryChange}
            style={{ width: 120 }}
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
          <label>排序:</label>
          <Select
            value={filters.sort}
            onChange={handleSortChange}
            style={{ width: 150 }}
          >
            <Select.Option value="-createdAt">最新创建</Select.Option>
            <Select.Option value="-stats.views">最多观看</Select.Option>
            <Select.Option value="-contents.length">内容数量</Select.Option>
            <Select.Option value="title">名称 A-Z</Select.Option>
          </Select>
        </div>
        
        <Button onClick={handleClearFilters}>
          清除筛选
        </Button>
      </div>
    </div>
  );
};

export default FusionContentFilters;