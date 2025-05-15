// services/apiService.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// 创建axios实例并配置认证拦截器
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 添加token到请求
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 创作者相关API端点
export const creatorApi = {
  // 内容管理
  getContents: (params) => api.get('/creator/contents', { params }),
  getContentDetails: (id) => api.get(`/creator/contents/${id}`),
  createContent: (data) => api.post('/creator/contents', data),
  updateContent: (id, data) => api.put(`/creator/contents/${id}`, data),
  deleteContent: (id) => api.delete(`/creator/contents/${id}`),
  updateContentStatus: (id, status) => api.put(`/creator/contents/${id}/status`, { status }),
  batchUpdateContent: (contentIds, data) => api.put('/creator/contents/batch/status', { contentIds, ...data }),
  
  // 数据分析
  getAnalyticsOverview: () => api.get('/creator/analytics/overview'),
  getContentAnalytics: (id, params) => api.get(`/creator/analytics/contents/${id}`, { params }),
  getAnalyticsTrends: (params) => api.get('/creator/analytics/trends', { params }),
  
  // 收入与货币化
  getIncomeOverview: () => api.get('/creator/income/overview'),
  getIncomeDetails: (params) => api.get('/creator/income/details', { params }),
  requestWithdrawal: (data) => api.post('/creator/income/withdraw', data),
  
  // 评论和互动
  getContentComments: (id, params) => api.get(`/creator/contents/${id}/comments`, { params }),
  replyToComment: (id, text) => api.post(`/creator/comments/${id}/reply`, { text }),
  pinComment: (id, isPinned) => api.put(`/creator/comments/${id}/pin`, { isPinned }),
  
  // 个人资料和设置
  getCreatorProfile: () => api.get('/creator/profile'),
  updateCreatorProfile: (data) => api.put('/creator/profile', data),
  updatePaymentInfo: (data) => api.put('/creator/payment-info', data),
};

export default api;