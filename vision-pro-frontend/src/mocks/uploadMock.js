// src/mocks/uploadMock.js
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

// 创建一个模拟适配器实例
const mockAdapter = new MockAdapter(axios, { delayResponse: 1000 });

// 模拟存储上传状态
const uploadStore = {};

// 模拟初始化上传
mockAdapter.onPost('/api/upload/chunk/init').reply((config) => {
  const data = JSON.parse(config.data);
  const { identifier } = data;
  
  // 初始化上传状态
  uploadStore[identifier] = {
    uploadedChunks: [],
    totalChunks: data.totalChunks,
    filename: data.filename
  };
  
  return [200, {
    success: true,
    data: {
      identifier,
      resumable: true
    }
  }];
});

// 模拟上传分片
mockAdapter.onPost('/api/upload/chunk/upload').reply((config) => {
  // FormData在mock中不能直接解析，这里简化处理
  const identifier = config.data.get ? config.data.get('identifier') : 'mock-id';
  const chunkNumber = config.data.get ? parseInt(config.data.get('chunkNumber')) : 0;
  
  if (uploadStore[identifier]) {
    if (!uploadStore[identifier].uploadedChunks.includes(chunkNumber)) {
      uploadStore[identifier].uploadedChunks.push(chunkNumber);
    }
    
    return [200, {
      success: true,
      data: {
        chunkNumber,
        received: true
      }
    }];
  }
  
  return [400, { success: false, message: '上传ID无效' }];
});

// 模拟完成上传
mockAdapter.onPost('/api/upload/chunk/complete').reply((config) => {
  const data = JSON.parse(config.data);
  const { identifier } = data;
  
  if (uploadStore[identifier]) {
    // 检查是否所有分片都已上传
    const { uploadedChunks, totalChunks } = uploadStore[identifier];
    
    if (uploadedChunks.length === totalChunks) {
      // 生成一个模拟的文件URL
      const fileUrl = `https://example.com/uploaded/${identifier}/${data.filename}`;
      
      // 清理存储
      delete uploadStore[identifier];
      
      return [200, {
        success: true,
        data: {
          url: fileUrl,
          filename: data.filename
        }
      }];
    } else {
      return [400, {
        success: false,
        message: '部分分片未上传完成'
      }];
    }
  }
  
  return [400, { success: false, message: '上传ID无效' }];
});

// 模拟获取上传进度
mockAdapter.onGet(new RegExp('/api/upload/chunk/.*/progress')).reply((config) => {
  const identifier = config.url.split('/').pop().replace('/progress', '');
  
  if (uploadStore[identifier]) {
    return [200, {
      success: true,
      data: {
        uploadedChunks: uploadStore[identifier].uploadedChunks,
        totalChunks: uploadStore[identifier].totalChunks
      }
    }];
  }
  
  return [404, { success: false, message: '未找到上传记录' }];
});

// 模拟取消上传
mockAdapter.onDelete(new RegExp('/api/upload/chunk/.*')).reply((config) => {
  const identifier = config.url.split('/').pop();
  
  if (uploadStore[identifier]) {
    delete uploadStore[identifier];
    return [200, { success: true }];
  }
  
  return [404, { success: false, message: '未找到上传记录' }];
});

export default mockAdapter;