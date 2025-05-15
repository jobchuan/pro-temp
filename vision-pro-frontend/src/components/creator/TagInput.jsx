// components/creator/TagInput.jsx
import React, { useState } from 'react';

const TagInput = ({ tags = [], onChange }) => {
  const [inputValue, setInputValue] = useState('');
  
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };
  
  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      const newTag = inputValue.trim();
      
      if (!tags.includes(newTag)) {
        const updatedTags = [...tags, newTag];
        onChange(updatedTags);
      }
      
      setInputValue('');
    }
  };
  
  const removeTag = (tagToRemove) => {
    const updatedTags = tags.filter(tag => tag !== tagToRemove);
    onChange(updatedTags);
  };
  
  return (
    <div className="tag-input-container">
      <div className="tags-list">
        {tags.map(tag => (
          <span key={tag} className="tag">
            {tag}
            <button 
              type="button" 
              className="tag-remove-btn" 
              onClick={() => removeTag(tag)}
            >
              &times;
            </button>
          </span>
        ))}
      </div>
      
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
        placeholder="输入标签，按回车添加"
        className="tag-input"
      />
      <small className="tag-hint">添加标签以提高内容发现率</small>
    </div>
  );
};

export default TagInput;