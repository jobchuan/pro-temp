// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navigation from './components/common/Navigation';
import CreatorDashboard from './pages/CreatorDashboard';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';
import './styles/main.css';
import EnhancedNavigation from './components/common/EnhancedNavigation';
import SidebarNavigation from './components/creator/SidebarNavigation';
import './App.css';

// 简单的首页组件
const Home = () => (
  <div className="home-page">
    <h1>Vision Pro 沉浸式内容平台</h1>
    <p>欢迎使用我们的服务</p>
  </div>
);

// 忘记密码组件（简化版）
const ForgotPassword = () => (
  <div className="auth-container">
    <div className="auth-card">
      <h1>重置密码</h1>
      <p>该功能尚未实现，请联系管理员重置密码。</p>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navigation />
          <main className="main-content">
            <Routes>
              {/* 公共路由 */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              
              {/* 创作者路由 - 使用受保护路由 */}
              <Route 
                path="/creator/*" 
                element={
                  <ProtectedRoute>
                    <CreatorDashboard />
                  </ProtectedRoute>
                }
              />
              
              {/* 重定向未匹配的路由到首页 */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;