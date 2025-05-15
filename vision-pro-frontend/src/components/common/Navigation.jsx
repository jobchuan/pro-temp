import React from 'react';
import { Link } from 'react-router-dom';

const Navigation = () => {
  return (
    <nav className="main-navigation">
      <div className="nav-logo">
        <h1>Vision Pro 平台</h1>
      </div>
      <ul className="nav-links">
        <li><Link to="/">首页</Link></li>
        <li><Link to="/creator/dashboard">创作者中心</Link></li>
        <li><Link to="/creator/analytics">数据分析</Link></li>
        <li><Link to="/creator/contents">内容管理</Link></li>
        <li><Link to="/creator/income">收入管理</Link></li>
      </ul>
    </nav>
  );
};

export default Navigation;