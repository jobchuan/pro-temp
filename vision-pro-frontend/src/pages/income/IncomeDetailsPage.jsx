// src/pages/income/IncomeDetailsPage.jsx
import React, { useState } from 'react'
import { 
  Card, 
  Table, 
  Button, 
  DatePicker, 
  Select, 
  Input, 
  Spin, 
  Empty, 
  Tag, 
  Space,
  Tooltip,
  Form,
  Drawer
} from 'antd'
import { 
  SearchOutlined, 
  DownloadOutlined, 
  FilterOutlined, 
  EyeOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import { incomeApiService } from '@/services/api/incomeService'
import './IncomeDetailsPage.less'

const { RangePicker } = DatePicker
const { Option } = Select

const IncomeDetailsPage = () => {
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false)
  const [filterForm] = Form.useForm()
  const [filters, setFilters] = useState({
    date: null,
    incomeType: undefined,
    contentType: undefined,
    status: undefined,
    keyword: undefined,
    page: 1,
    limit: 10
  })
  
  // 获取收入明细数据
  const { data: incomeDetailsData, isLoading } = useQuery(
    ['incomeDetailsList', filters],
    () => incomeApiService.getIncomeDetailsList({
      startDate: filters.date?.[0]?.format('YYYY-MM-DD'),
      endDate: filters.date?.[1]?.format('YYYY-MM-DD'),
      incomeType: filters.incomeType,
      contentType: filters.contentType,
      status: filters.status,
      keyword: filters.keyword,
      page: filters.page,
      limit: filters.limit
    }),
    {
      keepPreviousData: true,
      refetchOnWindowFocus: false
    }
  )
  
  // 处理筛选变更
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value : 1 // 如果不是切换页码，则重置为第一页
    }))
  }
  
  // 应用筛选器
  const applyFilters = (values) => {
    setFilters(prev => ({
      ...prev,
      ...values,
      page: 1
    }))
    setFilterDrawerVisible(false)
  }
  
  // 重置筛选器
  const resetFilters = () => {
    filterForm.resetFields()
    setFilters({
      date: null,
      incomeType: undefined,
      contentType: undefined,
      status: undefined,
      keyword: undefined,
      page: 1,
      limit: 10
    })
  }
  
  // 获取收入类型标签
  const getIncomeTypeTag = (type) => {
    const types = {
      'subscription': { color: 'blue', text: '订阅收入' },
      'purchase': { color: 'green', text: '购买收入' },
      'ads': { color: 'orange', text: '广告收入' },
      'other': { color: 'default', text: '其他收入' }
    }
    
    const typeInfo = types[type] || { color: 'default', text: type }
    return <Tag color={typeInfo.color}>{typeInfo.text}</Tag>
  }
  
  // 获取状态标签
  const getStatusTag = (status) => {
    const statuses = {
      'pending': { color: 'warning', text: '待结算' },
      'settled': { color: 'success', text: '已结算' },
      'processing': { color: 'processing', text: '结算中' },
      'failed': { color: 'error', text: '结算失败' }
    }
    
    const statusInfo = statuses[status] || { color: 'default', text: status }
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
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
  
  // 表格列定义
  const columns = [
    {
      title: '收入ID',
      dataIndex: 'incomeId',
      key: 'incomeId',
      width: 180,
      render: (text) => (
        <div className="income-id">{text}</div>
      )
    },
    {
      title: '内容',
      dataIndex: 'contentTitle',
      key: 'contentTitle',
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
      title: '收入类型',
      dataIndex: 'incomeType',
      key: 'incomeType',
      width: 120,
      render: (text) => getIncomeTypeTag(text)
    },
    {
      title: '内容类型',
      dataIndex: 'contentType',
      key: 'contentType',
      width: 120,
      render: (text) => getContentTypeLabel(text)
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (text) => (
        <div className="amount">¥{parseFloat(text).toFixed(2)}</div>
      ),
      sorter: (a, b) => a.amount - b.amount
    },
    {
      title: '结算状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (text) => getStatusTag(text)
    },
    {
      title: '结算日期',
      dataIndex: 'settleDate',
      key: 'settleDate',
      width: 120,
      render: (text) => text || '-'
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (text) => {
        const date = new Date(text)
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => showIncomeDetail(record)}
            />
          </Tooltip>
        </Space>
      )
    }
  ]
  
  // 显示收入详情
  const showIncomeDetail = (record) => {
    console.log('显示收入详情:', record)
    // 实际项目中应该打开一个模态框显示详情，或者跳转到详情页
  }
  
  // 演示数据
  const demoData = [
    {
      key: '1',
      incomeId: 'INC202305120001',
      contentTitle: 'VR冒险游戏体验',
      thumbnail: 'https://via.placeholder.com/40x30',
      incomeType: 'subscription',
      contentType: '360_video',
      amount: 128.50,
      status: 'settled',
      settleDate: '2023-05-15',
      createdAt: '2023-05-12T10:30:00Z'
    },
    {
      key: '2',
      incomeId: 'INC202305130002',
      contentTitle: '太空探索之旅',
      thumbnail: 'https://via.placeholder.com/40x30',
      incomeType: 'purchase',
      contentType: 'spatial_video',
      amount: 89.90,
      status: 'settled',
      settleDate: '2023-05-15',
      createdAt: '2023-05-13T14:20:00Z'
    },
    {
      key: '3',
      incomeId: 'INC202305140003',
      contentTitle: '海底世界全景',
      thumbnail: 'https://via.placeholder.com/40x30',
      incomeType: 'ads',
      contentType: '360_photo',
      amount: 45.75,
      status: 'pending',
      settleDate: null,
      createdAt: '2023-05-14T09:15:00Z'
    }
  ]
  
  return (
    <div className="income-details-page">
      <div className="page-header">
        <h1>收入明细</h1>
        <div className="header-actions">
          <Input.Search
            placeholder="搜索内容标题或收入ID"
            allowClear
            style={{ width: 250, marginRight: 16 }}
            onSearch={(value) => handleFilterChange('keyword', value)}
          />
          <Button 
            icon={<FilterOutlined />} 
            onClick={() => setFilterDrawerVisible(true)}
            style={{ marginRight: 16 }}
          >
            高级筛选
          </Button>
          <Button type="primary" icon={<DownloadOutlined />}>导出数据</Button>
        </div>
      </div>
      
      <Card>
        <div className="table-toolbar">
          <div className="filter-tags">
            {filters.date && (
              <Tag closable onClose={() => handleFilterChange('date', null)}>
                日期: {filters.date[0].format('YYYY-MM-DD')} 至 {filters.date[1].format('YYYY-MM-DD')}
              </Tag>
            )}
            {filters.incomeType && (
              <Tag closable onClose={() => handleFilterChange('incomeType', undefined)}>
                收入类型: {
                  filters.incomeType === 'subscription' ? '订阅收入' :
                  filters.incomeType === 'purchase' ? '购买收入' :
                  filters.incomeType === 'ads' ? '广告收入' : '其他收入'
                }
              </Tag>
            )}
            {filters.contentType && (
              <Tag closable onClose={() => handleFilterChange('contentType', undefined)}>
                内容类型: {getContentTypeLabel(filters.contentType)}
              </Tag>
            )}
            {filters.status && (
              <Tag closable onClose={() => handleFilterChange('status', undefined)}>
                状态: {
                  filters.status === 'pending' ? '待结算' :
                  filters.status === 'settled' ? '已结算' :
                  filters.status === 'processing' ? '结算中' : '结算失败'
                }
              </Tag>
            )}
            {filters.keyword && (
              <Tag closable onClose={() => handleFilterChange('keyword', undefined)}>
                关键词: {filters.keyword}
              </Tag>
            )}
            {(filters.date || filters.incomeType || filters.contentType || filters.status || filters.keyword) && (
              <Button type="link" onClick={resetFilters} style={{ padding: '0 8px' }}>
                清除所有筛选
              </Button>
            )}
          </div>
        </div>
        
        {isLoading ? (
          <div className="loading-container">
            <Spin size="large" />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={demoData} // 实际项目中应使用 incomeDetailsData?.data?.list || []
            pagination={{
              current: filters.page,
              pageSize: filters.limit,
              total: 100, // 实际项目中应使用 incomeDetailsData?.data?.pagination?.total || 0
              showSizeChanger: true,
              showQuickJumper: true,
              onChange: (page) => handleFilterChange('page', page),
              onShowSizeChange: (_, size) => handleFilterChange('limit', size)
            }}
            rowKey="key"
          />
        )}
      </Card>
      
      {/* 高级筛选抽屉 */}
      <Drawer
        title="高级筛选"
        placement="right"
        width={320}
        onClose={() => setFilterDrawerVisible(false)}
        open={filterDrawerVisible}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Button onClick={() => setFilterDrawerVisible(false)} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button onClick={resetFilters} style={{ marginRight: 8 }}>
              重置
            </Button>
            <Button type="primary" onClick={() => filterForm.submit()}>
              应用
            </Button>
          </div>
        }
      >
        <Form
          form={filterForm}
          layout="vertical"
          onFinish={applyFilters}
          initialValues={{
            date: filters.date,
            incomeType: filters.incomeType,
            contentType: filters.contentType,
            status: filters.status
          }}
        >
          <Form.Item name="date" label="收入日期">
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="incomeType" label="收入类型">
            <Select placeholder="选择收入类型" allowClear>
              <Option value="subscription">订阅收入</Option>
              <Option value="purchase">购买收入</Option>
              <Option value="ads">广告收入</Option>
              <Option value="other">其他收入</Option>
            </Select>
          </Form.Item>
          <Form.Item name="contentType" label="内容类型">
            <Select placeholder="选择内容类型" allowClear>
              <Option value="180_video">180° 视频</Option>
              <Option value="360_video">360° 视频</Option>
              <Option value="180_photo">180° 照片</Option>
              <Option value="360_photo">360° 照片</Option>
              <Option value="spatial_video">空间视频</Option>
              <Option value="spatial_photo">空间照片</Option>
            </Select>
          </Form.Item>
          <Form.Item name="status" label="结算状态">
            <Select placeholder="选择结算状态" allowClear>
              <Option value="pending">待结算</Option>
              <Option value="processing">结算中</Option>
              <Option value="settled">已结算</Option>
              <Option value="failed">结算失败</Option>
            </Select>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  )
}

export default IncomeDetailsPage