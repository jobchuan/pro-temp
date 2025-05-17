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
        <Link to="/">
          <h1>Vision Pro 平台</h1>
        </Link>
      </div>
      <ul className="nav-links">
        <li><Link to="/">首页</Link></li>
        <li><Link to="/explore">探索</Link></li>
        
        {isAuthenticated() ? (
          // 已登录用户看到的导航
          <>
            {/* 简化为只有一个创作者中心的入口 */}
            <li><Link to="/creator/dashboard">创作者中心</Link></li>
            <li>
              <div className="user-menu">
                <span className="user-name">{currentUser.name}</span>
                <div className="user-dropdown">
                  <Link to="/profile">个人主页</Link>
                  <Link to="/settings">账号设置</Link>
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