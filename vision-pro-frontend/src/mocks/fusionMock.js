// src/mocks/fusionMock.js
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

// 创建一个模拟适配器实例
const mockAdapter = new MockAdapter(axios, { delayResponse: 1000 });

// 模拟数据
const fusions = [
  {
    _id: '1',
    title: '欧洲之旅精选',
    description: '精选欧洲旅行体验，带您领略欧洲各国风光',
    category: 'travel',
    creatorId: 'user1',
    coverImage: {
      url: 'https://example.com/images/europe.jpg',
      size: 204800
    },
    contents: [
      {
        contentId: 'content1',
        order: 0,
        settings: {
          autoPlay: true,
          loop: false,
          duration: 120,
          transition: 'fade'
        },
        content: {
          _id: 'content1',
          title: { 'zh-CN': '法国巴黎埃菲尔铁塔', 'en-US': 'Eiffel Tower, Paris' },
          contentType: '360_video',
          files: {
            main: { url: 'https://example.com/videos/paris.mp4', duration: 120 },
            thumbnail: { url: 'https://example.com/thumbnails/paris.jpg' }
          }
        }
      },
      {
        contentId: 'content2',
        order: 1,
        settings: {
          autoPlay: true,
          loop: false,
          duration: 90,
          transition: 'slide'
        },
        content: {
          _id: 'content2',
          title: { 'zh-CN': '意大利罗马斗兽场', 'en-US': 'Colosseum, Rome' },
          contentType: '360_photo',
          files: {
            main: { url: 'https://example.com/images/rome.jpg' },
            thumbnail: { url: 'https://example.com/thumbnails/rome.jpg' }
          }
        }
      }
    ],
    settings: {
      autoPlay: true,
      loop: false,
      shuffle: false,
      transitionDuration: 1000
    },
    status: 'published',
    stats: {
      views: 1205,
      likes: 87,
      comments: 14
    },
    createdAt: '2023-10-15T12:30:45Z',
    updatedAt: '2023-10-20T09:15:30Z'
  },
  {
    _id: '2',
    title: '深海探索',
    description: '探索神秘的海底世界',
    category: 'documentary',
    creatorId: 'user1',
    coverImage: {
      url: 'https://example.com/images/ocean.jpg',
      size: 184500
    },
    contents: [
      {
        contentId: 'content3',
        order: 0,
        settings: {
          autoPlay: true,
          loop: false,
          duration: 180,
          transition: 'fade'
        },
        content: {
          _id: 'content3',
          title: { 'zh-CN': '珊瑚礁生态系统', 'en-US': 'Coral Reef Ecosystem' },
          contentType: '180_video',
          files: {
            main: { url: 'https://example.com/videos/coral.mp4', duration: 180 },
            thumbnail: { url: 'https://example.com/thumbnails/coral.jpg' }
          }
        }
      }
    ],
    settings: {
      autoPlay: true,
      loop: true,
      shuffle: false,
      transitionDuration: 1000
    },
    status: 'draft',
    stats: {
      views: 0,
      likes: 0,
      comments: 0
    },
    createdAt: '2023-11-05T16:45:20Z',
    updatedAt: '2023-11-05T16:45:20Z'
  }
];

// 模拟获取融合内容列表
mockAdapter.onGet('/api/fusions').reply((config) => {
  const { status, category, search, page = 1, limit = 10 } = config.params || {};
  
  let filteredFusions = [...fusions];
  
  // 根据状态筛选
  if (status) {
    filteredFusions = filteredFusions.filter(f => f.status === status);
  }
  
  // 根据分类筛选
  if (category) {
    filteredFusions = filteredFusions.filter(f => f.category === category);
  }
  
  // 根据搜索关键词筛选
  if (search) {
    const searchLower = search.toLowerCase();
    filteredFusions = filteredFusions.filter(f => 
      f.title.toLowerCase().includes(searchLower) || 
      (f.description && f.description.toLowerCase().includes(searchLower))
    );
  }
  
  // 计算分页
  const totalCount = filteredFusions.length;
  const startIndex = (page - 1) * limit;
  const paginatedFusions = filteredFusions.slice(startIndex, startIndex + limit);
  
  return [200, {
    success: true,
    data: {
      fusions: paginatedFusions,
      pagination: {
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
        page: parseInt(page),
        limit: parseInt(limit)
      }
    }
  }];
});

// 模拟获取单个融合内容详情
mockAdapter.onGet(/\/api\/fusions\/\d+/).reply((config) => {
  const id = config.url.split('/').pop();
  const fusion = fusions.find(f => f._id === id);
  
  if (fusion) {
    return [200, {
      success: true,
      data: {
        fusion
      }
    }];
  } else {
    return [404, {
      success: false,
      error: 'not_found',
      message: '未找到融合内容'
    }];
  }
});

// 模拟创建融合内容
mockAdapter.onPost('/api/fusions').reply((config) => {
  const fusionData = JSON.parse(config.data);
  
  const newFusion = {
    _id: `${fusions.length + 1}`,
    ...fusionData,
    creatorId: 'user1', // 假设当前用户ID
    stats: {
      views: 0,
      likes: 0,
      comments: 0
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  fusions.push(newFusion);
  
  return [200, {
    success: true,
    message: '融合内容创建成功',
    data: newFusion
  }];
});

// 模拟更新融合内容
mockAdapter.onPut(/\/api\/fusions\/\d+/).reply((config) => {
  const id = config.url.split('/').pop();
  const fusionIndex = fusions.findIndex(f => f._id === id);
  
  if (fusionIndex !== -1) {
    const fusionData = JSON.parse(config.data);
    
    fusions[fusionIndex] = {
      ...fusions[fusionIndex],
      ...fusionData,
      updatedAt: new Date().toISOString()
    };
    
    return [200, {
      success: true,
      message: '融合内容更新成功',
      data: fusions[fusionIndex]
    }];
  } else {
    return [404, {
      success: false,
      error: 'not_found',
      message: '未找到融合内容'
    }];
  }
});

// 模拟删除融合内容
mockAdapter.onDelete(/\/api\/fusions\/\d+/).reply((config) => {
  const id = config.url.split('/').pop();
  const fusionIndex = fusions.findIndex(f => f._id === id);
  
  if (fusionIndex !== -1) {
    fusions.splice(fusionIndex, 1);
    
    return [200, {
      success: true,
      message: '融合内容已删除'
    }];
  } else {
    return [404, {
      success: false,
      error: 'not_found',
      message: '未找到融合内容'
    }];
  }
});

// 模拟更新融合内容状态
mockAdapter.onPut(/\/api\/fusions\/\d+\/status/).reply((config) => {
  const id = config.url.split('/').pop().replace('/status', '');
  const fusionIndex = fusions.findIndex(f => f._id === id);
  
  if (fusionIndex !== -1) {
    const { status } = JSON.parse(config.data);
    
    fusions[fusionIndex] = {
      ...fusions[fusionIndex],
      status,
      updatedAt: new Date().toISOString()
    };
    
    return [200, {
      success: true,
      message: `融合内容状态已更新为 ${status}`,
      data: fusions[fusionIndex]
    }];
  } else {
    return [404, {
      success: false,
      error: 'not_found',
      message: '未找到融合内容'
    }];
  }
});

// 模拟记录融合内容观看
mockAdapter.onPost(/\/api\/fusions\/\d+\/view/).reply((config) => {
  const id = config.url.split('/').pop().replace('/view', '');
  const fusionIndex = fusions.findIndex(f => f._id === id);
  
  if (fusionIndex !== -1) {
    fusions[fusionIndex].stats.views += 1;
    
    return [200, {
      success: true,
      data: {
        views: fusions[fusionIndex].stats.views
      }
    }];
  } else {
    return [404, {
      success: false,
      error: 'not_found',
      message: '未找到融合内容'
    }];
  }
});

export default mockAdapter;