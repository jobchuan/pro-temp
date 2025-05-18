// src/pages/income/IncomeOverviewPage.jsx
import React, { useState } from 'react'
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Button, 
  Table, 
  DatePicker, 
  Tabs, 
  Select, 
  Spin, 
  Empty,
  Progress
} from 'antd'
import { 
  DollarOutlined, 
  DownloadOutlined, 
  ArrowUpOutlined, 
  ArrowDownOutlined,
  FilterOutlined,
  CalendarOutlined
} from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import { incomeApiService } from '@/services/api/incomeService'
import './IncomeOverviewPage.less'

const { RangePicker } = DatePicker
const { Option } = Select
const { TabPane } = Tabs

const IncomeOverviewPage = () => {
  const [dateRange, setDateRange] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [revenueType, setRevenueType] = useState('all')
  const [timeUnit, setTimeUnit] = useState('month')
  
  // 获取收入概览数据
  const { data: incomeData, isLoading } = useQuery(
    ['incomeOverview', dateRange, revenueType],
    () => incomeApiService.getIncomeOverview({
      startDate: dateRange?.[0]?.format('YYYY-MM-DD'),
      endDate: dateRange?.[1]?.format('YYYY-MM-DD'),
      revenueType
    }),
    {
      refetchOnWindowFocus: false
    }
  )
  
  // 获取收入明细数据
  const { data: incomeDetailsData, isLoading: isDetailsLoading } = useQuery(
    ['incomeDetails', timeUnit],
    () => incomeApiService.getIncomeDetails({ timeUnit }),
    {
      refetchOnWindowFocus: false
    }
  )
  
  // 处理日期范围变更
  const handleDateRangeChange = (dates) => {
    setDateRange(dates)
  }
  
  // 处理收入类型变更
  const handleRevenueTypeChange = (value) => {
    setRevenueType(value)
  }
  
  // 处理时间单位变更
  const handleTimeUnitChange = (value) => {
    setTimeUnit(value)
  }
  
  // 渲染概览统计卡片
  const renderOverviewStats = () => {
    if (isLoading) {
      return (
        <div className="loading-container">
          <Spin size="large" />
        </div>
      )
    }
    
    if (!incomeData?.data) {
      return <Empty description="暂无收入数据" />
    }
    
    const { stats } = incomeData.data
    
    return (
      <div className="overview-stats">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic 
                title="本月总收入" 
                value={stats?.currentMonthIncome || 0}
                precision={2}
                prefix={<DollarOutlined />}
                suffix="¥"
                valueStyle={{ color: '#3f8600' }}
              />
              <div className="stat-trend">
                {stats?.monthlyGrowth >= 0 ? (
                  <span className="increase">
                    <ArrowUpOutlined /> {stats?.monthlyGrowth || 0}%
                  </span>
                ) : (
                  <span className="decrease">
                    <ArrowDownOutlined /> {Math.abs(stats?.monthlyGrowth || 0)}%
                  </span>
                )}
                <span className="trend-label">较上月</span>
              </div>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic 
                title="累计总收入" 
                value={stats?.totalIncome || 0}
                precision={2}
                prefix={<DollarOutlined />}
                suffix="¥"
              />
              <Progress 
                percent={stats?.yearlyProgress || 0} 
                size="small"
                status="active" 
              />
              <div className="stat-label">年度目标完成进度</div>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic 
                title="会员订阅收入" 
                value={stats?.subscriptionIncome || 0}
                precision={2}
                prefix={<DollarOutlined />}
                suffix="¥"
              />
              <div className="stat-trend">
                {stats?.subscriptionGrowth >= 0 ? (
                  <span className="increase">
                    <ArrowUpOutlined /> {stats?.subscriptionGrowth || 0}%
                  </span>
                ) : (
                  <span className="decrease">
                    <ArrowDownOutlined /> {Math.abs(stats?.subscriptionGrowth || 0)}%
                  </span>
                )}
                <span className="trend-label">较上月</span>
              </div>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic 
                title="内容购买收入" 
                value={stats?.contentPurchaseIncome || 0}
                precision={2}
                prefix={<DollarOutlined />}
                suffix="¥"
              />
              <div className="stat-trend">
                {stats?.contentPurchaseGrowth >= 0 ? (
                  <span className="increase">
                    <ArrowUpOutlined /> {stats?.contentPurchaseGrowth || 0}%
                  </span>
                ) : (
                  <span className="decrease">
                    <ArrowDownOutlined /> {Math.abs(stats?.contentPurchaseGrowth || 0)}%
                  </span>
                )}
                <span className="trend-label">较上月</span>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    )
  }
  
  // 渲染收入分布
  const renderIncomeDistribution = () => {
    if (isLoading) {
      return (
        <div className="loading-container">
          <Spin size="large" />
        </div>
      )
    }
    
    if (!incomeData?.data?.distribution) {
      return <Empty description="暂无分布数据" />
    }
    
    // 这里只是示意，实际项目中应该使用如Echarts等图表库绘制环形图
    return (
      <div className="income-distribution">
        <Card title="收入来源分布" extra={<Button type="link" icon={<DownloadOutlined />}>导出</Button>}>
          <div className="placeholder-chart">收入来源分布环形图</div>
          <div className="distribution-legend">
            <div className="legend-item">
              <span className="legend-color subscription"></span>
              <span className="legend-label">会员订阅</span>
              <span className="legend-value">60%</span>
            </div>
            <div className="legend-item">
              <span className="legend-color purchase"></span>
              <span className="legend-label">内容购买</span>
              <span className="legend-value">25%</span>
            </div>
            <div className="legend-item">
              <span className="legend-color ads"></span>
              <span className="legend-label">广告分成</span>
              <span className="legend-value">10%</span>
            </div>
            <div className="legend-item">
              <span className="legend-color other"></span>
              <span className="legend-label">其他</span>
              <span className="legend-value">5%</span>
            </div>
          </div>
        </Card>
      </div>
    )
  }
  
  // 渲染收入趋势
  const renderIncomeTrend = () => {
    if (isDetailsLoading) {
      return (
        <div className="loading-container">
          <Spin size="large" />
        </div>
      )
    }
    
    if (!incomeDetailsData?.data?.trends) {
      return <Empty description="暂无趋势数据" />
    }
    
    return (
      <div className="income-trend">
        <Card 
          title="收入趋势" 
          extra={
            <div className="card-actions">
              <Select 
                value={timeUnit} 
                onChange={handleTimeUnitChange}
                style={{ width: 100, marginRight: 16 }}
              >
                <Option value="day">日</Option>
                <Option value="week">周</Option>
                <Option value="month">月</Option>
              </Select>
              <Button type="link" icon={<DownloadOutlined />}>导出</Button>
            </div>
          }
        >
          <div className="placeholder-chart">收入趋势折线图</div>
        </Card>
      </div>
    )
  }
  
  // 渲染热门内容收入
  const renderTopContentIncome = () => {
    if (isDetailsLoading) {
      return (
        <div className="loading-container">
          <Spin size="large" />
        </div>
      )
    }
    
    if (!incomeDetailsData?.data?.topContents) {
      return <Empty description="暂无内容收入数据" />
    }
    
    const columns = [
      {
        title: '内容',
        dataIndex: 'title',
        key: 'title',
        render: (text, record) => (
          <div className="content-cell">
            <img
              src={record.thumbnail || '/placeholder-image.png'}
              alt={text}
              className="content-thumbnail"
            />
            <span className="content-title">{text}</span>
          </div>
        )
      },
      {
        title: '内容类型',
        dataIndex: 'contentType',
        key: 'contentType',
        render: (text) => getContentTypeLabel(text)
      },
      {
        title: '订阅收入',
        dataIndex: 'subscriptionIncome',
        key: 'subscriptionIncome',
        render: (value) => `¥${value.toFixed(2)}`
      },
      {
        title: '购买收入',
        dataIndex: 'purchaseIncome',
        key: 'purchaseIncome',
        render: (value) => `¥${value.toFixed(2)}`
      },
      {
        title: '广告收入',
        dataIndex: 'adIncome',
        key: 'adIncome',
        render: (value) => `¥${value.toFixed(2)}`
      },
      {
        title: '总收入',
        dataIndex: 'totalIncome',
        key: 'totalIncome',
        render: (value) => `¥${value.toFixed(2)}`,
        sorter: (a, b) => a.totalIncome - b.totalIncome,
        defaultSortOrder: 'descend'
      }
    ]
    
    // 演示数据
    const demoData = [
      {
        key: '1',
        title: 'VR冒险游戏体验',
        thumbnail: 'https://via.placeholder.com/40x30',
        contentType: '360_video',
        subscriptionIncome: 1200.50,
        purchaseIncome: 890.25,
        adIncome: 345.10,
        totalIncome: 2435.85
      },
      {
        key: '2',
        title: '太空探索之旅',
        thumbnail: 'https://via.placeholder.com/40x30',
        contentType: 'spatial_video',
        subscriptionIncome: 980.75,
        purchaseIncome: 750.00,
        adIncome: 290.50,
        totalIncome: 2021.25
      },
      {
        key: '3',
        title: '海底世界全景',
        thumbnail: 'https://via.placeholder.com/40x30',
        contentType: '360_photo',
        subscriptionIncome: 780.30,
        purchaseIncome: 650.50,
        adIncome: 220.85,
        totalIncome: 1651.65
      }
    ]
    
    return (
      <div className="top-content-income">
        <Card title="热门内容收入" extra={<Button type="link" icon={<DownloadOutlined />}>导出</Button>}>
          <Table 
            columns={columns} 
            dataSource={demoData} 
            pagination={false} 
            size="middle"
          />
        </Card>
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
  
  return (
    <div className="income-overview-page">
      <div className="page-header">
        <h1>收入概览</h1>
        <div className="header-actions">
          <Select 
            placeholder="收入类型" 
            value={revenueType} 
            onChange={handleRevenueTypeChange}
            style={{ width: 120, marginRight: 16 }}
          >
            <Option value="all">全部收入</Option>
            <Option value="subscription">订阅收入</Option>
            <Option value="purchase">购买收入</Option>
            <Option value="ads">广告收入</Option>
          </Select>
          <RangePicker 
            onChange={handleDateRangeChange} 
            placeholder={['开始日期', '结束日期']}
            style={{ marginRight: 16 }}
          />
          <Button type="primary" icon={<DownloadOutlined />}>导出数据</Button>
        </div>
      </div>
      
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className="income-tabs"
        items={[
          {
            key: 'overview',
            label: '收入总览',
            children: (
              <>
                {renderOverviewStats()}
                <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                  <Col xs={24} lg={12}>
                    {renderIncomeDistribution()}
                  </Col>
                  <Col xs={24} lg={12}>
                    {renderIncomeTrend()}
                  </Col>
                </Row>
              </>
            )
          },
          {
            key: 'content',
            label: '内容收入',
            children: renderTopContentIncome()
          }
        ]}
      />
      
      <div className="action-buttons">
        <Link to="/income/details">
          <Button type="primary">查看收入明细</Button>
        </Link>
        <Link to="/income/withdraw">
          <Button>申请提现</Button>
        </Link>
      </div>
    </div>
  )
}

export default IncomeOverviewPage