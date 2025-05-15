// components/creator/StatsCard.jsx
import React from 'react';

const StatsCard = ({ title, value, icon }) => {
  // 简单的图标映射
  const getIconElement = (iconName) => {
    switch (iconName) {
      case 'eye':
        return '👁️';
      case 'users':
        return '👥';
      case 'thumbs-up':
        return '👍';
      case 'message-circle':
        return '💬';
      default:
        return '📊';
    }
  };

  return (
    <div className="stats-card">
      <div className="stats-icon">
        {getIconElement(icon)}
      </div>
      <div className="stats-info">
        <h3>{title}</h3>
        <div className="stats-value">{value.toLocaleString()}</div>
      </div>
    </div>
  );
};

export default StatsCard;