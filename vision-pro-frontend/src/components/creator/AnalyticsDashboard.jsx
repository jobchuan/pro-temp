// components/creator/AnalyticsDashboard.jsx
import React, { useState, useEffect } from 'react';
import { creatorApi } from '../../services/apiService';
import { LineChart, BarChart, PieChart } from './charts';
import StatsCard from './StatsCard';

const AnalyticsDashboard = () => {
  const [overviewData, setOverviewData] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState('7days');

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const response = await creatorApi.getAnalyticsOverview();
      setOverviewData(response.data.data);
      
      const trendsResponse = await creatorApi.getAnalyticsTrends({ 
        period: 'month', 
        metric: 'views' 
      });
      setTrendData(trendsResponse.data.data.trends);
    } catch (error) {
      console.error('获取分析数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !overviewData) {
    return <div className="loading-spinner">加载分析数据中...</div>;
  }

  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <h1>创作者数据分析</h1>
        <div className="period-selector">
          <button 
            className={periodFilter === '7days' ? 'active' : ''} 
            onClick={() => setPeriodFilter('7days')}
          >
            最近7天
          </button>
          <button 
            className={periodFilter === '30days' ? 'active' : ''} 
            onClick={() => setPeriodFilter('30days')}
          >
            最近30天
          </button>
          <button 
            className={periodFilter === '90days' ? 'active' : ''} 
            onClick={() => setPeriodFilter('90days')}
          >
            最近90天
          </button>
        </div>
      </div>
      
      <div className="stats-cards">
        <StatsCard 
          title="总浏览量" 
          value={overviewData.totalStats.views} 
          icon="eye" 
        />
        <StatsCard 
          title="独立访客" 
          value={overviewData.totalStats.uniqueViewers} 
          icon="users" 
        />
        <StatsCard 
          title="点赞数" 
          value={overviewData.totalStats.likes} 
          icon="thumbs-up" 
        />
        <StatsCard 
          title="评论数" 
          value={overviewData.totalStats.comments} 
          icon="message-circle" 
        />
      </div>
      
      <div className="chart-container">
        <h2>浏览量趋势</h2>
        <LineChart 
          data={overviewData.recentTrend}
          xKey="date"
          yKey="views"
          color="#4C6FFF"
        />
      </div>
      
      <div className="top-content-section">
        <h2>表现最佳内容</h2>
        <div className="top-content-list">
          {overviewData.topContents.map(content => (
            <div key={content._id} className="top-content-item">
              <img 
                src={content.thumbnailURL || '/placeholder-thumbnail.jpg'} 
                alt={content.title['zh-CN']} 
              />
              <div className="content-info">
                <h3>{content.title['zh-CN'] || content.title['en-US']}</h3>
                <p>{content.views} 次浏览</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;