// pages/CreatorDashboard.jsx
import React, { useState } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import ContentLibrary from '../components/creator/ContentLibrary';
import AnalyticsDashboard from '../components/creator/AnalyticsDashboard';
import IncomeDashboard from '../components/creator/IncomeDashboard';
import ContentForm from '../components/creator/ContentForm';
import CommentsManager from '../components/creator/CommentsManager';
import CreatorSettings from '../components/creator/CreatorSettings';

const CreatorDashboard = () => {
  const navigate = useNavigate();
  
  return (
    <div className="creator-dashboard">
      <aside className="dashboard-sidebar">
        <div className="logo">Vision Pro 平台</div>
        
        <nav className="dashboard-nav">
          <NavLink to="/creator/contents" className={({isActive}) => isActive ? 'active' : ''}>
            内容库
          </NavLink>
          
          <NavLink to="/creator/analytics" className={({isActive}) => isActive ? 'active' : ''}>
            数据分析
          </NavLink>
          
          <NavLink to="/creator/income" className={({isActive}) => isActive ? 'active' : ''}>
            收入管理
          </NavLink>
          
          <NavLink to="/creator/comments" className={({isActive}) => isActive ? 'active' : ''}>
            评论管理
          </NavLink>
          
          <NavLink to="/creator/settings" className={({isActive}) => isActive ? 'active' : ''}>
            设置
          </NavLink>
        </nav>
        
        <div className="dashboard-actions">
          <button 
            className="primary-button full-width" 
            onClick={() => navigate('/creator/content/new')}
          >
            创建新内容
          </button>
        </div>
      </aside>
      
      <main className="dashboard-content">
        <Routes>
          <Route path="/" element={<AnalyticsDashboard />} />
          <Route path="/contents" element={<ContentLibrary />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
          <Route path="/income" element={<IncomeDashboard />} />
          <Route path="/comments" element={<CommentsManager />} />
          <Route path="/settings" element={<CreatorSettings />} />
          <Route path="/content/new" element={<ContentForm />} />
          <Route path="/content/:contentId" element={<ContentForm />} />
        </Routes>
      </main>
    </div>
  );
};

export default CreatorDashboard;