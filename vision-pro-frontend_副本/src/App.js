import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/common/Navigation';
import AnalyticsDashboard from './components/creator/AnalyticsDashboard';
import './App.css';

// 简单的首页组件
const Home = () => (
  <div className="home-page">
    <h1>Vision Pro 沉浸式内容平台</h1>
    <p>欢迎使用我们的服务</p>
  </div>
);

// 其他页面的占位组件
const CreatorDashboard = () => <div>创作者仪表盘</div>;
const ContentManagement = () => <div>内容管理</div>;
const IncomeManagement = () => <div>收入管理</div>;

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/creator/dashboard" element={<CreatorDashboard />} />
            <Route path="/creator/analytics" element={<AnalyticsDashboard />} />
            <Route path="/creator/contents" element={<ContentManagement />} />
            <Route path="/creator/income" element={<IncomeManagement />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;