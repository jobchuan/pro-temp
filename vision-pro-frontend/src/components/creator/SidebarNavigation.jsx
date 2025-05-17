// src/components/creator/SidebarNavigation.jsx
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const SidebarNavigation = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <aside className={`dashboard-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-container">
          <span className="logo-icon">🥽</span>
          {!collapsed && <h2 className="logo-text">Vision Pro</h2>}
        </div>
        <button className="collapse-button" onClick={toggleSidebar}>
          {collapsed ? '→' : '←'}
        </button>
      </div>
      
      <div className="sidebar-divider">
        <span>{collapsed ? 'M' : '主菜单'}</span>
      </div>
      
      <nav className="dashboard-nav">
        <NavLink to="/creator/dashboard" className={({isActive}) => isActive ? 'active' : ''}>
          <span className="nav-icon">📊</span>
          {!collapsed && <span className="nav-text">概览</span>}
        </NavLink>
        
        <NavLink to="/creator/contents" className={({isActive}) => isActive ? 'active' : ''}>
          <span className="nav-icon">🎬</span>
          {!collapsed && <span className="nav-text">内容库</span>}
        </NavLink>
        
        <NavLink to="/creator/analytics" className={({isActive}) => isActive ? 'active' : ''}>
          <span className="nav-icon">📈</span>
          {!collapsed && <span className="nav-text">数据分析</span>}
        </NavLink>
        
        <NavLink to="/creator/income" className={({isActive}) => isActive ? 'active' : ''}>
          <span className="nav-icon">💰</span>
          {!collapsed && <span className="nav-text">收入管理</span>}
        </NavLink>
        
        <NavLink to="/creator/comments" className={({isActive}) => isActive ? 'active' : ''}>
          <span className="nav-icon">💬</span>
          {!collapsed && <span className="nav-text">评论管理</span>}
        </NavLink>
        
        <NavLink to="/creator/fusions" className={({isActive}) => isActive ? 'active' : ''}>
          <span className="nav-icon">🔄</span>
          {!collapsed && <span className="nav-text">融合内容</span>}
        </NavLink>
      </nav>
      
      <div className="sidebar-divider">
        <span>{collapsed ? 'S' : '设置'}</span>
      </div>
      
      <nav className="dashboard-nav">
        <NavLink to="/creator/settings" className={({isActive}) => isActive ? 'active' : ''}>
          <span className="nav-icon">⚙️</span>
          {!collapsed && <span className="nav-text">设置</span>}
        </NavLink>
        
        <a href="https://docs.example.com" target="_blank" rel="noopener noreferrer">
          <span className="nav-icon">📖</span>
          {!collapsed && <span className="nav-text">帮助文档</span>}
        </a>
      </nav>
      
      <div className="dashboard-actions">
        <button 
          className="create-button" 
          onClick={() => navigate('/creator/content/new')}
        >
          <span className="button-icon">+</span>
          {!collapsed && <span className="button-text">创建新内容</span>}
        </button>
      </div>
    </aside>
  );
};

export default SidebarNavigation;