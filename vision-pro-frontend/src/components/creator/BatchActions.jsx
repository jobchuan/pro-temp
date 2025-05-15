// components/creator/BatchActions.jsx
import React, { useState } from 'react';

const BatchActions = ({ selectedCount, onAction }) => {
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [tagAction, setTagAction] = useState('add');
  
  const handleStatusChange = (status) => {
    onAction('status', status);
  };
  
  const handleDeleteAction = () => {
    if (window.confirm(`确定要删除所选的 ${selectedCount} 个内容吗？此操作不可撤销。`)) {
      onAction('delete');
    }
  };
  
  const handleTagsSubmit = (e) => {
    e.preventDefault();
    const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag);
    if (tags.length > 0) {
      onAction('tags', { action: tagAction, tags });
      setShowTagsModal(false);
      setTagsInput('');
    }
  };
  
  return (
    <div className="batch-actions">
      <div className="batch-info">
        已选择 <strong>{selectedCount}</strong> 个内容
      </div>
      
      <div className="action-buttons">
        <div className="action-dropdown">
          <button className="action-dropdown-toggle">更改状态</button>
          <div className="action-dropdown-menu">
            <button onClick={() => handleStatusChange('published')}>设为已发布</button>
            <button onClick={() => handleStatusChange('draft')}>设为草稿</button>
          </div>
        </div>
        
        <button onClick={() => setShowTagsModal(true)}>管理标签</button>
        <button className="delete-action" onClick={handleDeleteAction}>删除</button>
      </div>
      
      {showTagsModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>管理标签</h3>
            <form onSubmit={handleTagsSubmit}>
              <div className="form-group">
                <label>标签操作:</label>
                <select 
                  value={tagAction}
                  onChange={(e) => setTagAction(e.target.value)}
                >
                  <option value="add">添加标签</option>
                  <option value="remove">移除标签</option>
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
                />
              </div>
              
              <div className="modal-actions">
                <button type="button" onClick={() => setShowTagsModal(false)}>取消</button>
                <button type="submit">确定</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchActions;