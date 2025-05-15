// components/creator/IncomeCard.jsx
import React from 'react';

const IncomeCard = ({ title, value, currency = 'CNY', color = 'blue' }) => {
  // 格式化金额
  const formatCurrency = (amount, currencyCode) => {
    switch (currencyCode) {
      case 'CNY':
        return `¥${amount.toFixed(2)}`;
      case 'USD':
        return `$${amount.toFixed(2)}`;
      case 'EUR':
        return `€${amount.toFixed(2)}`;
      default:
        return `${amount.toFixed(2)} ${currencyCode}`;
    }
  };
  
  // 为不同颜色设置类
  const colorClass = `income-card-${color}`;
  
  return (
    <div className={`income-card ${colorClass}`}>
      <div className="income-card-title">{title}</div>
      <div className="income-card-value">{formatCurrency(value, currency)}</div>
    </div>
  );
};

export default IncomeCard;