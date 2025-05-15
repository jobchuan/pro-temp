// src/components/common/Navigation.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Navigation = () => {
  const { currentUser, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="main-navigation">
      <div className="nav-logo">
        <h1>Vision Pro 平台</h1>
      </div>
      <ul className="nav-links">
        <li><Link to="/">首页</Link></li>
        
        {isAuthenticated() ? (
          // 已登录用户看到的导航
          <>
            <li><Link to="/creator/dashboard">创作者中心</Link></li>
            <li><Link to="/creator/analytics">数据分析</Link></li>
            <li><Link to="/creator/contents">内容管理</Link></li>
            <li><Link to="/creator/income">收入管理</Link></li>
            <li>
              <div className="user-menu">
                <span className="user-name">{currentUser.name}</span>
                <div className="user-dropdown">
                  <Link to="/creator/settings">个人设置</Link>
                  <button onClick={handleLogout}>退出登录</button>
                </div>
              </div>
            </li>
          </>
        ) : (
          // 未登录用户看到的导航
          <>
            <li><Link to="/login">登录</Link></li>
            <li><Link to="/register">注册</Link></li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navigation;