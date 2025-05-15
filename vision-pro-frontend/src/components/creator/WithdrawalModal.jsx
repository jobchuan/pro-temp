// components/creator/WithdrawalModal.jsx
import React, { useState } from 'react';

const WithdrawalModal = ({ availableAmount, onRequestWithdrawal, onClose }) => {
  const [amount, setAmount] = useState(availableAmount);
  const [withdrawalMethod, setWithdrawalMethod] = useState('alipay');
  const [accountInfo, setAccountInfo] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 确保金额有效
    if (amount <= 0 || amount > availableAmount) {
      alert('请输入有效的提现金额');
      return;
    }
    
    if (!accountInfo.trim()) {
      alert('请输入账号信息');
      return;
    }
    
    onRequestWithdrawal({
      amount,
      method: withdrawalMethod,
      accountInfo
    });
  };
  
  return (
    <div className="modal withdrawal-modal">
      <div className="modal-content">
        <h2>申请提现</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="withdrawal-amount">提现金额</label>
            <input
              type="number"
              id="withdrawal-amount"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value))}
              min="0.01"
              max={availableAmount}
              step="0.01"
              required
            />
            <small>可提现金额: ¥{availableAmount.toFixed(2)}</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="withdrawal-method">提现方式</label>
            <select
              id="withdrawal-method"
              value={withdrawalMethod}
              onChange={(e) => setWithdrawalMethod(e.target.value)}
              required
            >
              <option value="alipay">支付宝</option>
              <option value="wechat">微信支付</option>
              <option value="bank">银行卡</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="account-info">
              {withdrawalMethod === 'alipay' ? '支付宝账号' : 
               withdrawalMethod === 'wechat' ? '微信账号' : '银行卡信息'}
            </label>
            <input
              type="text"
              id="account-info"
              value={accountInfo}
              onChange={(e) => setAccountInfo(e.target.value)}
              placeholder={
                withdrawalMethod === 'alipay' ? '请输入支付宝账号' : 
                withdrawalMethod === 'wechat' ? '请输入微信账号' : 
                '请输入开户行、账号和账户名'
              }
              required
            />
          </div>
          
          <div className="withdrawal-notes">
            <p>提现说明:</p>
            <ul>
              <li>提现申请将在1-3个工作日内处理</li>
              <li>请确保提供的账户信息准确无误</li>
              <li>如有问题，请联系客服</li>
            </ul>
          </div>
          
          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="primary-button">
              确认提现
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WithdrawalModal;