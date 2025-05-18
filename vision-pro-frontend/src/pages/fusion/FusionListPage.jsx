// src/pages/fusion/FusionListPage.jsx
import React, { useState } from 'react'
import { 
  Card, 
  Button, 
  Table, 
  Tag, 
  Space, 
  Input, 
  Select, 
  Dropdown, 
  Menu,
  Avatar, 
  Tooltip, 
  Modal, 
  Form, 
  Spin,
  Empty,
  message,
  Tabs,
  Radio,
  Row,
  Col
} from 'antd'
import { 
  PlusOutlined, 
  SearchOutlined, 
  FilterOutlined,
  MoreOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  ExclamationCircleOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  LinkOutlined,
  CopyOutlined,
  DownloadOutlined
} from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { fusionApiService } from '@/services/api/fusionService'
import './FusionListPage.less'

const { Option } = Select
const { TabPane } = Tabs

const FusionListPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [viewMode, setViewMode] = useState('table')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [filters, setFilters] = useState({
    status: undefined,
    fusionType: undefined,
    page: 1,
    limit: 10
  })
  const [activeTab, setActiveTab] = useState('all')
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false)
  const [fusionToDelete, setFusionToDelete] = useState(null)
  
  // 获取融合内容列表
  const { 
    data: fusionData, 
    isLoading, 
    error 
  } = useQuery(
    ['fusionList', activeTab, filters, searchKeyword],
    () => fusionApiService.getFusions({
      type: activeTab !== 'all' ? activeTab : undefined,
      status: filters.status,
      fusionType: filters.fusionType,
      keyword: searchKeyword,
      page: filters.page,
      limit: filters.limit
    }),
    {
      keepPreviousData: true,
      refetchOnWindowFocus: false
    }
  )
  
  // 删除融合内容mutation
  const deleteFusionMutation = useMutation(
    (id) => fusionApiService.deleteFusion(id),
    {
      onSuccess: () => {
        message.success('融合内容已删除')
        setConfirmDeleteVisible(false)
        setFusionToDelete(null)
        queryClient.invalidateQueries('fusionList')
      },
      onError: (error) => {
        message.error('删除失败: ' + error.message)
      }
    }
  )
  
  // 处理查询变更
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value : 1 // 如果不是切换页码，则重置为第一页
    }))
  }
  
  // 处理搜索
  const handleSearch = (value) => {
    setSearchKeyword(value)
    setFilters(prev => ({
      ...prev,
      page: 1
    }))
  }
  
  // 处理删除
  const handleDelete = (fusion) => {
    setFusionToDelete(fusion)
    setConfirmDeleteVisible(true)
  }
  
  // 确认删除
  const confirmDelete = () => {
    deleteFusionMutation.mutate(fusionToDelete.id)
  }
  
  // 获取状态标签
  const getStatusTag = (status) => {
    switch (status) {
      case 'published':
        return <Tag color="success" icon={<CheckCircleOutlined />}>已发布</Tag>
      case 'draft':
        return <Tag color="default" icon={<EditOutlined />}>草稿</Tag>
      case 'processing':
        return <Tag color="processing" icon={<ClockCircleOutlined />}>处理中</Tag>
      case 'failed':
        return <Tag color="error" icon={<CloseCircleOutlined />}>失败</Tag>
      default:
        return <Tag>{status}</Tag>
    }
  }
  
  // 获取融合类型标签
  const getFusionTypeTag = (type) => {
    switch (type) {
      case 'multi_view':
        return <Tag color="blue">多视角</Tag>
      case 'interactive':
        return <Tag color="green">交互式</Tag>
      case 'ar_overlay':
        return <Tag color="purple">AR覆盖</Tag>
      case 'spatial_audio':
        return <Tag color="magenta">空间音频</Tag>
      case 'custom':
        return <Tag color="orange">自定义</Tag>
      default:
        return <Tag>{type}</Tag>
    }
  }
  
  // 表格列定义
  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div className="fusion-title">
          <div className="thumbnail">
            {record.thumbnail ? (
              <img src={record.thumbnail} alt={text} />
            ) : (
              <div className="placeholder-thumbnail">
                <LinkOutlined />
              </div>
            )}
          </div>
          <div className="title-info">
            <div className="title-main">
              <Link to={`/fusion/edit/${record.id}`}>{text}</Link>
            </div>
            <div className="title-sub">
              {getFusionTypeTag(record.fusionType)}
              <span className="content-count">{record.sourceCount} 个源内容</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: '创建者',
      dataIndex: 'creator',
      key: 'creator',
      width: 120,
      render: (creator) => (
        <div className="creator-info">
          <Avatar 
            src={creator?.avatar} 
            icon={!creator?.avatar && <UserOutlined />}
            size="small"
          />
          <span className="creator-name">{creator?.name}</span>
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => getStatusTag(status)
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date) => {
        const d = new Date(date)
        return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          {record.status === 'published' && (
            <Tooltip title="预览">
              <Button 
                type="text" 
                icon={<EyeOutlined />} 
                onClick={() => window.open(`/fusion/view/${record.id}`, '_blank')} 
              />
            </Tooltip>
          )}
          <Tooltip title="编辑">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => navigate(`/fusion/edit/${record.id}`)} 
            />
          </Tooltip>
          <Dropdown
            overlay={
              <Menu>
                {record.status === 'published' && (
                  <Menu.Item key="view" icon={<EyeOutlined />} onClick={() => window.open(`/fusion/view/${record.id}`, '_blank')}>
                    预览
                  </Menu.Item>
                )}
                <Menu.Item key="edit" icon={<EditOutlined />} onClick={() => navigate(`/fusion/edit/${record.id}`)}>
                  编辑
                </Menu.Item>
                <Menu.Item key="copy" icon={<CopyOutlined />}>
                  复制
                </Menu.Item>
                {record.status === 'published' && (
                  <Menu.Item key="share" icon={<LinkOutlined />}>
                    分享
                  </Menu.Item>
                )}
                <Menu.Divider />
                <Menu.Item key="delete" icon={<DeleteOutlined />} danger onClick={() => handleDelete(record)}>
                  删除
                </Menu.Item>
              </Menu>
            }
            trigger={['click']}
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      )
    }
  ]
  
  // 渲染卡片视图
  const renderCardView = () => {
    const fusions = fusionData?.data?.items || []
    
    return (
      <div className="card-view">
        <Row gutter={[16, 16]}>
          {fusions.map(fusion => (
            <Col xs={24} sm={12} md={8} lg={6} xl={6} key={fusion.id}>
              <Card 
                hoverable 
                cover={
                  <div className="card-cover">
                    {fusion.thumbnail ? (
                      <img src={fusion.thumbnail} alt={fusion.title} />
                    ) : (
                      <div className="placeholder-cover">
                        <LinkOutlined />
                      </div>
                    )}
                    <div className="cover-status">
                      {getStatusTag(fusion.status)}
                    </div>
                  </div>
                }
                actions={[
                  fusion.status === 'published' ? (
                    <Tooltip title="预览">
                      <EyeOutlined key="view" onClick={() => window.open(`/fusion/view/${fusion.id}`, '_blank')} />
                    </Tooltip>
                  ) : (
                    <Tooltip title="预览不可用">
                      <EyeOutlined key="view" style={{ color: '#d9d9d9' }} />
                    </Tooltip>
                  ),
                  <Tooltip title="编辑">
                    <EditOutlined key="edit" onClick={() => navigate(`/fusion/edit/${fusion.id}`)} />
                  </Tooltip>,
                  <Dropdown
                    key="more"
                    overlay={
                      <Menu>
                        <Menu.Item key="copy" icon={<CopyOutlined />}>
                          复制
                        </Menu.Item>
                        {fusion.status === 'published' && (
                          <Menu.Item key="share" icon={<LinkOutlined />}>
                            分享
                          </Menu.Item>
                        )}
                        <Menu.Divider />
                        <Menu.Item key="delete" icon={<DeleteOutlined />} danger onClick={() => handleDelete(fusion)}>
                          删除
                        </Menu.Item>
                      </Menu>
                    }
                    trigger={['click']}
                  >
                    <MoreOutlined />
                  </Dropdown>
                ]}
              >
                <Card.Meta
                  title={<Link to={`/fusion/edit/${fusion.id}`}>{fusion.title}</Link>}
                  description={
                    <div className="card-description">
                      <div className="fusion-type">
                        {getFusionTypeTag(fusion.fusionType)}
                        <span className="content-count">{fusion.sourceCount} 个源内容</span>
                      </div>
                      <div className="creator-info">
                        <Avatar 
                          src={fusion.creator?.avatar} 
                          icon={!fusion.creator?.avatar && <UserOutlined />}
                          size="small"
                        />
                        <span>{fusion.creator?.name}</span>
                      </div>
                      <div className="created-time">
                        创建时间: {new Date(fusion.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    )
  }
  
  return (
    <div className="fusion-list-page">
      <div className="page-header">
        <h1>融合内容</h1>
        <div className="header-actions">
          <Input.Search
            placeholder="搜索融合内容"
            allowClear
            onSearch={handleSearch}
            style={{ width: 250, marginRight: 16 }}
          />
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => navigate('/fusion/create')}
          >
            创建融合内容
          </Button>
        </div>
      </div>
      
      <Card>
        <div className="filter-toolbar">
          <div className="left-filters">
            <Tabs 
              activeKey={activeTab} 
              onChange={setActiveTab}
            >
              <TabPane tab="全部" key="all" />
              <TabPane tab="多视角" key="multi_view" />
              <TabPane tab="交互式" key="interactive" />
              <TabPane tab="AR覆盖" key="ar_overlay" />
              <TabPane tab="空间音频" key="spatial_audio" />
            </Tabs>
          </div>
          
          <div className="right-filters">
            <Select
              placeholder="状态筛选"
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
              allowClear
              style={{ width: 120, marginRight: 8 }}
            >
              <Option value="published">已发布</Option>
              <Option value="draft">草稿</Option>
              <Option value="processing">处理中</Option>
              <Option value="failed">失败</Option>
            </Select>
            
            <Radio.Group
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              buttonStyle="solid"
            >
              <Radio.Button value="table"><UnorderedListOutlined /></Radio.Button>
              <Radio.Button value="card"><AppstoreOutlined /></Radio.Button>
            </Radio.Group>
          </div>
        </div>
        
        {isLoading ? (
          <div className="loading-container">
            <Spin size="large" />
          </div>
        ) : error ? (
          <div className="error-container">
            <Empty 
              image={Empty.PRESENTED_IMAGE_SIMPLE} 
              description="加载失败，请重试"
            />
            <Button type="primary" style={{ marginTop: 16 }} onClick={() => queryClient.invalidateQueries('fusionList')}>
              重新加载
            </Button>
          </div>
        ) : (fusionData?.data?.items?.length === 0) ? (
          <Empty description={(
            <span>
              暂无融合内容 
              <Button 
                type="link" 
                onClick={() => navigate('/fusion/create')}
              >
                创建融合内容
              </Button>
            </span>
          )} />
        ) : (
          viewMode === 'table' ? (
            <Table
              columns={columns}
              dataSource={fusionData?.data?.items || []}
              rowKey="id"
              pagination={{
                current: filters.page,
                pageSize: filters.limit,
                total: fusionData?.data?.pagination?.total || 0,
                showSizeChanger: true,
                showQuickJumper: true,
                onChange: (page) => handleFilterChange('page', page),
                onShowSizeChange: (_, size) => handleFilterChange('limit', size)
              }}
            />
          ) : (
            <>
              {renderCardView()}
              <div className="pagination-container">
                <Tabs.Pagination
                  current={filters.page}
                  pageSize={filters.limit}
                  total={fusionData?.data?.pagination?.total || 0}
                  showSizeChanger
                  showQuickJumper
                  onChange={(page) => handleFilterChange('page', page)}
                  onShowSizeChange={(_, size) => handleFilterChange('limit', size)}
                />
              </div>
            </>
          )
        )}
      </Card>
      
      {/* 删除确认对话框 */}
      <Modal
        title="确认删除"
        open={confirmDeleteVisible}
        onOk={confirmDelete}
        onCancel={() => {
          setConfirmDeleteVisible(false)
          setFusionToDelete(null)
        }}
        okText="确认删除"
        cancelText="取消"
        okButtonProps={{ danger: true, loading: deleteFusionMutation.isLoading }}
      >
        <div className="delete-confirmation">
          <ExclamationCircleOutlined className="warning-icon" />
          <p>确定要删除融合内容 "{fusionToDelete?.title}" 吗？</p>
          <p className="warning-text">此操作无法撤销，但不会删除源内容。</p>
        </div>
      </Modal>
    </div>
  )
}

export default FusionListPage