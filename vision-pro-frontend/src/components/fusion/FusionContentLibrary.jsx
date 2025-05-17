// components/fusion/FusionContentLibrary.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { creatorApi } from '../../services/apiService';
import FusionContentCard from './FusionContentCard';
import FusionContentFilters from './FusionContentFilters';
import { Button, Pagination, Spin, Empty, Modal, message, Card, Tabs } from '../ui/common';

const FusionContentLibrary = () => {
  const navigate = useNavigate();
  const [fusions, setFusions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: '',
    page: 1,
    limit: 12,
    sort: '-createdAt'
  });
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

  useEffect(() => {
    fetchFusions();
  }, [filters]);

  const fetchFusions = async () => {
    setLoading(true);
    try {
      const response = await creatorApi.getFusions(filters);
      setFusions(response.data.data.fusions);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('获取融合内容列表失败:', error);
      message.error('获取融合内容列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters({
      ...filters,
      ...newFilters,
      page: newFilters.hasOwnProperty('page') ? newFilters.page : 1
    });
  };

  const handlePageChange = (page, pageSize) => {
    setFilters({
      ...filters,
      page,
      limit: pageSize
    });
  };

  const handleAction = (action, fusionId) => {
    switch (action) {
      case 'edit':
        navigate(`/creator/fusion/${fusionId}`);
        break;
        
      case 'preview':
        window.open(`/fusion/${fusionId}/preview`, '_blank');
        break;
        
      case 'delete':
        setConfirmModal({
          visible: true,
          title: '确认删除',
          content: '确定要删除此融合内容吗？此操作不可撤销。',
          action: async () => {
            await creatorApi.deleteFusion(fusionId);
            message.success('融合内容已删除');
            fetchFusions();
          }
        });
        break;
        
      case 'publish':
        setConfirmModal({
          visible: true,
          title: '确认发布',
          content: '确定要发布此融合内容吗？',
          action: async () => {
            await creatorApi.updateFusionStatus(fusionId, 'published');
            message.success('融合内容已发布');
            fetchFusions();
          }
        });
        break;
        
      case 'unpublish':
        setConfirmModal({
          visible: true,
          title: '确认取消发布',
          content: '确定要取消发布此融合内容吗？',
          action: async () => {
            await creatorApi.updateFusionStatus(fusionId, 'draft');
            message.success('融合内容已取消发布');
            fetchFusions();
          }
        });
        break;
        
      default:
        break;
    }
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
      console.error('操作失败:', error);
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

  return (
    <div className="fusion-library">
      <div className="fusion-library-header">
        <h1>融合内容</h1>
        <Button 
          type="primary" 
          icon="plus" 
          onClick={() => navigate('/creator/fusion/new')}
        >
          创建融合内容
        </Button>
      </div>
      
      <Card className="fusion-intro">
        <Tabs defaultActiveKey="1">
          <Tabs.TabPane tab="什么是融合内容?" key="1">
            <div className="fusion-intro-content">
              <h3>将多个内容组合为一个完整体验</h3>
              <p>融合内容允许您将多个视频、照片和其他VR内容组合成一个连贯的体验，让用户沉浸在您创建的完整旅程中。</p>
              <div className="intro-advantages">
                <div className="advantage-item">
                  <div className="advantage-icon">🔄</div>
                  <div className="advantage-text">
                    <h4>无缝过渡</h4>
                    <p>内容之间自动平滑过渡</p>
                  </div>
                </div>
                <div className="advantage-item">
                  <div className="advantage-icon">📈</div>
                  <div className="advantage-text">
                    <h4>增加观看时长</h4>
                    <p>让用户持续沉浸在您的内容中</p>
                  </div>
                </div>
                <div className="advantage-item">
                  <div className="advantage-icon">💰</div>
                  <div className="advantage-text">
                    <h4>提高收益</h4>
                    <p>融合内容可以设置统一价格</p>
                  </div>
                </div>
              </div>
            </div>
          </Tabs.TabPane>
          <Tabs.TabPane tab="如何使用?" key="2">
            <div className="fusion-intro-content">
              <h3>创建融合内容的三个简单步骤</h3>
              <div className="intro-steps">
                <div className="step-item">
                  <div className="step-number">1</div>
                  <div className="step-text">
                    <h4>选择内容</h4>
                    <p>从您的内容库中选择要融合的内容</p>
                  </div>
                </div>
                <div className="step-item">
                  <div className="step-number">2</div>
                  <div className="step-text">
                    <h4>排序和设置</h4>
                    <p>调整内容顺序和过渡效果</p>
                  </div>
                </div>
                <div className="step-item">
                  <div className="step-number">3</div>
                  <div className="step-text">
                    <h4>发布</h4>
                    <p>设置封面和描述并发布您的融合内容</p>
                  </div>
                </div>
              </div>
            </div>
          </Tabs.TabPane>
        </Tabs>
      </Card>
      
      <FusionContentFilters 
        filters={filters} 
        onFilterChange={handleFilterChange} 
      />
      
      {loading ? (
        <div className="loading-spinner">
          <Spin size="large" tip="加载融合内容中..." />
        </div>
      ) : (
        <>
          <div className="fusion-grid">
            {fusions.map(fusion => (
              <FusionContentCard 
                key={fusion._id}
                fusion={fusion}
                onAction={handleAction}
              />
            ))}
          </div>
          
          {fusions.length === 0 && (
            <Empty 
              description="还没有创建融合内容"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button type="primary" onClick={() => navigate('/creator/fusion/new')}>
                创建融合内容
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
                showTotal={total => `共 ${total} 个融合内容`}
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

export default FusionContentLibrary;