// src/pages/dashboard/DashboardPage.jsx
import React from 'react'
import { Row, Col, Card, Statistic, Button, List, Avatar, Tag, Spin, Empty } from 'antd'
import { 
  PlayCircleOutlined, 
  LikeOutlined, 
  UserAddOutlined, 
  DollarOutlined,
  PlusOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CommentOutlined
} from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { analyticsApiService } from '@/services/api/analyticsService'
import { contentApiService } from '@/services/api/contentService'
import { commentApiService } from '@/services/api/commentService'
import TrendChart from '@/components/analytics/TrendChart'
import './DashboardPage.less'

const DashboardPage = () => {
  const navigate = useNavigate()
  
  // 获取分析概览数据
  const { data: analyticsData, isLoading: isAnalyticsLoading } = useQuery(
    'dashboardAnalytics',
    () => analyticsApiService.getAnalyticsOverview(),
    {
      staleTime: 5 * 60 * 1000, // 5分钟内不重新获取
      refetchOnWindowFocus: false
    }
  )
  
  // 获取热门内容
  const { data: topContentsData, isLoading: isTopContentsLoading } = useQuery(
    'dashboardTopContents',
    () => contentApiService.getUserContentList({ sort: '-stats.views', limit: 5 }),
    {
      staleTime: 5 * 60 * 1000, // 5分钟内不重新获取
      refetchOnWindowFocus: false
    }
  )
  
  // 获取最近评论
  const { data: recentCommentsData, isLoading: isCommentsLoading } = useQuery(
    'dashboardRecentComments',
    () => commentApiService.getCreatorComments({ limit: 5, sort: '-createdAt' }),
    {
      staleTime: 5 * 60 * 1000, // 5分钟内不重新获取
      refetchOnWindowFocus: false
    }
  )
  
  // 数据加载状态
  const isLoading = isAnalyticsLoading || isTopContentsLoading || isCommentsLoading
  
  // 渲染统计卡片
  const renderStatsCards = () => {
    if (isAnalyticsLoading) {
      return (
        <div className="stats-loading">
          <Spin size="large" />
        </div>
      )
    }
    
    const stats = analyticsData?.data?.totalStats || {
      views: 0,
      likes: 0,
      followers: 0,
      income: 0
    }
    
    return (
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总观看次数"
              value={stats.views}
              prefix={<PlayCircleOutlined />}
              suffix={
                <Tag color="blue" className="trend-tag">
                  {stats.viewsGrowth > 0 ? (
                    <><ArrowUpOutlined /> {stats.viewsGrowth}%</>
                  ) : (
                    <><ArrowDownOutlined /> {Math.abs(stats.viewsGrowth)}%</>
                  )}
                </Tag>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="点赞数量"
              value={stats.likes}
              prefix={<LikeOutlined />}
              suffix={
                <Tag color={stats.likesGrowth >= 0 ? 'blue' : 'red'} className="trend-tag">
                  {stats.likesGrowth > 0 ? (
                    <><ArrowUpOutlined /> {stats.likesGrowth}%</>
                  ) : (
                    <><ArrowDownOutlined /> {Math.abs(stats.likesGrowth)}%</>
                  )}
                </Tag>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="新增粉丝"
              value={stats.followers}
              prefix={<UserAddOutlined />}
              suffix={
                <Tag color={stats.followersGrowth >= 0 ? 'blue' : 'red'} className="trend-tag">
                  {stats.followersGrowth > 0 ? (
                    <><ArrowUpOutlined /> {stats.followersGrowth}%</>
                  ) : (
                    <><ArrowDownOutlined /> {Math.abs(stats.followersGrowth)}%</>
                  )}
                </Tag>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="本月收入 (¥)"
              value={stats.income}
              precision={2}
              prefix={<DollarOutlined />}
              suffix={
                <Tag color={stats.incomeGrowth >= 0 ? 'blue' : 'red'} className="trend-tag">
                  {stats.incomeGrowth > 0 ? (
                    <><ArrowUpOutlined /> {stats.incomeGrowth}%</>
                  ) : (
                    <><ArrowDownOutlined /> {Math.abs(stats.incomeGrowth)}%</>
                  )}
                </Tag>
              }
            />
          </Card>
        </Col>
      </Row>
    )
  }
  
  // 渲染趋势图
  const renderTrendsChart = () => {
    if (isAnalyticsLoading) {
      return (
        <div className="chart-loading">
          <Spin size="large" />
        </div>
      )
    }
    
    const trendsData = analyticsData?.data?.recentTrend || []
    
    if (trendsData.length === 0) {
      return (
        <Empty description="暂无趋势数据" />
      )
    }
    
    return (
      <Card
        title="内容表现趋势"
        extra={
          <Link to="/analytics">
            <Button type="link">查看详情</Button>
          </Link>
        }
      >
        <TrendChart data={trendsData} />
      </Card>
    )
  }
  
  // 渲染热门内容列表
  const renderTopContents = () => {
    if (isTopContentsLoading) {
      return (
        <div className="list-loading">
          <Spin size="large" />
        </div>
      )
    }
    
    const topContents = topContentsData?.data?.data || []
    
    if (topContents.length === 0) {
      return (
        <Empty description="暂无内容数据" />
      )
    }
    
    return (
      <Card 
        title="热门内容" 
        extra={<Link to="/content">查看全部</Link>}
        className="dashboard-card"
      >
        <List
          itemLayout="horizontal"
          dataSource={topContents}
          renderItem={(item) => (
            <List.Item
              key={item._id}
              actions={[
                <span key="views">{item.stats?.views || 0} 次观看</span>,
                <span key="likes">{item.stats?.likes || 0} 点赞</span>
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Avatar 
                    src={item.files?.thumbnail?.url || '/placeholder-thumbnail.png'} 
                    shape="square" 
                    size={48}
                  />
                }
                title={
                  <Link to={`/content/edit/${item._id}`}>
                    {item.title['zh-CN']}
                  </Link>
                }
                description={
                  <div>
                    <Tag color="blue">{getContentTypeLabel(item.contentType)}</Tag>
                    <Tag color="green">{item.status === 'published' ? '已发布' : '草稿'}</Tag>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    )
  }
  
  // 渲染最近评论
  const renderRecentComments = () => {
    if (isCommentsLoading) {
      return (
        <div className="list-loading">
          <Spin size="large" />
        </div>
      )
    }
    
    const comments = recentCommentsData?.data?.comments || []
    
    if (comments.length === 0) {
      return (
        <Empty description="暂无评论数据" />
      )
    }
    
    return (
      <Card 
        title="最近评论" 
        extra={<Link to="/comments">查看全部</Link>}
        className="dashboard-card"
      >
        <List
          itemLayout="horizontal"
          dataSource={comments}
          renderItem={(item) => (
            <List.Item
              key={item._id}
              actions={[
                <Button 
                  type="link" 
                  key="reply"
                  onClick={() => navigate(`/comments?id=${item._id}`)}
                >
                  回复
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={<Avatar src={item.user?.avatar} />}
                title={
                  <span>
                    {item.user?.displayName || item.user?.username}
                    <small className="comment-time"> - {formatTime(item.createdAt)}</small>
                  </span>
                }
                description={
                  <div>
                    <div className="comment-text">{item.text}</div>
                    <div className="comment-content">
                      <CommentOutlined /> 在《{item.content?.title['zh-CN']}》
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>
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
  
  // 格式化时间
  const formatTime = (timeString) => {
    const now = new Date()
    const time = new Date(timeString)
    const diff = now - time
    
    // 小于1分钟
    if (diff < 60 * 1000) {
      return '刚刚'
    }
    
    // 小于1小时
    if (diff < 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 1000))}分钟前`
    }
    
    // 小于1天
    if (diff < 24 * 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 60 * 1000))}小时前`
    }
    
    // 小于30天
    if (diff < 30 * 24 * 60 * 60 * 1000) {
      return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`
    }
    
    // 大于30天，显示具体日期
    return `${time.getFullYear()}-${time.getMonth() + 1}-${time.getDate()}`
  }
  
  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>仪表盘</h1>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => navigate('/content/create')}
        >
          创建新内容
        </Button>
      </div>
      
      <div className="dashboard-content">
        {/* 统计卡片 */}
        <section className="stats-section">
          {renderStatsCards()}
        </section>
        
        {/* 趋势图 */}
        <section className="trends-section">
          {renderTrendsChart()}
        </section>
        
        {/* 热门内容和最近评论 */}
        <Row gutter={[16, 16]} className="lists-section">
          <Col xs={24} md={12}>
            {renderTopContents()}
          </Col>
          <Col xs={24} md={12}>
            {renderRecentComments()}
          </Col>
        </Row>
      </div>
    </div>
  )
}

export default DashboardPage
