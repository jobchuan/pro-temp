// components/creator/EnhancedBatchActions.jsx
import React, { useState } from 'react';
import { Modal, Button, Tag, Tooltip } from '../ui/common';

const EnhancedBatchActions = ({ selectedCount, selectedContents, onAction, onSelectAll, onDeselectAll, totalCount }) => {
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [tagAction, setTagAction] = useState('add');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [commonTags, setCommonTags] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 当选中内容变化时，计算共同标签
  React.useEffect(() => {
    if (selectedContents && selectedContents.length > 0) {
      // 获取所有选中内容的标签
      let allTags = {};
      let contentCount = selectedContents.length;
      
      selectedContents.forEach(content => {
        if (content.tags) {
          content.tags.forEach(tag => {
            allTags[tag] = (allTags[tag] || 0) + 1;
          });
        }
      });
      
      // 找出所有内容都有的标签
      const common = Object.keys(allTags).filter(tag => allTags[tag] === contentCount);
      setCommonTags(common);
    } else {
      setCommonTags([]);
    }
  }, [selectedContents]);
  
  const handleStatusChange = (status) => {
    setConfirmAction(() => () => onAction('status', status));
    setConfirmMessage(`确定要将所选的 ${selectedCount} 个内容状态更改为"${getStatusText(status)}"吗？`);
    setShowConfirmModal(true);
  };
  
  const handleDeleteAction = () => {
    setConfirmAction(() => () => onAction('delete'));
    setConfirmMessage(`确定要删除所选的 ${selectedCount} 个内容吗？此操作不可撤销。`);
    setShowConfirmModal(true);
  };
  
  const handleTagsSubmit = (e) => {
    e.preventDefault();
    const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag);
    if (tags.length > 0) {
      setIsProcessing(true);
      onAction('tags', { action: tagAction, tags })
        .finally(() => {
          setIsProcessing(false);
          setShowTagsModal(false);
          setTagsInput('');
        });
    }
  };
  
  const handleConfirmAction = () => {
    if (confirmAction) {
      setIsProcessing(true);
      Promise.resolve(confirmAction())
        .finally(() => {
          setIsProcessing(false);
          setShowConfirmModal(false);
          setConfirmAction(null);
        });
    }
  };
  
  const getStatusText = (status) => {
    const statusMap = {
      'draft': '草稿',
      'pending_review': '待审核',
      'published': '已发布',
      'rejected': '被拒绝',
      'archived': '已归档'
    };
    return statusMap[status] || status;
  };
  
  const removeTag = (tag) => {
    setConfirmAction(() => () => onAction('tags', { action: 'remove', tags: [tag] }));
    setConfirmMessage(`确定要从所选的 ${selectedCount} 个内容中移除标签"${tag}"吗？`);
    setShowConfirmModal(true);
  };
  
  return (
    <div className="batch-actions">
      <div className="batch-info">
        已选择 <strong>{selectedCount}</strong> 个内容
        <div className="selection-actions">
          <Button 
            type="text" 
            size="small" 
            onClick={onSelectAll}
          >
            全选
          </Button>
          <Button 
            type="text" 
            size="small" 
            onClick={onDeselectAll}
          >
            取消选择
          </Button>
        </div>
      </div>
      
      {commonTags.length > 0 && (
        <div className="common-tags">
          <span className="common-tags-label">共同标签:</span>
          {commonTags.map(tag => (
            <Tag 
              key={tag} 
              closable 
              onClose={() => removeTag(tag)}
            >
              {tag}
            </Tag>
          ))}
        </div>
      )}
      
      <div className="action-buttons">
        <div className="action-dropdown">
          <Button className="action-dropdown-toggle">更改状态</Button>
          <div className="action-dropdown-menu">
            <Button onClick={() => handleStatusChange('published')}>设为已发布</Button>
            <Button onClick={() => handleStatusChange('draft')}>设为草稿</Button>
            <Button onClick={() => handleStatusChange('pending_review')}>提交审核</Button>
            <Button onClick={() => handleStatusChange('archived')}>归档</Button>
          </div>
        </div>
        
        <Button onClick={() => setShowTagsModal(true)}>管理标签</Button>
        
        <Tooltip title="导出所选内容的数据">
          <Button onClick={() => onAction('export')}>导出数据</Button>
        </Tooltip>
        
        <Button 
          className="danger-button" 
          onClick={handleDeleteAction}
        >
          删除
        </Button>
      </div>
      
      {showTagsModal && (
        <Modal
          title="管理标签"
          visible={showTagsModal}
          onCancel={() => setShowTagsModal(false)}
          footer={null}
        >
          <form onSubmit={handleTagsSubmit}>
            <div className="form-group">
              <label>标签操作:</label>
              <select 
                value={tagAction}
                onChange={(e) => setTagAction(e.target.value)}
                disabled={isProcessing}
              >
                <option value="add">添加标签</option>
                <option value="remove">移除标签</option>
                <option value="replace">替换所有标签</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>标签 (用逗号分隔):</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="旅行,教育,VR..."
                required
                disabled={isProcessing}
              />
              <small>标签可以提高内容的可发现性并帮助用户找到您的内容</small>
            </div>
            
            {commonTags.length > 0 && tagAction !== 'replace' && (
              <div className="common-tags-section">
                <label>当前共同标签:</label>
                <div className="tags-list">
                  {commonTags.map(tag => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </div>
              </div>
            )}
            
            <div className="modal-actions">
              <Button type="text" onClick={() => setShowTagsModal(false)} disabled={isProcessing}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={isProcessing}>
                确定
              </Button>
            </div>
          </form>
        </Modal>
      )}
      
      {showConfirmModal && (
        <Modal
          title="确认操作"
          visible={showConfirmModal}
          onCancel={() => setShowConfirmModal(false)}
          footer={[
            <Button key="back" onClick={() => setShowConfirmModal(false)} disabled={isProcessing}>
              取消
            </Button>,
            <Button 
              key="submit" 
              type="primary" 
              onClick={handleConfirmAction}
              loading={isProcessing}
            >
              确定
            </Button>,
          ]}
        >
          <p>{confirmMessage}</p>
        </Modal>
      )}
    </div>
  );
};

export default EnhancedBatchActions;