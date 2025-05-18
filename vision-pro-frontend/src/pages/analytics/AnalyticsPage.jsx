// src/pages/analytics/AnalyticsPage.jsx
import React, { useState } from 'react'
import { Card, Row, Col, Tabs, Button, DatePicker, Spin, Empty } from 'antd'
import { DownloadOutlined, CalendarOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import { analyticsApiService } from '@/services/api/analyticsService'
import TrendChart from '@/components/analytics/TrendChart'
import './AnalyticsPage.less'

const { RangePicker } = DatePicker

const AnalyticsPage = () => {
  const [dateRange, setDateRange] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  
  // 获取分析数据
  const { data: analyticsData, isLoading } = useQuery(
    ['analytics', dateRange],
    () => analyticsApiService.getAnalyticsTrends({
      startDate: dateRange?.[0]?.format('YYYY-MM-DD'),
      endDate: dateRange?.[1]?.format('YYYY-MM-DD')
    }),
    {
      enabled: true,
      refetchOnWindowFocus: false
    }
  )
  
  // 获取分析概览
  const { data: overviewData, isLoading: isOverviewLoading } = useQuery(
    'analyticsOverview',
    () => analyticsApiService.getAnalyticsOverview(),
    {
      refetchOnWindowFocus: false
    }
  )
  
  // 处理日期范围变更
  const handleDateRangeChange = (dates) => {
    setDateRange(dates)
  }
  
  // 渲染概览页
  const renderOverview = () => {
    if (isOverviewLoading) {
      return (
        <div className="loading-container">
          <Spin size="large" />
        </div>
      )
    }
    
    if (!overviewData?.data) {
      return <Empty description="暂无数据" />
    }
    
    const stats = overviewData.data.totalStats || {}
    
    return (
      <div className="overview-section">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card">
              <div className="stat-title">总观看次数</div>
              <div className="stat-value">{stats.views || 0}</div>
              <div className="stat-change">
                较上月 {stats.viewsGrowth > 0 ? '+' : ''}{stats.viewsGrowth || 0}%
              </div>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card">
              <div className="stat-title">总点赞数</div>
              <div className="stat-value">{stats.likes || 0}</div>
              <div className="stat-change">
                较上月 {stats.likesGrowth > 0 ? '+' : ''}{stats.likesGrowth || 0}%
              </div>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card">
              <div className="stat-title">评论数</div>
              <div className="stat-value">{stats.comments || 0}</div>
              <div className="stat-change">
                较上月 {stats.commentsGrowth > 0 ? '+' : ''}{stats.commentsGrowth || 0}%
              </div>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card">
              <div className="stat-title">新增粉丝</div>
              <div className="stat-value">{stats.followers || 0}</div>
              <div className="stat-change">
                较上月 {stats.followersGrowth > 0 ? '+' : ''}{stats.followersGrowth || 0}%
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    )
  }
  
  // 渲染趋势图表
  const renderTrendCharts = () => {
    if (isLoading) {
      return (
        <div className="loading-container">
          <Spin size="large" />
        </div>
      )
    }
    
    if (!analyticsData?.data?.trends || analyticsData.data.trends.length === 0) {
      return <Empty description="暂无趋势数据" />
    }
    
    const trendsData = analyticsData.data.trends
    
    return (
      <div className="trends-section">
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="观看和点赞趋势" extra={<Button type="link" icon={<DownloadOutlined />}>导出</Button>}>
              <TrendChart data={trendsData} loading={isLoading} />
            </Card>
          </Col>
          
          <Col xs={24} lg={12}>
            <Card title="评论和收藏趋势" extra={<Button type="link" icon={<DownloadOutlined />}>导出</Button>}>
              <TrendChart data={trendsData} loading={isLoading} />
            </Card>
          </Col>
        </Row>
      </div>
    )
  }
  
  // 渲染热门内容
  const renderTopContents = () => {
    if (isLoading) {
      return (
        <div className="loading-container">
          <Spin size="large" />
        </div>
      )
    }
    
    if (!analyticsData?.data?.topContents || analyticsData.data.topContents.length === 0) {
      return <Empty description="暂无热门内容数据" />
    }
    
    // 由于我们没有实际的API响应结构，这里只是示意
    return (
      <div className="top-contents-section">
        <Card title="热门内容" extra={<Link to="/content">查看全部内容</Link>}>
          <div className="placeholder-content">
            <p>此处显示热门内容列表</p>
          </div>
        </Card>
      </div>
    )
  }
  
  // 渲染受众分析
  const renderAudienceAnalysis = () => {
    if (isLoading) {
      return (
        <div className="loading-container">
          <Spin size="large" />
        </div>
      )
    }
    
    // 由于我们没有实际的API响应结构，这里只是示意
    return (
      <div className="audience-section">
        <Card title="受众分析" extra={<Link to="/analytics/audience">查看详情</Link>}>
          <div className="placeholder-content">
            <p>此处显示受众分析图表</p>
          </div>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="analytics-page">
      <div className="page-header">
        <h1>数据分析</h1>
        <div className="header-actions">
          <RangePicker 
            onChange={handleDateRangeChange} 
            placeholder={['开始日期', '结束日期']}
            allowClear
            style={{ marginRight: 16 }}
          />
          <Button type="primary" icon={<DownloadOutlined />}>导出数据</Button>
        </div>
      </div>
      
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={[
          {
            key: 'overview',
            label: '概览',
            children: renderOverview()
          },
          {
            key: 'trends',
            label: '趋势分析',
            children: renderTrendCharts()
          },
          {
            key: 'contents',
            label: '内容分析',
            children: renderTopContents()
          },
          {
            key: 'audience',
            label: '受众分析',
            children: renderAudienceAnalysis()
          }
        ]}
      />
    </div>
  )
}

export default AnalyticsPage