// src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/apiService';

// 创建认证上下文
const AuthContext = createContext(null);

// 认证提供者组件
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 从本地存储中恢复用户会话
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setCurrentUser(JSON.parse(userData));
      } catch (e) {
        console.error('恢复用户会话失败:', e);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    
    setLoading(false);
  }, []);

  // 登录功能
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/users/login', { email, password });
      
      if (response.data.success) {
        const { token, user } = response.data.data;
        
        // 保存token和用户信息
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // 更新状态
        setCurrentUser(user);
        return true;
      } else {
        setError(response.data.message || '登录失败');
        return false;
      }
    } catch (error) {
      console.error('登录失败:', error);
      setError(error.response?.data?.message || '登录失败，请检查网络连接');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 注册功能
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/users/register', userData);
      
      if (response.data.success) {
        const { token, user } = response.data.data;
        
        // 保存token和用户信息
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // 更新状态
        setCurrentUser(user);
        return true;
      } else {
        setError(response.data.message || '注册失败');
        return false;
      }
    } catch (error) {
      console.error('注册失败:', error);
      setError(error.response?.data?.message || '注册失败，请检查输入信息');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 登出功能
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
  };

  // 检查是否已登录
  const isAuthenticated = () => {
    return !!currentUser;
  };

  // 上下文值
  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 使用认证的钩子
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth 必须在 AuthProvider 内部使用');
  }
  return context;
};