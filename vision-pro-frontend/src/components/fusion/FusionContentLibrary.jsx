// src/components/fusion/FusionContentLibrary.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { creatorApi } from '../../services/apiService';

const FusionContentLibrary = () => {
  const [fusions, setFusions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0
  });
  const navigate = useNavigate();

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

  const handleCreateFusion = () => {
    navigate('/creator/fusion/new');
  };

  const handleEditFusion = (fusionId) => {
    navigate(`/creator/fusion/${fusionId}`);
  };

  const handlePreviewFusion = (fusionId) => {
    navigate(`/creator/fusion/${fusionId}/preview`);
  };

  return (
    <div className="fusion-content-library">
      <div className="library-header">
        <h1>融合内容库</h1>
        <button className="primary-button" onClick={handleCreateFusion}>
          创建融合内容
        </button>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="搜索融合内容..."
          value={filters.search}
          onChange={(e) => handleFilterChange({ search: e.target.value })}
        />

        <select
          value={filters.status}
          onChange={(e) => handleFilterChange({ status: e.target.value })}
        >
          <option value="">全部状态</option>
          <option value="draft">草稿</option>
          <option value="published">已发布</option>
          <option value="archived">已归档</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-spinner">加载中...</div>
      ) : (
        <>
          {fusions.length === 0 ? (
            <div className="empty-state">
              <p>您还没有创建任何融合内容。点击"创建融合内容"按钮开始创建。</p>
            </div>
          ) : (
            <div className="fusion-grid">
              {fusions.map((fusion) => (
                <div key={fusion._id} className="fusion-card">
                  <div className="fusion-thumbnail">
                    <img
                      src={fusion.coverImage?.url || '/default-fusion-thumbnail.jpg'}
                      alt={fusion.title}
                    />
                    <div className="fusion-status">{fusion.status === 'published' ? '已发布' : '草稿'}</div>
                  </div>
                  <div className="fusion-info">
                    <h3>{fusion.title}</h3>
                    <p className="fusion-description">{fusion.description}</p>
                    <div className="fusion-meta">
                      <span>{fusion.contents?.length || 0} 个内容</span>
                      <span>{fusion.stats?.views || 0} 次观看</span>
                    </div>
                  </div>
                  <div className="fusion-actions">
                    <button onClick={() => handleEditFusion(fusion._id)}>编辑</button>
                    <button onClick={() => handlePreviewFusion(fusion._id)}>预览</button>
                  </div>
                </div>
              ))}
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

export default FusionContentLibrary;