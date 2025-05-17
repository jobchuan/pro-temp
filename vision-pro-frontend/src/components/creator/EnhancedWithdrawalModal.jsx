// components/creator/EnhancedWithdrawalModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, InputNumber, Radio, Divider, Alert, message } from '../ui/common';
import { creatorApi } from '../../services/apiService';
import { formatCurrency } from '../../utils/formatter';

const EnhancedWithdrawalModal = ({ availableAmount, onRequestWithdrawal, onClose }) => {
  const [amount, setAmount] = useState(availableAmount);
  const [withdrawalMethod, setWithdrawalMethod] = useState('alipay');
  const [accountInfo, setAccountInfo] = useState('');
  const [savedAccounts, setSavedAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [useNewAccount, setUseNewAccount] = useState(false);
  const [withdrawFee, setWithdrawFee] = useState(0);
  const [actualAmount, setActualAmount] = useState(availableAmount);
  
  useEffect(() => {
    fetchSavedAccounts();
    calculateFee(availableAmount);
  }, []);
  
  useEffect(() => {
    calculateFee(amount);
  }, [amount, withdrawalMethod]);
  
  const fetchSavedAccounts = async () => {
    try {
      const response = await creatorApi.getSavedWithdrawalAccounts();
      setSavedAccounts(response.data.data.accounts);
      
      // 如果有默认账户，使用它
      const defaultAccount = response.data.data.accounts.find(acc => acc.isDefault);
      if (defaultAccount) {
        setWithdrawalMethod(defaultAccount.type);
        setAccountInfo(defaultAccount.account);
        setUseNewAccount(false);
      }
    } catch (error) {
      console.error('获取保存的账户失败:', error);
    }
  };
  
  const calculateFee = (value) => {
    // 根据金额和提现方式计算手续费
    let fee = 0;
    
    if (withdrawalMethod === 'bank') {
      // 银行转账手续费，例如2元固定+0.5%
      fee = 2 + (value * 0.005);
    } else if (withdrawalMethod === 'alipay' || withdrawalMethod === 'wechat') {
      // 支付宝/微信手续费，例如0.6%
      fee = value * 0.006;
    }
    
    // 设置最低手续费
    fee = Math.max(fee, 1);
    // 四舍五入到2位小数
    fee = Math.round(fee * 100) / 100;
    
    setWithdrawFee(fee);
    setActualAmount(value - fee);
  };
  
  const handleAccountSelect = (account) => {
    setWithdrawalMethod(account.type);
    setAccountInfo(account.account);
    setUseNewAccount(false);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 确保金额有效
    if (amount <= 0 || amount > availableAmount) {
      message.error('请输入有效的提现金额');
      return;
    }
    
    if (!accountInfo.trim() && !useNewAccount) {
      message.error('请选择或输入账号信息');
      return;
    }
    
    setLoading(true);
    
    onRequestWithdrawal({
      amount,
      method: withdrawalMethod,
      accountInfo,
      saveAccount: useNewAccount
    }).finally(() => {
      setLoading(false);
    });
  };
  
  return (
    <Modal
      title="申请提现"
      visible={true}
      onCancel={onClose}
      footer={null}
      width={500}
    >
      <Form onSubmit={handleSubmit} layout="vertical">
        <Form.Item label="可提现金额">
          <div className="available-amount">
            {formatCurrency(availableAmount, 'CNY')}
          </div>
        </Form.Item>
        
        <Form.Item label="提现金额">
          <InputNumber
            value={amount}
            onChange={value => setAmount(value)}
            min={10}
            max={availableAmount}
            step={10}
            precision={2}
            style={{ width: '100%' }}
            placeholder="请输入提现金额"
            disabled={loading}
          />
          <div className="amount-hint">
            <span>最低提现金额: ¥10.00</span>
            <Button 
              type="link" 
              size="small" 
              onClick={() => setAmount(availableAmount)}
              disabled={loading}
            >
              全部提现
            </Button>
          </div>
        </Form.Item>
        
        <Form.Item label="提现方式">
          <Select
            value={withdrawalMethod}
            onChange={value => {
              setWithdrawalMethod(value);
              if (useNewAccount) {
                setAccountInfo('');
              } else {
                const account = savedAccounts.find(acc => acc.type === value);
                if (account) {
                  setAccountInfo(account.account);
                } else {
                  setAccountInfo('');
                  setUseNewAccount(true);
                }
              }
            }}
            disabled={loading}
            style={{ width: '100%' }}
          >
            <Select.Option value="alipay">支付宝</Select.Option>
            <Select.Option value="wechat">微信支付</Select.Option>
            <Select.Option value="bank">银行卡</Select.Option>
          </Select>
        </Form.Item>
        
        {savedAccounts.length > 0 && (
          <Form.Item label="选择账户">
            <Radio.Group 
              onChange={e => {
                if (e.target.value === 'new') {
                  setUseNewAccount(true);
                  setAccountInfo('');
                } else {
                  const account = savedAccounts.find(acc => acc.id === e.target.value);
                  if (account) {
                    handleAccountSelect(account);
                  }
                }
              }}
              value={useNewAccount ? 'new' : (
                savedAccounts.find(acc => acc.account === accountInfo)?.id || 'new'
              )}
              disabled={loading}
            >
              {savedAccounts
                .filter(acc => acc.type === withdrawalMethod)
                .map(account => (
                  <Radio key={account.id} value={account.id}>
                    {account.label} ({maskAccount(account.account, account.type)})
                    {account.isDefault && <Tag color="blue">默认</Tag>}
                  </Radio>
                ))
              }
              <Radio value="new">使用新账户</Radio>
            </Radio.Group>
          </Form.Item>
        )}
        
        {(useNewAccount || savedAccounts.length === 0) && (
          <Form.Item 
            label={
              withdrawalMethod === 'alipay' ? '支付宝账号' : 
              withdrawalMethod === 'wechat' ? '微信账号' : '银行卡信息'
            }
          >
            <Input
              value={accountInfo}
              onChange={e => setAccountInfo(e.target.value)}
              placeholder={
                withdrawalMethod === 'alipay' ? '请输入支付宝账号' : 
                withdrawalMethod === 'wechat' ? '请输入微信账号' : 
                '请输入开户行、账号和账户名'
              }
              disabled={loading}
              required
            />
            {useNewAccount && (
              <div className="save-account-option">
                <Checkbox 
                  checked={saveAccountForFuture} 
                  onChange={e => setSaveAccountForFuture(e.target.checked)}
                  disabled={loading}
                >
                  保存账户信息以便将来使用
                </Checkbox>
              </div>
            )}
          </Form.Item>
        )}
        
        <Divider />
        
        <div className="fee-summary">
          <div className="fee-item">
            <span className="fee-label">提现金额:</span>
            <span className="fee-value">{formatCurrency(amount, 'CNY')}</span>
          </div>
          <div className="fee-item">
            <span className="fee-label">手续费:</span>
            <span className="fee-value">{formatCurrency(withdrawFee, 'CNY')}</span>
          </div>
          <div className="fee-item total">
            <span className="fee-label">实际到账:</span>
            <span className="fee-value">{formatCurrency(actualAmount, 'CNY')}</span>
          </div>
        </div>
        
        <Alert
          message="提现说明"
          description={
            <ul className="withdrawal-notes">
              <li>提现申请将在1-3个工作日内处理</li>
              <li>请确保提供的账户信息准确无误</li>
              <li>如有问题，请联系客服</li>
            </ul>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <div className="modal-actions">
          <Button onClick={onClose} disabled={loading}>
            取消
          </Button>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            disabled={!amount || amount <= 0 || amount > availableAmount || !accountInfo}
          >
            确认提现
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

// 账号掩码显示
const maskAccount = (account, type) => {
  if (!account) return '';
  
  if (type === 'bank') {
    // 银行卡号掩码，例如: 6222 **** **** 1234
    if (account.length > 8) {
      return account.slice(0, 4) + ' **** **** ' + account.slice(-4);
    }
    return account;
  } else {
    // 支付宝/微信账号掩码，可能是手机号或邮箱
    if (account.includes('@')) {
      // 邮箱掩码: a***@example.com
      const [user, domain] = account.split('@');
      return user.charAt(0) + '***@' + domain;
    } else if (account.length === 11) {
      // 手机号掩码: 138****1234
      return account.slice(0, 3) + '****' + account.slice(-4);
    }
    return account;
  }
};

export default EnhancedWithdrawalModal;