// src/pages/analytics/ContentAnalyticsPage.jsx
import React, { useState } from 'react'
import { Card, Row, Col, Tabs, Button, DatePicker, Spin, Empty, Select, Statistic } from 'antd'
import { DownloadOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import { analyticsApiService } from '@/services/api/analyticsService'
import { contentApiService } from '@/services/api/contentService'
import TrendChart from '@/components/analytics/TrendChart'
import './ContentAnalyticsPage.less'

const { RangePicker } = DatePicker
const { Option } = Select

const ContentAnalyticsPage = () => {
  const { contentId } = useParams()
  const [period, setPeriod] = useState('7d')
  const [activeTab, setActiveTab] = useState('overview')
  
  // 获取内容详情
  const { data: contentData, isLoading: isContentLoading } = useQuery(
    ['contentDetail', contentId],
    () => contentApiService.getContentDetail(contentId),
    {
      enabled: !!contentId,
      refetchOnWindowFocus: false
    }
  )
  
  // 获取内容分析数据
  const { data: analyticsData, isLoading: isAnalyticsLoading } = useQuery(
    ['contentAnalytics', contentId, period],
    () => analyticsApiService.getContentAnalytics(contentId, period),
    {
      enabled: !!contentId,
      refetchOnWindowFocus: false
    }
  )
  
  const isLoading = isContentLoading || isAnalyticsLoading
  const content = contentData?.data
  const analytics = analyticsData?.data
  
  // 处理时间段变更
  const handlePeriodChange = (value) => {
    setPeriod(value)
  }
  
  // 渲染内容标题区域
  const renderContentHeader = () => {
    if (isContentLoading) {
      return <Spin />
    }
    
    if (!content) {
      return <div>内容不存在或已被删除</div>
    }
    
    return (
      <div className="content-header">
        <div className="content-thumbnail">
          <img 
            src={content.files?.thumbnail?.url || '/placeholder-image.png'} 
            alt={content.title['zh-CN']} 
          />
        </div>
        <div className="content-info">
          <h2>{content.title['zh-CN']}</h2>
          <div className="content-meta">
            <span>类型: {getContentTypeLabel(content.contentType)}</span>
            <span>状态: {getStatusLabel(content.status)}</span>
            <span>发布日期: {formatDate(content.createdAt)}</span>
          </div>
        </div>
      </div>
    )
  }
  
  // 渲染概览统计
  const renderOverview = () => {
    if (isAnalyticsLoading) {
      return (
        <div className="loading-container">
          <Spin size="large" />
        </div>
      )
    }
    
    if (!analytics) {
      return <Empty description="暂无分析数据" />
    }
    
    const { overview } = analytics
    
    return (
      <div className="overview-section">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic 
                title="观看次数" 
                value={overview?.views || 0}
                suffix={
                  <span className={overview?.viewsChange >= 0 ? 'increase' : 'decrease'}>
                    {overview?.viewsChange >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                    {Math.abs(overview?.viewsChange || 0)}%
                  </span>
                }
              />
            </Card>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic 
                title="点赞数" 
                value={overview?.likes || 0}
                suffix={
                  <span className={overview?.likesChange >= 0 ? 'increase' : 'decrease'}>
                    {overview?.likesChange >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                    {Math.abs(overview?.likesChange || 0)}%
                  </span>
                }
              />
            </Card>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic 
                title="评论数" 
                value={overview?.comments || 0}
                suffix={
                  <span className={overview?.commentsChange >= 0 ? 'increase' : 'decrease'}>
                    {overview?.commentsChange >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                    {Math.abs(overview?.commentsChange || 0)}%
                  </span>
                }
              />
            </Card>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic 
                title="收藏数" 
                value={overview?.favorites || 0}
                suffix={
                  <span className={overview?.favoritesChange >= 0 ? 'increase' : 'decrease'}>
                    {overview?.favoritesChange >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                    {Math.abs(overview?.favoritesChange || 0)}%
                  </span>
                }
              />
            </Card>
          </Col>
        </Row>
      </div>
    )
  }
  
  // 渲染趋势图表
  const renderTrends = () => {
    if (isAnalyticsLoading) {
      return (
        <div className="loading-container">
          <Spin size="large" />
        </div>
      )
    }
    
    if (!analytics?.trends || analytics.trends.length === 0) {
      return <Empty description="暂无趋势数据" />
    }
    
    return (
      <div className="trends-section">
        <Card 
          title="内容表现趋势" 
          extra={
            <Button type="link" icon={<DownloadOutlined />}>导出数据</Button>
          }
        >
          <TrendChart data={analytics.trends} loading={isAnalyticsLoading} />
        </Card>
      </div>
    )
  }
  
  // 渲染观众分析
  const renderAudience = () => {
    if (isAnalyticsLoading) {
      return (
        <div className="loading-container">
          <Spin size="large" />
        </div>
      )
    }
    
    if (!analytics?.audience) {
      return <Empty description="暂无观众数据" />
    }
    
    // 由于我们没有实际的API响应结构，这里只是示意
    return (
      <div className="audience-section">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card title="观众年龄分布">
              <div className="placeholder-chart">年龄分布图表</div>
            </Card>
          </Col>
          
          <Col xs={24} md={12}>
            <Card title="观众性别分布">
              <div className="placeholder-chart">性别分布图表</div>
            </Card>
          </Col>
          
          <Col xs={24}>
            <Card title="观众地区分布">
              <div className="placeholder-chart">地区分布图表</div>
            </Card>
          </Col>
        </Row>
      </div>
    )
  }
  
  // 渲染互动分析
  const renderEngagement = () => {
    if (isAnalyticsLoading) {
      return (
        <div className="loading-container">
          <Spin size="large" />
        </div>
      )
    }
    
    if (!analytics?.engagement) {
      return <Empty description="暂无互动数据" />
    }
    
    // 由于我们没有实际的API响应结构，这里只是示意
    return (
      <div className="engagement-section">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card title="观看时长分布">
              <div className="placeholder-chart">观看时长分布图表</div>
            </Card>
          </Col>
          
          <Col xs={24} md={12}>
            <Card title="互动率">
              <div className="placeholder-chart">互动率图表</div>
            </Card>
          </Col>
          
          <Col xs={24}>
            <Card title="热点区域分析">
              <div className="placeholder-chart">热点区域分析图表</div>
            </Card>
          </Col>
        </Row>
      </div>
    )
  }
  
  // 获取内容类型标签
  const getContentTypeLabel = (type) => {
    const types = {
      '180_video': '180° 视频',
      '360_video': '360° 视频',
      '180_photo': '180° 照片',
      '360_photo': '360° 照片',
      'spatial_video': '空间视频',
      'spatial_photo': '空间照片'
    }
    return types[type] || type
  }
  
  // 获取状态标签
  const getStatusLabel = (status) => {
    const statuses = {
      'draft': '草稿',
      'pending_review': '待审核',
      'approved': '已批准',
      'published': '已发布',
      'rejected': '已拒绝',
      'archived': '已归档'
    }
    return statuses[status] || status
  }
  
  // 格式化日期
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }
  
  return (
    <div className="content-analytics-page">
      <div className="page-header">
        <div className="header-title">
          <Link to="/analytics">数据分析</Link> / 内容分析
        </div>
        <div className="header-actions">
          <Select 
            value={period} 
            onChange={handlePeriodChange}
            style={{ width: 120, marginRight: 16 }}
          >
            <Option value="7d">最近7天</Option>
            <Option value="30d">最近30天</Option>
            <Option value="90d">最近90天</Option>
            <Option value="all">全部时间</Option>
          </Select>
          <Button type="primary" icon={<DownloadOutlined />}>导出数据</Button>
        </div>
      </div>
      
      {renderContentHeader()}
      
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        className="content-analytics-tabs"
        items={[
          {
            key: 'overview',
            label: '概览',
            children: renderOverview()
          },
          {
            key: 'trends',
            label: '趋势',
            children: renderTrends()
          },
          {
            key: 'audience',
            label: '受众分析',
            children: renderAudience()
          },
          {
            key: 'engagement',
            label: '互动分析',
            children: renderEngagement()
          }
        ]}
      />
    </div>
  )
}

export default ContentAnalyticsPage