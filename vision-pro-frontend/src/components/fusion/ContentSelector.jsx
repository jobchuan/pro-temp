// components/fusion/ContentSelector.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Checkbox, Input, Select, Spin, List, Card, Button, Empty } from '../ui/common';

const ContentSelector = ({
  visible,
  onCancel,
  onSelect,
  availableContents,
  selectedContentIds = []
}) => {
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filteredContents, setFilteredContents] = useState([]);
  const [selectedContents, setSelectedContents] = useState([]);
  const [contentType, setContentType] = useState('all');
  
  useEffect(() => {
    if (visible) {
      filterContents();
    }
  }, [visible, search, contentType, availableContents]);
  
  useEffect(() => {
    // 重置选择状态
    if (visible) {
      setSelectedContents([]);
      setSearch('');
      setContentType('all');
    }
  }, [visible]);
  
  const filterContents = () => {
    setLoading(true);
    
    let filtered = [...availableContents];
    
    // 排除已选择的内容
    filtered = filtered.filter(content => !selectedContentIds.includes(content._id));
    
    // 根据内容类型筛选
    if (contentType !== 'all') {
      filtered = filtered.filter(content => content.contentType === contentType);
    }
    
    // 根据搜索关键词筛选
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(content => {
        const title = (content.title?.['zh-CN'] || '') + (content.title?.['en-US'] || '');
        const description = (content.description?.['zh-CN'] || '') + (content.description?.['en-US'] || '');
        const tags = content.tags ? content.tags.join(' ') : '';
        
        return (
          title.toLowerCase().includes(searchLower) ||
          description.toLowerCase().includes(searchLower) ||
          tags.toLowerCase().includes(searchLower)
        );
      });
    }
    
    setFilteredContents(filtered);
    setLoading(false);
  };
  
  const handleContentSelect = (content) => {
    const isSelected = selectedContents.some(item => item._id === content._id);
    
    if (isSelected) {
      setSelectedContents(selectedContents.filter(item => item._id !== content._id));
    } else {
      setSelectedContents([...selectedContents, content]);
    }
  };
  
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };
  
  const handleTypeChange = (value) => {
    setContentType(value);
  };
  
  const handleSelectAll = () => {
    if (selectedContents.length === filteredContents.length) {
      setSelectedContents([]);
    } else {
      setSelectedContents([...filteredContents]);
    }
  };
  
  const handleConfirm = () => {
    onSelect(selectedContents);
  };
  
  const isContentSelected = (contentId) => {
    return selectedContents.some(item => item._id === contentId);
  };
  
  return (
    <Modal
      title="选择内容"
      visible={visible}
      onCancel={onCancel}
      width={800}
      footer={[
        <Button key="back" onClick={onCancel}>
          取消
        </Button>,
        <Button
          key="submit"
          type="primary"
          disabled={selectedContents.length === 0}
          onClick={handleConfirm}
        >
          添加所选内容 ({selectedContents.length})
        </Button>
      ]}
    >
      <div className="content-selector">
        <div className="selector-filters">
          <Input
            placeholder="搜索内容"
            value={search}
            onChange={handleSearchChange}
            style={{ width: 200, marginRight: 16 }}
          />
          
          <Select
            placeholder="内容类型"
            value={contentType}
            onChange={handleTypeChange}
            style={{ width: 160, marginRight: 16 }}
          >
            <Select.Option value="all">全部类型</Select.Option>
            <Select.Option value="180_video">180° 视频</Select.Option>
            <Select.Option value="180_photo">180° 照片</Select.Option>
            <Select.Option value="360_video">360° 视频</Select.Option>
            <Select.Option value="360_photo">360° 照片</Select.Option>
            <Select.Option value="spatial_video">空间视频</Select.Option>
            <Select.Option value="spatial_photo">空间照片</Select.Option>
          </Select>
          
          <Button
            onClick={handleSelectAll}
          >
            {selectedContents.length === filteredContents.length ? '取消全选' : '全选'}
          </Button>
        </div>
        
        <div className="content-select-results">
          {loading ? (
            <div className="loading-container">
              <Spin tip="加载内容中..." />
            </div>
          ) : (
            <>
              {filteredContents.length > 0 ? (
                <List
                  grid={{ gutter: 16, column: 3 }}
                  dataSource={filteredContents}
                  renderItem={content => (
                    <List.Item>
                      <Card
                        hoverable
                        className={`content-select-card ${isContentSelected(content._id) ? 'selected' : ''}`}
                        cover={
                          <div className="content-thumbnail">
                            <img 
                              alt={content.title?.['zh-CN']} 
                              src={content.files?.thumbnail?.url || '/default-thumbnail.jpg'} 
                            />
                            <div className="content-type-badge">
                              {getContentTypeText(content.contentType)}
                            </div>
                          </div>
                        }
                        onClick={() => handleContentSelect(content)}
                      >
                        <Checkbox
                          checked={isContentSelected(content._id)}
                          onChange={() => handleContentSelect(content)}
                        />
                        <div className="content-title">
                          {content.title?.['zh-CN'] || content.title?.['en-US'] || '无标题'}
                        </div>
                        <div className="content-duration">
                          {formatDuration(content.files?.main?.duration || 0)}
                        </div>
                      </Card>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty 
                  description="没有找到可用的内容" 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
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

export default ContentSelector;