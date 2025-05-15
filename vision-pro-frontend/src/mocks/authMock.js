// src/mocks/authMock.js
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

// 创建一个模拟适配器实例
const mockAdapter = new MockAdapter(axios, { delayResponse: 800 });

// 模拟用户存储
const users = [
  {
    id: 1,
    name: '测试用户',
    email: 'test@example.com',
    password: '123456',
    role: 'creator'
  }
];

// 模拟令牌
const generateToken = (userId) => {
  return `mock_token_${userId}_${Date.now()}`;
};

// 模拟登录
mockAdapter.onPost('/api/users/login').reply((config) => {
  const { email, password } = JSON.parse(config.data);
  
  const user = users.find(u => u.email === email);
  
  if (user && user.password === password) {
    // 登录成功
    const token = generateToken(user.id);
    const userData = { ...user };
    delete userData.password; // 不返回密码
    
    return [200, {
      success: true,
      data: {
        token,
        user: userData
      }
    }];
  }
  
  // 登录失败
  return [401, {
    success: false,
    message: '邮箱或密码不正确'
  }];
});

// 模拟注册
mockAdapter.onPost('/api/users/register').reply((config) => {
  const userData = JSON.parse(config.data);
  
  // 检查用户是否已存在
  if (users.some(u => u.email === userData.email)) {
    return [400, {
      success: false,
      message: '该邮箱已被注册'
    }];
  }
  
  // 创建新用户
  const newUser = {
    id: users.length + 1,
    name: userData.name,
    email: userData.email,
    password: userData.password,
    role: 'creator'
  };
  
  users.push(newUser);
  
  // 返回用户信息和令牌
  const userResponse = { ...newUser };
  delete userResponse.password;
  
  return [200, {
    success: true,
    data: {
      token: generateToken(newUser.id),
      user: userResponse
    }
  }];
});

// 模拟获取当前用户信息
mockAdapter.onGet('/api/users/me').reply((config) => {
  const authHeader = config.headers.Authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return [401, {
      success: false,
      message: '未授权'
    }];
  }
  
  const token = authHeader.split(' ')[1];
  const userId = parseInt(token.split('_')[1]);
  
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return [401, {
      success: false,
      message: '无效的令牌'
    }];
  }
  
  const userData = { ...user };
  delete userData.password;
  
  return [200, {
    success: true,
    data: {
      user: userData
    }
  }];
});

export default mockAdapter;