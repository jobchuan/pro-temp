// components/creator/EnhancedIncomeCard.jsx
import React from 'react';
import { Card, Tooltip, Tag } from '../ui/common';
import { formatCurrency } from '../../utils/formatter';

const EnhancedIncomeCard = ({ 
  title, 
  value, 
  currency = 'CNY', 
  color = 'blue', 
  icon,
  change,
  tooltip
}) => {
  // 格式化金额
  const formattedValue = formatCurrency(value, currency);
  
  // 为不同颜色设置类
  const colorClass = `income-card-${color}`;
  
  // 图标映射
  const getIconElement = (iconName) => {
    switch (iconName) {
      case 'wallet':
        return '💰';
      case 'calendar':
        return '📅';
      case 'bar-chart':
        return '📊';
      default:
        return '💴';
    }
  };
  
  return (
    <Card className={`income-card ${colorClass}`}>
      <Tooltip title={tooltip}>
        <div className="income-card-content">
          <div className="income-card-icon">
            {getIconElement(icon)}
          </div>
          
          <div className="income-card-info">
            <div className="income-card-title">{title}</div>
            <div className="income-card-value">{formattedValue}</div>
            
            {change !== undefined && (
              <div className="income-card-change">
                <Tag color={change >= 0 ? 'green' : 'red'}>
                  {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                </Tag>
              </div>
            )}
          </div>
        </div>
      </Tooltip>
    </Card>
  );
};

export default EnhancedIncomeCard;