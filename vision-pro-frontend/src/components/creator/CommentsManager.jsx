// components/creator/CommentsManager.jsx
import React, { useState, useEffect } from 'react';
import { creatorApi } from '../../services/apiService';

const CommentsManager = () => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    contentId: '',
    status: 'all',
    search: '',
    page: 1,
    limit: 20
  });
  
  useEffect(() => {
    fetchComments();
  }, [filters]);
  
  const fetchComments = async () => {
    setLoading(true);
    try {
      // 假设有一个API端点可以获取创作者的所有评论
      const response = await creatorApi.getContentComments('all', filters);
      setComments(response.data.data.comments);
    } catch (error) {
      console.error('获取评论失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleFilterChange = (newFilters) => {
    setFilters({
      ...filters,
      ...newFilters,
      page: 1
    });
  };
  
  const handleReply = async (commentId, replyText) => {
    try {
      await creatorApi.replyToComment(commentId, replyText);
      // 刷新评论列表
      fetchComments();
    } catch (error) {
      console.error('回复评论失败:', error);
    }
  };
  
  const handlePinComment = async (commentId, isPinned) => {
    try {
      await creatorApi.pinComment(commentId, isPinned);
      // 刷新评论列表
      fetchComments();
    } catch (error) {
      console.error('置顶/取消置顶评论失败:', error);
    }
  };
  
  return (
    <div className="comments-manager">
      <h1>评论管理</h1>
      
      <div className="comments-filters">
        <input
          type="text"
          placeholder="搜索评论..."
          value={filters.search}
          onChange={(e) => handleFilterChange({ search: e.target.value })}
        />
        
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange({ status: e.target.value })}
        >
          <option value="all">所有评论</option>
          <option value="pending">待回复</option>
          <option value="replied">已回复</option>
          <option value="pinned">已置顶</option>
        </select>
      </div>
      
      {loading ? (
        <div className="loading-spinner">加载评论中...</div>
      ) : (
        <div className="comments-list">
          {comments.length > 0 ? (
            comments.map(comment => (
              <div key={comment._id} className={`comment-item ${comment.isPinned ? 'pinned' : ''}`}>
                <div className="comment-header">
                  <div className="comment-user">{comment.user.name}</div>
                  <div className="comment-date">
                    {new Date(comment.createdAt).toLocaleString()}
                  </div>
                </div>
                
                <div className="comment-content">{comment.content}</div>
                
                <div className="comment-meta">
                  <div className="comment-content-info">
                    来自: {comment.contentId.title['zh-CN']}
                  </div>
                </div>
                
                {comment.reply && (
                  <div className="comment-reply">
                    <div className="reply-header">
                      <div className="reply-user">您的回复:</div>
                      <div className="reply-date">
                        {new Date(comment.replyDate).toLocaleString()}
                      </div>
                    </div>
                    <div className="reply-content">{comment.reply}</div>
                  </div>
                )}
                
                <div className="comment-actions">
                  <button 
                    onClick={() => handlePinComment(comment._id, !comment.isPinned)}
                  >
                    {comment.isPinned ? '取消置顶' : '置顶'}
                  </button>
                  
                  {!comment.reply && (
                    <button 
                      onClick={() => {
                        const replyText = prompt('请输入回复内容:');
                        if (replyText) {
                          handleReply(comment._id, replyText);
                        }
                      }}
                    >
                      回复
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p>没有符合条件的评论</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentsManager;