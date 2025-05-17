// src/components/common/EnhancedNavigation.jsx
import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import UserMenu from './UserMenu'; // 导入新的UserMenu组件

const EnhancedNavigation = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
              <li className="user-menu-list-item">
                {/* 使用新的UserMenu组件替换原有下拉菜单 */}
                <UserMenu />
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