// components/creator/CreatorSettings.jsx
import React, { useState, useEffect } from 'react';
import { creatorApi } from '../../services/apiService';

const CreatorSettings = () => {
  const [profile, setProfile] = useState({
    name: '',
    bio: { 'zh-CN': '', 'en-US': '' },
    socialLinks: {
      website: '',
      youtube: '',
      instagram: '',
      twitter: ''
    },
    displayLanguages: ['zh-CN']
  });
  
  const [paymentInfo, setPaymentInfo] = useState({
    preferredMethod: 'alipay',
    accounts: {
      alipay: '',
      wechat: '',
      bank: {
        name: '',
        accountNumber: '',
        accountName: ''
      }
    },
    taxInfo: {
      taxId: '',
      address: '',
      companyName: ''
    }
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    email: {
      newComment: true,
      newPurchase: true,
      platformUpdates: true
    },
    inApp: {
      newComment: true,
      newPurchase: true,
      platformUpdates: true
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [saveStatus, setSaveStatus] = useState({ status: '', message: '' });
  
  useEffect(() => {
    fetchCreatorSettings();
  }, []);
  
  const fetchCreatorSettings = async () => {
    setLoading(true);
    try {
      const profileResponse = await creatorApi.getCreatorProfile();
      setProfile(profileResponse.data.data.profile);
      
      if (profileResponse.data.data.paymentInfo) {
        setPaymentInfo(profileResponse.data.data.paymentInfo);
      }
      
      if (profileResponse.data.data.notificationSettings) {
        setNotificationSettings(profileResponse.data.data.notificationSettings);
      }
    } catch (error) {
      console.error('获取创作者设置失败:', error);
      setSaveStatus({
        status: 'error',
        message: '加载创作者设置失败，请重试'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setProfile({
        ...profile,
        [parent]: {
          ...profile[parent],
          [child]: value
        }
      });
    } else {
      setProfile({
        ...profile,
        [name]: value
      });
    }
  };
  
  const handleSocialLinkChange = (e) => {
    const { name, value } = e.target;
    setProfile({
      ...profile,
      socialLinks: {
        ...profile.socialLinks,
        [name]: value
      }
    });
  };
  
  const handleLanguageToggle = (language) => {
    const currentLanguages = [...profile.displayLanguages];
    
    if (currentLanguages.includes(language)) {
      // 只有当至少有一种语言被选中时，才允许移除
      if (currentLanguages.length > 1) {
        setProfile({
          ...profile,
          displayLanguages: currentLanguages.filter(lang => lang !== language)
        });
      }
    } else {
      setProfile({
        ...profile,
        displayLanguages: [...currentLanguages, language]
      });
    }
  };
  
  const handlePaymentInfoChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      
      if (parent === 'bank') {
        setPaymentInfo({
          ...paymentInfo,
          accounts: {
            ...paymentInfo.accounts,
            bank: {
              ...paymentInfo.accounts.bank,
              [child]: value
            }
          }
        });
      } else if (parent === 'taxInfo') {
        setPaymentInfo({
          ...paymentInfo,
          taxInfo: {
            ...paymentInfo.taxInfo,
            [child]: value
          }
        });
      } else {
        setPaymentInfo({
          ...paymentInfo,
          accounts: {
            ...paymentInfo.accounts,
            [parent]: value
          }
        });
      }
    } else if (name === 'preferredMethod') {
      setPaymentInfo({
        ...paymentInfo,
        preferredMethod: value
      });
    } else {
      setPaymentInfo({
        ...paymentInfo,
        accounts: {
          ...paymentInfo.accounts,
          [name]: value
        }
      });
    }
  };
  
  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    const [type, setting] = name.split('.');
    
    setNotificationSettings({
      ...notificationSettings,
      [type]: {
        ...notificationSettings[type],
        [setting]: checked
      }
    });
  };
  
  const saveProfile = async () => {
    setSaveStatus({ status: 'saving', message: '保存中...' });
    try {
      await creatorApi.updateCreatorProfile(profile);
      setSaveStatus({ status: 'success', message: '个人资料已更新' });
    } catch (error) {
      console.error('更新个人资料失败:', error);
      setSaveStatus({ status: 'error', message: '更新个人资料失败，请重试' });
    }
  };
  
  const savePaymentInfo = async () => {
    setSaveStatus({ status: 'saving', message: '保存中...' });
    try {
      await creatorApi.updatePaymentInfo(paymentInfo);
      setSaveStatus({ status: 'success', message: '支付信息已更新' });
    } catch (error) {
      console.error('更新支付信息失败:', error);
      setSaveStatus({ status: 'error', message: '更新支付信息失败，请重试' });
    }
  };
  
  const saveNotificationSettings = async () => {
    setSaveStatus({ status: 'saving', message: '保存中...' });
    try {
      // 假设有一个API端点来更新通知设置
      await creatorApi.updateNotificationSettings(notificationSettings);
      setSaveStatus({ status: 'success', message: '通知设置已更新' });
    } catch (error) {
      console.error('更新通知设置失败:', error);
      setSaveStatus({ status: 'error', message: '更新通知设置失败，请重试' });
    }
  };
  
  if (loading) {
    return <div className="loading-spinner">加载设置中...</div>;
  }
  
  return (
    <div className="creator-settings">
      <h1>创作者设置</h1>
      
      <div className="settings-tabs">
        <button 
          className={activeTab === 'profile' ? 'active' : ''}
          onClick={() => setActiveTab('profile')}
        >
          个人资料
        </button>
        <button 
          className={activeTab === 'payment' ? 'active' : ''}
          onClick={() => setActiveTab('payment')}
        >
          支付信息
        </button>
        <button 
          className={activeTab === 'notifications' ? 'active' : ''}
          onClick={() => setActiveTab('notifications')}
        >
          通知设置
        </button>
      </div>
      
      {saveStatus.message && (
        <div className={`save-status ${saveStatus.status}`}>
          {saveStatus.message}
        </div>
      )}
      
      {activeTab === 'profile' && (
        <div className="settings-section">
          <h2>个人资料</h2>
          
          <div className="form-group">
            <label htmlFor="name">创作者名称</label>
            <input
              type="text"
              id="name"
              name="name"
              value={profile.name}
              onChange={handleProfileChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="bio.zh-CN">个人简介 (中文)</label>
            <textarea
              id="bio.zh-CN"
              name="bio.zh-CN"
              value={profile.bio['zh-CN']}
              onChange={handleProfileChange}
              rows="4"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="bio.en-US">个人简介 (英文)</label>
            <textarea
              id="bio.en-US"
              name="bio.en-US"
              value={profile.bio['en-US']}
              onChange={handleProfileChange}
              rows="4"
            />
          </div>
          
          <h3>社交媒体链接</h3>
          
          <div className="form-group">
            <label htmlFor="website">网站</label>
            <input
              type="url"
              id="website"
              name="website"
              value={profile.socialLinks.website}
              onChange={handleSocialLinkChange}
              placeholder="https://"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="youtube">YouTube</label>
            <input
              type="url"
              id="youtube"
              name="youtube"
              value={profile.socialLinks.youtube}
              onChange={handleSocialLinkChange}
              placeholder="https://youtube.com/c/"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="instagram">Instagram</label>
            <input
              type="url"
              id="instagram"
              name="instagram"
              value={profile.socialLinks.instagram}
              onChange={handleSocialLinkChange}
              placeholder="https://instagram.com/"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="twitter">Twitter</label>
            <input
              type="url"
              id="twitter"
              name="twitter"
              value={profile.socialLinks.twitter}
              onChange={handleSocialLinkChange}
              placeholder="https://twitter.com/"
            />
          </div>
          
          <h3>显示语言</h3>
          <div className="language-toggles">
            <label className="language-toggle">
              <input
                type="checkbox"
                checked={profile.displayLanguages.includes('zh-CN')}
                onChange={() => handleLanguageToggle('zh-CN')}
              />
              中文 (简体)
            </label>
            
            <label className="language-toggle">
              <input
                type="checkbox"
                checked={profile.displayLanguages.includes('en-US')}
                onChange={() => handleLanguageToggle('en-US')}
              />
              英文
            </label>
          </div>
          
          <div className="form-actions">
            <button 
              className="primary-button"
              onClick={saveProfile}
              disabled={saveStatus.status === 'saving'}
            >
              {saveStatus.status === 'saving' ? '保存中...' : '保存个人资料'}
            </button>
          </div>
        </div>
      )}
      
      {activeTab === 'payment' && (
        <div className="settings-section">
          <h2>支付信息</h2>
          
          <div className="form-group">
            <label htmlFor="preferredMethod">首选支付方式</label>
            <select
              id="preferredMethod"
              name="preferredMethod"
              value={paymentInfo.preferredMethod}
              onChange={handlePaymentInfoChange}
            >
              <option value="alipay">支付宝</option>
              <option value="wechat">微信支付</option>
              <option value="bank">银行卡</option>
            </select>
          </div>
          
          <div className="payment-accounts">
            <div className="form-group">
              <label htmlFor="alipay">支付宝账号</label>
              <input
                type="text"
                id="alipay"
                name="alipay"
                value={paymentInfo.accounts.alipay}
                onChange={handlePaymentInfoChange}
                placeholder="支付宝账号/手机号"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="wechat">微信账号</label>
              <input
                type="text"
                id="wechat"
                name="wechat"
                value={paymentInfo.accounts.wechat}
                onChange={handlePaymentInfoChange}
                placeholder="微信账号/手机号"
              />
            </div>
            
            <div className="bank-account-group">
              <h3>银行卡信息</h3>
              
              <div className="form-group">
                <label htmlFor="bank.name">开户银行</label>
                <input
                  type="text"
                  id="bank.name"
                  name="bank.name"
                  value={paymentInfo.accounts.bank.name}
                  onChange={handlePaymentInfoChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="bank.accountNumber">银行卡号</label>
                <input
                  type="text"
                  id="bank.accountNumber"
                  name="bank.accountNumber"
                  value={paymentInfo.accounts.bank.accountNumber}
                  onChange={handlePaymentInfoChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="bank.accountName">开户名</label>
                <input
                  type="text"
                  id="bank.accountName"
                  name="bank.accountName"
                  value={paymentInfo.accounts.bank.accountName}
                  onChange={handlePaymentInfoChange}
                />
              </div>
            </div>
          </div>
          
          <h3>税务信息</h3>
          <div className="tax-info">
            <div className="form-group">
              <label htmlFor="taxInfo.taxId">税号</label>
              <input
                type="text"
                id="taxInfo.taxId"
                name="taxInfo.taxId"
                value={paymentInfo.taxInfo.taxId}
                onChange={handlePaymentInfoChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="taxInfo.companyName">公司名称 (如适用)</label>
              <input
                type="text"
                id="taxInfo.companyName"
                name="taxInfo.companyName"
                value={paymentInfo.taxInfo.companyName}
                onChange={handlePaymentInfoChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="taxInfo.address">地址</label>
              <textarea
                id="taxInfo.address"
                name="taxInfo.address"
                value={paymentInfo.taxInfo.address}
                onChange={handlePaymentInfoChange}
                rows="3"
              />
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              className="primary-button"
              onClick={savePaymentInfo}
              disabled={saveStatus.status === 'saving'}
            >
              {saveStatus.status === 'saving' ? '保存中...' : '保存支付信息'}
            </button>
          </div>
        </div>
      )}
      
      {activeTab === 'notifications' && (
        <div className="settings-section">
          <h2>通知设置</h2>
          
          <div className="notification-settings">
            <h3>电子邮件通知</h3>
            
            <div className="notification-option">
              <label>
                <input
                  type="checkbox"
                  name="email.newComment"
                  checked={notificationSettings.email.newComment}
                  onChange={handleNotificationChange}
                />
                有新评论时通知我
              </label>
            </div>
            
            <div className="notification-option">
              <label>
                <input
                  type="checkbox"
                  name="email.newPurchase"
                  checked={notificationSettings.email.newPurchase}
                  onChange={handleNotificationChange}
                />
                有新购买时通知我
              </label>
            </div>
            
            <div className="notification-option">
              <label>
                <input
                  type="checkbox"
                  name="email.platformUpdates"
                  checked={notificationSettings.email.platformUpdates}
                  onChange={handleNotificationChange}
                />
                平台更新和公告
              </label>
            </div>
            
            <h3>应用内通知</h3>
            
            <div className="notification-option">
              <label>
                <input
                  type="checkbox"
                  name="inApp.newComment"
                  checked={notificationSettings.inApp.newComment}
                  onChange={handleNotificationChange}
                />
                有新评论时通知我
              </label>
            </div>
            
            <div className="notification-option">
              <label>
                <input
                  type="checkbox"
                  name="inApp.newPurchase"
                  checked={notificationSettings.inApp.newPurchase}
                  onChange={handleNotificationChange}
                />
                有新购买时通知我
              </label>
            </div>
            
            <div className="notification-option">
              <label>
                <input
                  type="checkbox"
                  name="inApp.platformUpdates"
                  checked={notificationSettings.inApp.platformUpdates}
                  onChange={handleNotificationChange}
                />
                平台更新和公告
              </label>
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              className="primary-button"
              onClick={saveNotificationSettings}
              disabled={saveStatus.status === 'saving'}
            >
              {saveStatus.status === 'saving' ? '保存中...' : '保存通知设置'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatorSettings;