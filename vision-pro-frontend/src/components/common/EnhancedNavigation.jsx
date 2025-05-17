// src/components/common/EnhancedNavigation.jsx
import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const EnhancedNavigation = () => {
  const { currentUser, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="main-navigation">
      <div className="nav-container">
        <div className="nav-logo">
          <Link to="/">
            <div className="logo-container">
              <span className="logo-icon">🥽</span>
              <h1>Vision Pro <span className="highlight">平台</span></h1>
            </div>
          </Link>
        </div>

        <button 
          className="mobile-menu-toggle" 
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <ul className={`nav-links ${isMobileMenuOpen ? 'active' : ''}`}>
          <li>
            <NavLink to="/" className={({isActive}) => isActive ? 'active' : ''}>
              <span className="nav-icon">🏠</span>
              首页
            </NavLink>
          </li>
          <li>
            <NavLink to="/explore" className={({isActive}) => isActive ? 'active' : ''}>
              <span className="nav-icon">🔍</span>
              探索
            </NavLink>
          </li>
          
          {isAuthenticated() ? (
            // 已登录用户看到的导航
            <>
              <li>
                <NavLink to="/creator/dashboard" className={({isActive}) => isActive ? 'active' : ''}>
                  <span className="nav-icon">🎬</span>
                  创作者中心
                </NavLink>
              </li>
              <li className="user-menu">
                <div className="user-avatar-container">
                  <img 
                    src={currentUser.avatar || "/default-avatar.png"} 
                    alt={currentUser.name} 
                    className="user-avatar" 
                  />
                  <span className="user-name">{currentUser.name}</span>
                  <span className="dropdown-icon">▼</span>
                </div>
                <div className="user-dropdown">
                  <Link to="/profile" className="dropdown-item">
                    <span className="dropdown-icon">👤</span>
                    个人主页
                  </Link>
                  <Link to="/settings" className="dropdown-item">
                    <span className="dropdown-icon">⚙️</span>
                    账号设置
                  </Link>
                  <button onClick={handleLogout} className="dropdown-item logout-button">
                    <span className="dropdown-icon">🚪</span>
                    退出登录
                  </button>
                </div>
              </li>
            </>
          ) : (
            // 未登录用户看到的导航
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-outline btn-sm login-button">登录</Link>
              <Link to="/register" className="btn btn-primary btn-sm register-button">注册</Link>
            </div>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default EnhancedNavigation;