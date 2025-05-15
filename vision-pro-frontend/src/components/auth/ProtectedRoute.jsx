// src/components/auth/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // 如果认证状态还在加载，显示加载中
  if (loading) {
    return <div className="loading-spinner">加载中...</div>;
  }

  // 如果未认证，重定向到登录页面
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 已认证，显示子组件
  return children;
};

export default ProtectedRoute;