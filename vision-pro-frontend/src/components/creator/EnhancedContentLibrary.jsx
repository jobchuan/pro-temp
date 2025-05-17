// components/creator/EnhancedContentLibrary.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { creatorApi } from '../../services/apiService';
import EnhancedContentCard from './EnhancedContentCard';
import EnhancedContentFilters from './EnhancedContentFilters';
import EnhancedBatchActions from './EnhancedBatchActions';
import { Button, Pagination, Spin, Empty, Modal, message } from '../ui/common';

const EnhancedContentLibrary = () => {
  const navigate = useNavigate();
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    tags: [],
    dateFrom: null,
    dateTo: null,
    pricing: null,
    publishStatus: '',
    page: 1,
    limit: 20,
    sort: '-createdAt'
  });
  const [selectedContents, setSelectedContents] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0
  });
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    title: '',
    content: '',
    action: null,
    loading: false
  });
  const [layout, setLayout] = useState('grid'); // 'grid' 或 'list'
  const [allTags, setAllTags] = useState([]);

  useEffect(() => {
    fetchContents();
    fetchAllTags();
  }, [filters]);

  const fetchContents = async () => {
    setLoading(true);
    try {
      const response = await creatorApi.getContents(filters);
      setContents(response.data.data.contents);
      setPagination(response.data.data.pagination);
      
      // 如果有选中内容，检查它们是否仍然在结果中
      if (selectedContents.length > 0) {
        const newContentIds = response.data.data.contents.map(c => c._id);
        setSelectedContents(prevSelected => 
          prevSelected.filter(id => newContentIds.includes(id))
        );
      }
    } catch (error) {
      console.error('获取内容列表失败:', error);
      message.error('获取内容列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTags = async () => {
    try {
      const response = await creatorApi.getCreatorTags();
      setAllTags(response.data.data.tags);
    } catch (error) {
      console.error('获取标签列表失败:', error);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters({
      ...filters,
      ...newFilters,
      page: newFilters.hasOwnProperty('page') ? newFilters.page : 1 // 如果不是分页变化，重置到第一页
    });
  };

  const handlePageChange = (page, pageSize) => {
    setFilters({
      ...filters,
      page,
      limit: pageSize
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
          message.success(`已将 ${selectedContents.length} 个内容状态更改为 "${getStatusText(data)}"`);
          break;
          
        case 'tags':
          if (data.action === 'add') {
            await creatorApi.batchAddTags({ contentIds: selectedContents, tags: data.tags });
            message.success(`已为 ${selectedContents.length} 个内容添加标签`);
          } else if (data.action === 'remove') {
            await creatorApi.batchRemoveTags({ contentIds: selectedContents, tags: data.tags });
            message.success(`已从 ${selectedContents.length} 个内容移除标签`);
          } else if (data.action === 'replace') {
            await creatorApi.batchReplaceTags({ contentIds: selectedContents, tags: data.tags });
            message.success(`已替换 ${selectedContents.length} 个内容的所有标签`);
          }
          break;
          
        case 'delete':
          setConfirmModal({
            visible: true,
            title: '确认删除',
            content: `确定要删除所选的 ${selectedContents.length} 个内容吗？此操作不可撤销。`,
            action: async () => {
              await creatorApi.batchDeleteContents({ contentIds: selectedContents });
              message.success(`已删除 ${selectedContents.length} 个内容`);
              setSelectedContents([]);
            }
          });
          return; // 不立即执行，等待用户确认
          
        case 'export':
          await handleExportData();
          return;
          
        default:
          return;
      }
      
      // 刷新内容列表
      fetchContents();
      // 清除选中
      setSelectedContents([]);
      
    } catch (error) {
      console.error('批量操作失败:', error);
      message.error('批量操作失败: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleExportData = async () => {
    try {
      message.loading('正在准备导出数据...', 0);
      
      // 调用导出API
      const response = await creatorApi.exportContents({
        contentIds: selectedContents,
        format: 'excel' // 也可以是'csv'或'json'
      });
      
      // 下载文件
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `content-export-${new Date().toISOString().slice(0,10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      message.destroy();
      message.success('数据导出成功');
    } catch (error) {
      message.destroy();
      console.error('导出数据失败:', error);
      message.error('导出数据失败: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSingleContentAction = async (action, contentId) => {
    try {
      switch (action) {
        case 'edit':
          navigate(`/creator/content/${contentId}`);
          break;
          
        case 'duplicate':
          const response = await creatorApi.duplicateContent(contentId);
          message.success('内容已复制');
          navigate(`/creator/content/${response.data.data._id}`);
          break;
          
        case 'status':
          await creatorApi.updateContentStatus(contentId, data.status);
          message.success(`内容状态已更改为"${getStatusText(data.status)}"`);
          fetchContents();
          break;
          
        case 'delete':
          setConfirmModal({
            visible: true,
            title: '确认删除',
            content: '确定要删除此内容吗？此操作不可撤销。',
            action: async () => {
              await creatorApi.deleteContent(contentId);
              message.success('内容已删除');
              fetchContents();
            }
          });
          break;
          
        default:
          break;
      }
    } catch (error) {
      console.error('操作失败:', error);
      message.error('操作失败: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSelectAll = () => {
    setSelectedContents(contents.map(content => content._id));
  };

  const handleDeselectAll = () => {
    setSelectedContents([]);
  };

  const handleConfirmModalOk = async () => {
    setConfirmModal({
      ...confirmModal,
      loading: true
    });
    
    try {
      await confirmModal.action();
      setConfirmModal({
        visible: false,
        title: '',
        content: '',
        action: null,
        loading: false
      });
    } catch (error) {
      console.error('确认操作失败:', error);
      message.error('操作失败: ' + (error.response?.data?.message || error.message));
      setConfirmModal({
        ...confirmModal,
        loading: false
      });
    }
  };

  const handleConfirmModalCancel = () => {
    setConfirmModal({
      visible: false,
      title: '',
      content: '',
      action: null,
      loading: false
    });
  };

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

  const getSelectedContentsData = () => {
    return contents.filter(content => selectedContents.includes(content._id));
  };

  return (
    <div className="content-library">
      <div className="content-library-header">
        <div className="content-library-title">
          <h1>我的内容</h1>
          <div className="content-stats">
            <span className="stat-item">
              总内容: <strong>{pagination.total || 0}</strong>
            </span>
            <span className="stat-item">
              已发布: <strong>{contents.filter(c => c.status === 'published').length}</strong>
            </span>
            <span className="stat-item">
              草稿: <strong>{contents.filter(c => c.status === 'draft').length}</strong>
            </span>
          </div>
        </div>
        
        <div className="content-library-actions">
          <div className="view-controls">
            <Button 
              icon="appstore" 
              className={layout === 'grid' ? 'active' : ''} 
              onClick={() => setLayout('grid')}
            />
            <Button 
              icon="bars" 
              className={layout === 'list' ? 'active' : ''} 
              onClick={() => setLayout('list')}
            />
          </div>
          
          <Button 
            type="primary" 
            icon="plus" 
            onClick={() => navigate('/creator/content/new')}
          >
            创建新内容
          </Button>
        </div>
      </div>
      
      <EnhancedContentFilters 
        filters={filters} 
        onFilterChange={handleFilterChange}
        totalCount={pagination.total}
        allTags={allTags}
      />
      
      {selectedContents.length > 0 && (
        <EnhancedBatchActions 
          selectedCount={selectedContents.length} 
          selectedContents={getSelectedContentsData()}
          onAction={handleBatchAction}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          totalCount={contents.length}
        />
      )}
      
      {loading ? (
        <div className="loading-spinner">
          <Spin size="large" tip="加载内容中..." />
        </div>
      ) : (
        <>
          <div className={`content-${layout}`}>
            {contents.map(content => (
              <EnhancedContentCard 
                key={content._id}
                content={content}
                isSelected={selectedContents.includes(content._id)}
                onSelect={(isSelected) => handleContentSelect(content._id, isSelected)}
                onAction={handleSingleContentAction}
                layout={layout}
              />
            ))}
          </div>
          
          {contents.length === 0 && (
            <Empty 
              description={
                Object.keys(filters).some(key => 
                  ['status', 'contentType', 'category', 'search', 'tags'].includes(key) && 
                  filters[key]
                ) ? "未找到匹配内容。尝试调整筛选条件。" : "还没有创建内容。点击"创建新内容"按钮开始创建。"
              }
            >
              <Button type="primary" onClick={() => navigate('/creator/content/new')}>
                创建新内容
              </Button>
            </Empty>
          )}
          
          {pagination.pages > 1 && (
            <div className="pagination-container">
              <Pagination
                current={filters.page}
                pageSize={filters.limit}
                total={pagination.total}
                onChange={handlePageChange}
                showSizeChanger
                showQuickJumper
                showTotal={total => `共 ${total} 个内容`}
              />
            </div>
          )}
        </>
      )}
      
      <Modal
        title={confirmModal.title}
        visible={confirmModal.visible}
        onOk={handleConfirmModalOk}
        confirmLoading={confirmModal.loading}
        onCancel={handleConfirmModalCancel}
        okText="确定"
        cancelText="取消"
      >
        <p>{confirmModal.content}</p>
      </Modal>
    </div>
  );
};

export default EnhancedContentLibrary;