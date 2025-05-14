
// scripts/testApi.js
require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';
let token = null;

async function testApi() {
    console.log('开始API测试...');
    
    try {
        // 测试健康检查
        await testHealthCheck();
        
        // 测试用户登录
        await testLogin();
        
        // 测试获取用户信息
        await testGetUserInfo();
        
        // 测试获取内容列表
        await testGetContents();
        
        // 测试创建内容
        const contentId = await testCreateContent();
        
        // 测试获取内容详情
        await testGetContentDetails(contentId);
        
        // 测试交互功能
        await testInteractions(contentId);
        
        console.log('\n所有测试完成，API运行正常 ✅');
    } catch (error) {
        console.error('\n测试失败 ❌:', error.message);
        if (error.response) {
            console.error('响应状态:', error.response.status);
            console.error('响应数据:', error.response.data);
        }
    }
}

async function testHealthCheck() {
    console.log('\n1. 测试健康检查接口...');
    const response = await axios.get(`${API_BASE_URL}/health`);
    console.log('健康检查成功:', response.data.status === 'ok' ? '✅' : '❌');
    return response.data;
}

async function testLogin() {
    console.log('\n2. 测试用户登录接口...');
    const response = await axios.post(`${API_BASE_URL}/users/login`, {
        email: '138991386@qq.com',
        password: 'fly9998'
    });
    
    if (response.data.success && response.data.data.token) {
        token = response.data.data.token;
        console.log('登录成功，获取到token ✅');
    } else {
        throw new Error('登录失败，未获取到token');
    }
    
    return response.data;
}

async function testGetUserInfo() {
    console.log('\n3. 测试获取用户信息接口...');
    const response = await axios.get(`${API_BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success && response.data.data.user) {
        console.log('获取用户信息成功 ✅');
        console.log(`用户名: ${response.data.data.user.username}`);
        console.log(`邮箱: ${response.data.data.user.email}`);
        console.log(`角色: ${response.data.data.user.role}`);
    } else {
        throw new Error('获取用户信息失败');
    }
    
    return response.data;
}

async function testGetContents() {
    console.log('\n4. 测试获取内容列表接口...');
    const response = await axios.get(`${API_BASE_URL}/contents`);
    
    if (response.data.success && Array.isArray(response.data.data)) {
        console.log('获取内容列表成功 ✅');
        console.log(`总计 ${response.data.data.length} 个内容`);
    } else {
        throw new Error('获取内容列表失败');
    }
    
    return response.data;
}

async function testCreateContent() {
    console.log('\n5. 测试创建内容接口...');
    
    const content = {
        title: {
            'zh-CN': '测试内容 - ' + new Date().toISOString(),
            'en-US': 'Test Content - ' + new Date().toISOString()
        },
        description: {
            'zh-CN': '这是一个测试内容',
            'en-US': 'This is a test content'
        },
        contentType: '180_video',
        files: {
            main: {
                url: 'https://example.com/test-video.mp4',
                size: 1024000,
                duration: 120
            },
            thumbnail: {
                url: 'https://example.com/test-thumbnail.jpg',
                size: 10240
            }
        },
        tags: ['测试', 'API'],
        category: 'entertainment',
        pricing: {
            isFree: true
        }
    };
    
    const response = await axios.post(`${API_BASE_URL}/contents`, content, {
        headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success && response.data.data) {
        console.log('创建内容成功 ✅');
        console.log(`内容ID: ${response.data.data._id}`);
        return response.data.data._id;
    } else {
        throw new Error('创建内容失败');
    }
}

async function testGetContentDetails(contentId) {
    console.log('\n6. 测试获取内容详情接口...');
    
    if (!contentId) {
        console.warn('跳过内容详情测试，未提供内容ID');
        return null;
    }
    
    const response = await axios.get(`${API_BASE_URL}/contents/${contentId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success && response.data.data) {
        console.log('获取内容详情成功 ✅');
        console.log(`标题: ${response.data.data.title['zh-CN']}`);
    } else {
        throw new Error('获取内容详情失败');
    }
    
    return response.data;
}

async function testInteractions(contentId) {
    console.log('\n7. 测试交互功能...');
    
    if (!contentId) {
        console.warn('跳过交互测试，未提供内容ID');
        return null;
    }
    
    // 测试点赞
    console.log('测试点赞...');
    const likeResponse = await axios.post(`${API_BASE_URL}/interactions/content/${contentId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('点赞结果:', likeResponse.data.success ? '✅' : '❌');
    
    // 测试收藏
    console.log('测试收藏...');
    const favoriteResponse = await axios.post(`${API_BASE_URL}/interactions/content/${contentId}/favorite`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('收藏结果:', favoriteResponse.data.success ? '✅' : '❌');
    
    // 测试评论
    console.log('测试发表评论...');
    const commentResponse = await axios.post(`${API_BASE_URL}/interactions/content/${contentId}/comments`, 
        { text: '这是一条测试评论 - ' + new Date().toISOString() },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('评论结果:', commentResponse.data.success ? '✅' : '❌');
    
    // 测试获取评论
    console.log('测试获取评论...');
    const getCommentsResponse = await axios.get(`${API_BASE_URL}/interactions/content/${contentId}/comments`);
    
    console.log('获取评论结果:', getCommentsResponse.data.success ? '✅' : '❌');
    if (getCommentsResponse.data.success) {
        console.log(`评论数量: ${getCommentsResponse.data.data.comments.length}`);
    }
    
    return {
        like: likeResponse.data,
        favorite: favoriteResponse.data,
        comment: commentResponse.data,
        getComments: getCommentsResponse.data
    };
}

// 执行测试
testApi();