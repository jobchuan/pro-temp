// src/components/common/UserMenu.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * 用户菜单组件 - 完全重构的版本
 */
const UserMenu = () => {
  const { currentUser, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  
  // 处理菜单外点击关闭
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    // 添加全局点击事件监听
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuRef]);
  
  // 导航处理函数
  const handleNavigation = (path) => {
    navigate(path);
    setIsOpen(false);
  };
  
  // 退出登录处理
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  return (
    <div className="user-menu-container" ref={menuRef}>
      {/* 用户头像和姓名 - 点击切换菜单状态 */}
      <div 
        className="user-avatar-wrapper" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <img 
          src={currentUser?.avatar || "/default-avatar.png"} 
          alt="用户头像" 
          className="avatar-image"
        />
        <span className="username">{currentUser?.name || "用户"}</span>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </div>
      
      {/* 下拉菜单 */}
      {isOpen && (
        <div className="dropdown-menu">
          <button 
            onClick={() => handleNavigation('/profile')}
            className="menu-item"
          >
            <span className="menu-icon">👤</span>
            <span className="menu-text">个人主页</span>
          </button>
          
          <button 
            onClick={() => handleNavigation('/settings')}
            className="menu-item"
          >
            <span className="menu-icon">⚙️</span>
            <span className="menu-text">账号设置</span>
          </button>
          
          <div className="menu-divider"></div>
          
          <button 
            onClick={handleLogout}
            className="menu-item logout-item"
          >
            <span className="menu-icon">🚪</span>
            <span className="menu-text">退出登录</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;