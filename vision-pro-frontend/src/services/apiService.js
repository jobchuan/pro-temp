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
  // 融合内容管理
  getFusions: (params) => api.get('/fusions', { params }),
  getFusionDetails: (id) => api.get(`/fusions/${id}`),
  createFusion: (data) => api.post('/fusions', data),
  updateFusion: (id, data) => api.put(`/fusions/${id}`, data),
  deleteFusion: (id) => api.delete(`/fusions/${id}`),
  addContentToFusion: (fusionId, contentData) => api.post(`/creator/fusions/${fusionId}/contents`, contentData),
  updateFusionStatus: (id, status) => api.put(`/fusions/${id}/status`, { status }),
  recordFusionView: (id) => api.post(`/fusions/${id}/view`),
  
  // 融合内容分析
  getFusionAnalytics: (id, params) => api.get(`/fusions/${id}/analytics`, { params }),
  
  // 内容相关
  addContentToFusion: (fusionId, data) => api.post(`/fusions/${fusionId}/contents`, data),
  removeContentFromFusion: (fusionId, contentId) => api.delete(`/fusions/${fusionId}/contents/${contentId}`),
  updateFusionContent: (fusionId, contentId, data) => api.put(`/fusions/${fusionId}/contents/${contentId}`, data),
  reorderFusionContents: (fusionId, orderData) => api.put(`/fusions/${fusionId}/contents/reorder`, orderData),

};

// 上传相关API端点
export const uploadApi = {
  // 分片上传
  initChunkUpload: (data) => api.post('/upload/chunk/init', data),
  uploadChunk: (data, onProgress) => {
    const formData = new FormData();
    for (const key in data) {
      formData.append(key, data[key]);
    }
    
    return api.post('/upload/chunk/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        if (onProgress) onProgress(percentCompleted);
      }
    });
  },
  completeChunkUpload: (data) => api.post('/upload/chunk/complete', data),
  cancelUpload: (identifier) => api.delete(`/upload/chunk/${identifier}`),
  getUploadProgress: (identifier) => api.get(`/upload/chunk/${identifier}/progress`),
  
  // 简单上传
  uploadSingle: (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post('/upload/single', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        if (onProgress) onProgress(percentCompleted);
      }
    });
  }
};
// 添加token到请求
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 添加响应拦截器处理认证错误
api.interceptors.response.use(
  response => response,
  error => {
    // 如果返回401错误，清除令牌并跳转到登录页面
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
// services/apiService.js 中修改认证相关API调用

// 登录功能
const login = async (email, password) => {
  try {
    // 修改这里，去掉重复的/api前缀
    const response = await api.post('/users/login', { email, password });
    return response;
  } catch (error) {
    throw error;
  }
};

// 注册功能
const register = async (userData) => {
  try {
    // 修改这里，去掉重复的/api前缀
    const response = await api.post('/users/register', userData);
    return response;
  } catch (error) {
    throw error;
  }
};
// 只导出一次
export default api;