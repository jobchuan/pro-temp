// src/pages/analytics/AudienceAnalyticsPage.jsx
import React, { useState } from 'react'
import { Card, Row, Col, Button, Select, Spin, Empty, Tabs, Statistic } from 'antd'
import { DownloadOutlined, UserOutlined, GlobalOutlined, TeamOutlined, FieldTimeOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import { analyticsApiService } from '@/services/api/analyticsService'
import './AudienceAnalyticsPage.less'

const { Option } = Select

const AudienceAnalyticsPage = () => {
  const [period, setPeriod] = useState('30d')
  const [activeTab, setActiveTab] = useState('demographics')
  
  // 获取受众分析数据
  const { data: audienceData, isLoading } = useQuery(
    ['audienceAnalytics', period],
    () => analyticsApiService.getAudienceAnalytics({ period }),
    {
      refetchOnWindowFocus: false
    }
  )
  
  // 处理时间段变更
  const handlePeriodChange = (value) => {
    setPeriod(value)
  }
  
  // 渲染受众概览
  const renderOverview = () => {
    if (isLoading) {
      return (
        <div className="loading-container">
          <Spin size="large" />
        </div>
      )
    }
    
    if (!audienceData?.data) {
      return <Empty description="暂无受众数据" />
    }
    
    const { overview } = audienceData.data
    
    return (
      <div className="overview-section">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic 
                title="总访问用户" 
                value={overview?.totalUsers || 0}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic 
                title="新用户占比" 
                value={overview?.newUsersPercentage || 0}
                suffix="%"
                precision={1}
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic 
                title="人均观看时长" 
                value={overview?.avgViewDuration || 0}
                suffix="分钟"
                precision={1}
                prefix={<FieldTimeOutlined />}
              />
            </Card>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic 
                title="地区覆盖" 
                value={overview?.regionCount || 0}
                suffix="个地区"
                prefix={<GlobalOutlined />}
              />
            </Card>
          </Col>
        </Row>
      </div>
    )
  }
  
  // 渲染受众人口统计
  const renderDemographics = () => {
    if (isLoading) {
      return (
        <div className="loading-container">
          <Spin size="large" />
        </div>
      )
    }
    
    if (!audienceData?.data?.demographics) {
      return <Empty description="暂无人口统计数据" />
    }
    
    // 由于我们没有实际的API响应结构，这里只是示意
    return (
      <div className="demographics-section">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card title="年龄分布">
              <div className="placeholder-chart">年龄分布图表</div>
            </Card>
          </Col>
          
          <Col xs={24} md={12}>
            <Card title="性别分布">
              <div className="placeholder-chart">性别分布图表</div>
            </Card>
          </Col>
          
          <Col xs={24} md={12}>
            <Card title="职业分布">
              <div className="placeholder-chart">职业分布图表</div>
            </Card>
          </Col>
          
          <Col xs={24} md={12}>
            <Card title="兴趣分布">
              <div className="placeholder-chart">兴趣分布图表</div>
            </Card>
          </Col>
        </Row>
      </div>
    )
  }
  
  // 渲染地区分布
  const renderGeographics = () => {
    if (isLoading) {
      return (
        <div className="loading-container">
          <Spin size="large" />
        </div>
      )
    }
    
    if (!audienceData?.data?.geographics) {
      return <Empty description="暂无地区分布数据" />
    }
    
    // 由于我们没有实际的API响应结构，这里只是示意
    return (
      <div className="geographics-section">
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card title="地区分布地图">
              <div className="placeholder-chart">地区分布地图</div>
            </Card>
          </Col>
          
          <Col xs={24} md={12}>
            <Card title="国家/地区分布">
              <div className="placeholder-chart">国家/地区分布图表</div>
            </Card>
          </Col>
          
          <Col xs={24} md={12}>
            <Card title="城市分布">
              <div className="placeholder-chart">城市分布图表</div>
            </Card>
          </Col>
        </Row>
      </div>
    )
  }
  
  // 渲染设备分析
  const renderDevices = () => {
    if (isLoading) {
      return (
        <div className="loading-container">
          <Spin size="large" />
        </div>
      )
    }
    
    if (!audienceData?.data?.devices) {
      return <Empty description="暂无设备数据" />
    }
    
    // 由于我们没有实际的API响应结构，这里只是示意
    return (
      <div className="devices-section">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card title="设备类型分布">
              <div className="placeholder-chart">设备类型分布图表</div>
            </Card>
          </Col>
          
          <Col xs={24} md={12}>
            <Card title="操作系统分布">
              <div className="placeholder-chart">操作系统分布图表</div>
            </Card>
          </Col>
          
          <Col xs={24} md={12}>
            <Card title="浏览器分布">
              <div className="placeholder-chart">浏览器分布图表</div>
            </Card>
          </Col>
          
          <Col xs={24} md={12}>
            <Card title="屏幕分辨率分布">
              <div className="placeholder-chart">屏幕分辨率分布图表</div>
            </Card>
          </Col>
        </Row>
      </div>
    )
  }
  
  return (
    <div className="audience-analytics-page">
      <div className="page-header">
        <div className="header-title">
          <Link to="/analytics">数据分析</Link> / 受众分析
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
      
      {renderOverview()}
      
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        className="audience-analytics-tabs"
        items={[
          {
            key: 'demographics',
            label: '人口统计',
            children: renderDemographics()
          },
          {
            key: 'geographics',
            label: '地区分布',
            children: renderGeographics()
          },
          {
            key: 'devices',
            label: '设备分析',
            children: renderDevices()
          }
        ]}
      />
    </div>
  )
}

export default AudienceAnalyticsPage