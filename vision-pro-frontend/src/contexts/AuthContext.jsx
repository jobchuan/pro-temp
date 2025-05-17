// 增强版 AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/apiService';

// 创建认证上下文
const AuthContext = createContext(null);

// 令牌过期时间 (毫秒)
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24小时

// 认证提供者组件
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tokenExpiry, setTokenExpiry] = useState(null);

  // 从本地存储中恢复用户会话
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        const expiry = localStorage.getItem('tokenExpiry');
        
        if (token && userData) {
          try {
            // 解析用户数据
            const user = JSON.parse(userData);
            setCurrentUser(user);
            
            // 设置令牌过期时间
            if (expiry) {
              setTokenExpiry(parseInt(expiry));
            } else {
              // 如果没有过期时间，设置默认值（当前时间 + 24小时）
              const newExpiry = Date.now() + TOKEN_EXPIRY;
              setTokenExpiry(newExpiry);
              localStorage.setItem('tokenExpiry', newExpiry.toString());
            }
            
            // 验证令牌有效性
            await validateToken();
          } catch (e) {
            console.error('恢复用户会话失败:', e);
            clearAuthData();
          }
        }
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
    
    // 监听自定义登出事件
    const handleLogoutEvent = (event) => {
      console.log('收到登出事件:', event.detail);
      logout();
    };
    
    window.addEventListener('auth:logout', handleLogoutEvent);
    
    return () => {
      window.removeEventListener('auth:logout', handleLogoutEvent);
    };
  }, []);
  
  // 定期检查令牌是否即将过期
  useEffect(() => {
    if (!tokenExpiry) return;
    
    const checkTokenExpiry = () => {
      const now = Date.now();
      // 如果令牌过期时间少于30分钟，尝试刷新
      if (tokenExpiry - now < 30 * 60 * 1000) {
        console.log('令牌即将过期，尝试刷新');
        refreshToken();
      }
    };
    
    // 每10分钟检查一次
    const interval = setInterval(checkTokenExpiry, 10 * 60 * 1000);
    
    // 初始检查
    checkTokenExpiry();
    
    return () => clearInterval(interval);
  }, [tokenExpiry]);
  
  // 验证令牌是否有效
  const validateToken = async () => {
    try {
      const response = await api.get('/users/me');
      if (response.data.success) {
        // 令牌有效，可以更新用户信息
        const userData = response.data.data.user;
        setCurrentUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return true;
      }
      return false;
    } catch (error) {
      console.error('令牌验证失败:', error);
      if (error.response && error.response.status === 401) {
        clearAuthData();
      }
      return false;
    }
  };
  
  // 清除认证数据
  const clearAuthData = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenExpiry');
    setCurrentUser(null);
    setTokenExpiry(null);
  };
  
  // 刷新令牌
  const refreshToken = async () => {
    try {
      const response = await api.post('/users/refresh-token');
      if (response.data.success) {
        const { token, expiresIn } = response.data.data;
        
        // 保存新令牌
        localStorage.setItem('token', token);
        
        // 计算并保存新的过期时间
        const newExpiry = Date.now() + (expiresIn * 1000);
        localStorage.setItem('tokenExpiry', newExpiry.toString());
        setTokenExpiry(newExpiry);
        
        console.log('令牌刷新成功');
        return true;
      }
      return false;
    } catch (error) {
      console.error('令牌刷新失败:', error);
      // 如果刷新失败，保留当前认证状态，用户下次操作时会要求重新登录
      return false;
    }
  };

  // 登录功能
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/users/login', { email, password });
      
      if (response.data.success) {
        const { token, user, expiresIn } = response.data.data;
        
        // 保存token和用户信息
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // 计算并保存令牌过期时间
        const expiry = Date.now() + (expiresIn ? expiresIn * 1000 : TOKEN_EXPIRY);
        localStorage.setItem('tokenExpiry', expiry.toString());
        
        // 更新状态
        setCurrentUser(user);
        setTokenExpiry(expiry);
        console.log('登录成功，令牌过期时间:', new Date(expiry).toLocaleString());
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
        const { token, user, expiresIn } = response.data.data;
        
        // 保存token和用户信息
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // 计算并保存令牌过期时间
        const expiry = Date.now() + (expiresIn ? expiresIn * 1000 : TOKEN_EXPIRY);
        localStorage.setItem('tokenExpiry', expiry.toString());
        
        // 更新状态
        setCurrentUser(user);
        setTokenExpiry(expiry);
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
    clearAuthData();
    console.log('用户已登出');
  };

  // 检查是否已登录
  const isAuthenticated = () => {
    return !!currentUser;
  };

  // 检查当前用户是否具有特定角色
  const hasRole = (role) => {
    return currentUser && currentUser.role === role;
  };

  // 上下文值
  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated,
    hasRole,
    refreshToken,
    validateToken
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