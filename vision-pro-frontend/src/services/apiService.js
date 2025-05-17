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

// 添加请求拦截器以确保每次请求都有最新的 token
api.interceptors.request.use(config => {
  // 每次请求时从 localStorage 获取最新的 token
  const token = localStorage.getItem('token');
  
  if (token) {
    // 确保格式正确: 'Bearer your_token_here'
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    // 如果没有 token，删除 Authorization 头，防止发送无效的认证信息
    delete config.headers.Authorization;
  }
  
  // 添加调试信息
  console.log(`API请求: ${config.method.toUpperCase()} ${config.url}`);
  // console.log('Headers:', config.headers); // 可以取消注释以检查头信息
  
  return config;
}, error => {
  console.error('API请求配置错误:', error);
  return Promise.reject(error);
});

// 添加响应拦截器处理认证错误
api.interceptors.response.use(
  response => response,
  error => {
    // 记录错误详情以便调试
    console.error('API响应错误:', error);
    
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
      
      // 如果返回401或403错误，可能是认证问题
      if (error.response.status === 401) {
        console.log('认证失败：Token可能已过期');
        // 在这里可以触发登出操作或刷新token
        // 例如，可以调用一个全局函数或发布一个事件
        const logoutEvent = new CustomEvent('auth:logout', {
          detail: { reason: 'token_expired' }
        });
        window.dispatchEvent(logoutEvent);
        
        // 如果应用使用本地存储管理认证状态，可以清除
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // 可以选择重定向到登录页面
        // window.location.href = '/login';
      }
      
      if (error.response.status === 403) {
        console.log('权限不足：用户无权执行此操作');
        // 这里可以触发权限不足的事件或通知
      }
    } else if (error.request) {
      console.error('未收到响应:', error.request);
    } else {
      console.error('请求配置错误:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// 创作者相关API端点
export const creatorApi = {
  // 内容管理
  getContents: (params) => api.get('/creator/contents', { params }),
  getContentDetails: (id) => api.get(`/creator/contents/${id}`),
  
  // 修复：确保请求体格式正确
  createContent: (data) => {
    // 记录请求数据以进行调试
    console.log('创建内容请求数据:', JSON.stringify(data, null, 2));
    
    // 确保标题字段存在且格式正确
    const requestData = {
      ...data,
      title: {
        'zh-CN': data.title?.['zh-CN'] || '',
        'en-US': data.title?.['en-US'] || ''
      },
      // 确保其他必要字段也格式正确
      description: data.description || { 'zh-CN': '', 'en-US': '' },
      contentType: data.contentType || '180_video',
      category: data.category || 'entertainment',
      tags: Array.isArray(data.tags) ? data.tags : []
    };
    
    return api.post('/creator/contents', requestData);
  },
  
  updateContent: (id, data) => {
    // 记录请求数据以进行调试
    console.log(`更新内容(ID:${id})请求数据:`, JSON.stringify(data, null, 2));
    
    // 确保请求格式正确
    const requestData = {
      ...data,
      title: {
        'zh-CN': data.title?.['zh-CN'] || '',
        'en-US': data.title?.['en-US'] || ''
      }
    };
    
    return api.put(`/creator/contents/${id}`, requestData);
  },


  getContents: (params) => api.get('/creator/contents', { params }),
  getContentDetails: (id) => api.get(`/creator/contents/${id}`),
  createContent: (data) => api.post('/creator/contents', data),
  updateContent: (id, data) => api.put(`/creator/contents/${id}`, data),
  deleteContent: (id) => api.delete(`/creator/contents/${id}`),
  updateContentStatus: (id, status) => api.put(`/creator/contents/${id}/status`, { status }),
  batchUpdateContent: (contentIds, data) => api.put('/creator/contents/batch/status', { contentIds, ...data }),
  duplicateContent: (id) => api.post(`/creator/contents/${id}/duplicate`),
  exportContents: (data) => api.post('/creator/contents/export', data, { responseType: 'blob' }),
  getCreatorTags: () => api.get('/creator/tags'),
  batchAddTags: (data) => api.post('/creator/contents/batch/tags/add', data),
  batchRemoveTags: (data) => api.post('/creator/contents/batch/tags/remove', data),
  batchReplaceTags: (data) => api.post('/creator/contents/batch/tags/replace', data),
  batchDeleteContents: (data) => api.post('/creator/contents/batch/delete', data),
  
  // 数据分析
  getAnalyticsOverview: () => api.get('/creator/analytics/overview'),
  getContentAnalytics: (id, params) => api.get(`/creator/analytics/contents/${id}`, { params }),
  getAnalyticsTrends: (params) => api.get('/creator/analytics/trends', { params }),
  
  // 收入与货币化
  getIncomeOverview: () => api.get('/creator/income/overview'),
  getIncomeDetails: (params) => api.get('/creator/income/details', { params }),
  requestWithdrawal: (data) => api.post('/creator/income/withdraw', data),
  getWithdrawalHistory: () => api.get('/creator/income/withdrawals'),
  getSavedWithdrawalAccounts: () => api.get('/creator/income/accounts'),
  getTaxInfo: () => api.get('/creator/income/tax-info'),
  exportIncomeData: (data) => api.post('/creator/income/export', data, { responseType: 'blob' }),
  
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
  updateFusionStatus: (id, status) => api.put(`/fusions/${id}/status`, { status }),
  recordFusionView: (id) => api.post(`/fusions/${id}/view`),
  
  // 融合内容分析
  getFusionAnalytics: (id, params) => api.get(`/fusions/${id}/analytics`, { params }),
  
  // 内容相关
  addFusionContent: (fusionId, data) => api.post(`/fusions/${fusionId}/contents`, data),
  removeContentFromFusion: (fusionId, contentId) => api.delete(`/fusions/${fusionId}/contents/${contentId}`),
  updateFusionContent: (fusionId, contentId, data) => api.put(`/fusions/${fusionId}/contents/${contentId}`, data),
  reorderFusionContents: (fusionId, orderData) => api.put(`/fusions/${fusionId}/contents/reorder`, orderData),
};

// 上传相关API端点
export const uploadApi = {
  // 分片上传
  initChunkUpload: (data) => api.post('/upload/chunk/init', data),
  
  // 修复的上传分片方法
  uploadChunk: (formData, onProgress) => {
    // 确保接收的是一个 FormData 实例
    if (!(formData instanceof FormData)) {
      const newFormData = new FormData();
      for (const key in formData) {
        if (key === 'chunk') {
          newFormData.append('chunk', formData[key]);
        } else {
          newFormData.append(key, formData[key].toString());
        }
      }
      formData = newFormData;
    }
    
    return api.post('/upload/chunk/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          if (onProgress) onProgress(percentCompleted);
        } else {
          // 如果无法获取total (例如某些浏览器不支持)，则使用不确定的进度
          if (onProgress) onProgress(50); // 暂时显示50%
        }
      }
    });
  },
  
  completeChunkUpload: (data) => api.post('/upload/chunk/complete', data),
  cancelUpload: (identifier) => api.delete(`/upload/chunk/${identifier}`),
  getUploadProgress: (identifier) => api.get(`/upload/chunk/${identifier}/progress`),
  checkProcessingStatus: (processId) => api.get(`/upload/process/${processId}`),
  
  // 简单上传
  uploadSingle: (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post('/upload/single', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          if (onProgress) onProgress(percentCompleted);
        }
      }
    });
  }
};
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

// 导出默认API实例
export default api;