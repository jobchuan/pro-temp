// components/creator/ContentLibrary.jsx
import React, { useState, useEffect } from 'react';
import { creatorApi } from '../../services/apiService';
import ContentCard from './ContentCard';
import ContentFilters from './ContentFilters';
import BatchActions from './BatchActions';

const ContentLibrary = () => {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    contentType: '',
    search: '',
    page: 1,
    limit: 20
  });
  const [selectedContents, setSelectedContents] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchContents();
  }, [filters]);

  const fetchContents = async () => {
    setLoading(true);
    try {
      const response = await creatorApi.getContents(filters);
      setContents(response.data.data.contents);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('获取内容列表失败:', error);
      // 处理错误状态
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters({
      ...filters,
      ...newFilters,
      page: 1 // 筛选条件改变时重置到第一页
    });
  };

  const handlePageChange = (page) => {
    setFilters({
      ...filters,
      page
    });
  };

  const handleContentSelect = (contentId, isSelected) => {
    if (isSelected) {
      setSelectedContents([...selectedContents, contentId]);
    } else {
      setSelectedContents(selectedContents.filter(id => id !== contentId));
    }
  };

  const handleBatchAction = async (action, data) => {
    if (selectedContents.length === 0) return;
    
    try {
      switch (action) {
        case 'status':
          await creatorApi.batchUpdateContent(selectedContents, { status: data });
          break;
        case 'tags':
          if (data.action === 'add') {
            await creatorApi.batchAddTags({ contentIds: selectedContents, tags: data.tags });
          } else {
            await creatorApi.batchRemoveTags({ contentIds: selectedContents, tags: data.tags });
          }
          break;
        case 'delete':
          await creatorApi.batchDeleteContents({ contentIds: selectedContents });
          break;
        default:
          return;
      }
      
      // 刷新内容列表
      fetchContents();
      // 清除选中
      setSelectedContents([]);
      
    } catch (error) {
      console.error('批量操作失败:', error);
      // 处理错误状态
    }
  };

  return (
    <div className="content-library">
      <div className="content-library-header">
        <h1>我的内容</h1>
        <button className="primary-button">上传新内容</button>
      </div>
      
      <ContentFilters 
        filters={filters} 
        onFilterChange={handleFilterChange} 
      />
      
      {selectedContents.length > 0 && (
        <BatchActions 
          selectedCount={selectedContents.length} 
          onAction={handleBatchAction}
        />
      )}
      
      {loading ? (
        <div className="loading-spinner">加载中...</div>
      ) : (
        <>
          <div className="content-grid">
            {contents.map(content => (
              <ContentCard 
                key={content._id}
                content={content}
                isSelected={selectedContents.includes(content._id)}
                onSelect={(isSelected) => handleContentSelect(content._id, isSelected)}
              />
            ))}
          </div>
          
          {contents.length === 0 && (
            <div className="empty-state">
              <p>未找到内容。尝试调整筛选条件或上传新内容。</p>
            </div>
          )}
          
          {pagination.pages > 1 && (
            <div className="pagination">
              {Array.from({ length: pagination.pages }, (_, i) => (
                <button
                  key={i+1}
                  className={filters.page === i+1 ? 'active' : ''}
                  onClick={() => handlePageChange(i+1)}
                >
                  {i+1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ContentLibrary;