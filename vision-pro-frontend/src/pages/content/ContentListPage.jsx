// src/pages/content/ContentListPage.jsx
import React, { useState, useEffect } from 'react'
import { 
  Table, 
  Card, 
  Button, 
  Input, 
  Select, 
  Tag, 
  Space, 
  Pagination, 
  Dropdown, 
  Menu,
  message,
  Modal,
  Spin,
  Radio,
  Checkbox,
  Row,
  Col,
  Tooltip
} from 'antd'
import { 
  PlusOutlined, 
  SearchOutlined, 
  FilterOutlined, 
  MoreOutlined,
  EditOutlined,
  EyeOutlined,
  BarChartOutlined,
  DeleteOutlined,
  CopyOutlined,
  PushpinOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  UploadOutlined,
  DownloadOutlined,
  CheckOutlined,
  TagsOutlined
} from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import { useUserContentList, useDeleteContent, useBatchUpdateStatus, useBatchAddTags } from '@/hooks/useContent'
import ContentStatusTag from '@/components/content/ContentStatusTag'
import TagsEditModal from '@/components/content/TagsEditModal'
import './ContentListPage.less'

const { Option } = Select

const ContentListPage = () => {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState('table') // 'table' 或 'card'
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: undefined,
    contentType: undefined,
    search: undefined,
    sort: '-createdAt'
  })
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [tagsModalVisible, setTagsModalVisible] = useState(false)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [contentToDelete, setContentToDelete] = useState(null)
  const [statusModalVisible, setStatusModalVisible] = useState(false)
  const [targetStatus, setTargetStatus] = useState('published')
  
  // 获取内容列表
  const { 
    data: contentListData, 
    isLoading, 
    error 
  } = useUserContentList(filters)
  
  // 删除内容
  const deleteContent = useDeleteContent()
  
  // 批量更新状态
  const batchUpdateStatus = useBatchUpdateStatus()
  
  // 批量添加标签
  const batchAddTags = useBatchAddTags()
  
  // 处理筛选变更
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value : 1 // 如果不是切换页码，则重置为第一页
    }))
  }
  
  // 处理表格行选择
  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys) => {
      setSelectedRowKeys(selectedKeys)
    }
  }
  
  // 处理删除单个内容
  const handleDelete = (record) => {
    setContentToDelete(record)
    setDeleteModalVisible(true)
  }
  
  // 确认删除
  const confirmDelete = async () => {
    try {
      await deleteContent.mutateAsync(contentToDelete._id)
      message.success('内容已删除')
      setDeleteModalVisible(false)
      setContentToDelete(null)
    } catch (err) {
      message.error('删除失败：' + err.message)
    }
  }
  
  // 处理批量更新状态
  const handleBatchUpdateStatus = (status) => {
    setTargetStatus(status)
    setStatusModalVisible(true)
  }
  
  // 确认批量更新状态
  const confirmBatchUpdateStatus = async () => {
    try {
      await batchUpdateStatus.mutateAsync({
        contentIds: selectedRowKeys,
        status: targetStatus
      })
      setStatusModalVisible(false)
      setSelectedRowKeys([])
    } catch (err) {
      message.error('更新状态失败：' + err.message)
    }
  }
  
  // 处理批量添加标签
  const handleBatchAddTags = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请至少选择一个内容')
      return
    }
    setTagsModalVisible(true)
  }
  
  // 确认添加标签
  const confirmAddTags = async (tags) => {
    try {
      await batchAddTags.mutateAsync({
        contentIds: selectedRowKeys,
        tags
      })
      setTagsModalVisible(false)
      setSelectedRowKeys([])
    } catch (err) {
      message.error('添加标签失败：' + err.message)
    }
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
      title: '缩略图',
      dataIndex: 'files',
      key: 'thumbnail',
      width: 100,
      render: (files) => (
        <div className="content-thumbnail">
          <img 
            src={files?.thumbnail?.url || '/placeholder-image.png'} 
            alt="缩略图" 
          />
        </div>
      )
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (title, record) => (
        <div>
          <div className="content-title">{title['zh-CN']}</div>
          <div className="content-type">
            <Tag>{getContentTypeLabel(record.contentType)}</Tag>
            {record.isCollaborative && <Tag color="purple">协作</Tag>}
          </div>
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => <ContentStatusTag status={status} />
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
      title: '数据',
      key: 'stats',
      width: 120,
      render: (_, record) => (
        <div>
          <div className="stat-item">
            <span className="stat-label">观看:</span> 
            <span className="stat-value">{record.stats?.views || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">点赞:</span> 
            <span className="stat-value">{record.stats?.likes || 0}</span>
          </div>
        </div>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Dropdown
          overlay={
            <Menu>
              <Menu.Item key="edit" icon={<EditOutlined />} onClick={() => navigate(`/content/edit/${record._id}`)}>
                编辑
              </Menu.Item>
              <Menu.Item key="preview" icon={<EyeOutlined />}>
                预览
              </Menu.Item>
              <Menu.Item key="analytics" icon={<BarChartOutlined />} onClick={() => navigate(`/analytics/content/${record._id}`)}>
                查看分析
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item key="copy" icon={<CopyOutlined />}>
                复制
              </Menu.Item>
              <Menu.Item key="delete" icon={<DeleteOutlined />} danger onClick={() => handleDelete(record)}>
                删除
              </Menu.Item>
            </Menu>
          }
          trigger={['click']}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      )
    }
  ]
  
  // 批量操作菜单
  const batchOperationsMenu = (
    <Menu>
      <Menu.Item key="publish" icon={<CheckOutlined />} onClick={() => handleBatchUpdateStatus('published')}>
        发布
      </Menu.Item>
      <Menu.Item key="draft" icon={<EditOutlined />} onClick={() => handleBatchUpdateStatus('draft')}>
        设为草稿
      </Menu.Item>
      <Menu.Item key="archive" icon={<DownloadOutlined />} onClick={() => handleBatchUpdateStatus('archived')}>
        归档
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="tags" icon={<TagsOutlined />} onClick={handleBatchAddTags}>
        添加标签
      </Menu.Item>
    </Menu>
  )
  
  // 卡片视图
  const renderCardView = () => {
    const contents = contentListData?.data?.data || []
    
    return (
      <Row gutter={[16, 16]} className="content-card-grid">
        {contents.map(content => (
          <Col xs={24} sm={12} md={8} lg={6} xl={6} key={content._id}>
            <Card
              className="content-card"
              cover={
                <div className="card-thumbnail">
                  <img 
                    alt={content.title['zh-CN']} 
                    src={content.files?.thumbnail?.url || '/placeholder-image.png'} 
                  />
                  <div className="card-status">
                    <ContentStatusTag status={content.status} />
                  </div>
                </div>
              }
              bodyStyle={{ padding: '12px' }}
              actions={[
                <Tooltip title="编辑">
                  <EditOutlined key="edit" onClick={() => navigate(`/content/edit/${content._id}`)} />
                </Tooltip>,
                <Tooltip title="预览">
                  <EyeOutlined key="preview" />
                </Tooltip>,
                <Tooltip title="查看分析">
                  <BarChartOutlined key="analytics" onClick={() => navigate(`/analytics/content/${content._id}`)} />
                </Tooltip>,
                <Dropdown
                  key="more"
                  overlay={
                    <Menu>
                      <Menu.Item key="copy" icon={<CopyOutlined />}>
                        复制
                      </Menu.Item>
                      <Menu.Item key="delete" icon={<DeleteOutlined />} danger onClick={() => handleDelete(content)}>
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
              <div className="card-content">
                <div className="card-title">{content.title['zh-CN']}</div>
                <div className="card-info">
                  <Tag>{getContentTypeLabel(content.contentType)}</Tag>
                  <div className="card-stats">
                    <span>{content.stats?.views || 0} 次观看</span>
                    <span>{content.stats?.likes || 0} 次点赞</span>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    )
  }
  
  return (
    <div className="content-list-page">
      <div className="page-header">
        <h1>内容管理</h1>
        <Link to="/content/create">
          <Button type="primary" icon={<PlusOutlined />}>创建新内容</Button>
        </Link>
      </div>
      
      <Card>
        {/* 筛选工具栏 */}
        <div className="filter-toolbar">
          <div className="search-filter">
            <Input
              placeholder="搜索内容..."
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              allowClear
            />
          </div>
          
          <div className="dropdown-filters">
            <Select
              placeholder="状态"
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
              allowClear
              style={{ width: 120 }}
            >
              <Option value="draft">草稿</Option>
              <Option value="pending_review">待审核</Option>
              <Option value="published">已发布</Option>
              <Option value="rejected">已拒绝</Option>
              <Option value="archived">已归档</Option>
            </Select>
            
            <Select
              placeholder="内容类型"
              value={filters.contentType}
              onChange={(value) => handleFilterChange('contentType', value)}
              allowClear
              style={{ width: 120 }}
            >
              <Option value="180_video">180° 视频</Option>
              <Option value="360_video">360° 视频</Option>
              <Option value="180_photo">180° 照片</Option>
              <Option value="360_photo">360° 照片</Option>
              <Option value="spatial_video">空间视频</Option>
              <Option value="spatial_photo">空间照片</Option>
            </Select>
            
            <Select
              placeholder="排序"
              value={filters.sort}
              onChange={(value) => handleFilterChange('sort', value)}
              style={{ width: 150 }}
            >
              <Option value="-createdAt">最新创建</Option>
              <Option value="createdAt">最早创建</Option>
              <Option value="-stats.views">最多观看</Option>
              <Option value="-stats.likes">最多点赞</Option>
            </Select>
          </div>
          
          <div className="view-toggle">
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
        
        {/* 批量操作工具栏 */}
        {selectedRowKeys.length > 0 && (
          <div className="batch-toolbar">
            <div className="batch-info">
              <Checkbox
                indeterminate={selectedRowKeys.length > 0 && selectedRowKeys.length < (contentListData?.data?.data?.length || 0)}
                checked={selectedRowKeys.length > 0 && selectedRowKeys.length === (contentListData?.data?.data?.length || 0)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedRowKeys((contentListData?.data?.data || []).map(item => item._id))
                  } else {
                    setSelectedRowKeys([])
                  }
                }}
              />
              <span>已选择 {selectedRowKeys.length} 项</span>
            </div>
            
            <div className="batch-actions">
              <Dropdown overlay={batchOperationsMenu} trigger={['click']}>
                <Button>
                  <Space>批量操作<DownloadOutlined /></Space>
                </Button>
              </Dropdown>
              
              <Button onClick={() => setSelectedRowKeys([])}>取消选择</Button>
            </div>
          </div>
        )}
        
        {/* 内容列表 */}
        {isLoading ? (
          <div className="loading-container">
            <Spin size="large" />
          </div>
        ) : error ? (
          <div className="error-container">
            <p>加载失败: {error.message}</p>
            <Button onClick={() => setFilters({ ...filters })}>重试</Button>
          </div>
        ) : viewMode === 'table' ? (
          <Table
            rowSelection={rowSelection}
            columns={columns}
            dataSource={contentListData?.data?.data || []}
            rowKey="_id"
            pagination={false}
            className="content-table"
          />
        ) : (
          renderCardView()
        )}
        
        {/* 分页控件 */}
        {!isLoading && !error && (contentListData?.data?.pagination?.total > 0) && (
          <div className="pagination-container">
            <Pagination
              current={filters.page}
              pageSize={filters.limit}
              total={contentListData?.data?.pagination?.total || 0}
              showSizeChanger
              showQuickJumper
              showTotal={(total) => `共 ${total} 项`}
              onChange={(page) => handleFilterChange('page', page)}
              onShowSizeChange={(_, size) => handleFilterChange('limit', size)}
            />
          </div>
        )}
      </Card>
      
      {/* 删除确认对话框 */}
      <Modal
        title="确认删除"
        open={deleteModalVisible}
        onOk={confirmDelete}
        onCancel={() => {
          setDeleteModalVisible(false)
          setContentToDelete(null)
        }}
        confirmLoading={deleteContent.isLoading}
      >
        <p>确定要删除 "{contentToDelete?.title['zh-CN']}" 吗？此操作不可恢复。</p>
      </Modal>
      
      {/* 批量更新状态确认对话框 */}
      <Modal
        title="批量更新状态"
        open={statusModalVisible}
        onOk={confirmBatchUpdateStatus}
        onCancel={() => setStatusModalVisible(false)}
        confirmLoading={batchUpdateStatus.isLoading}
      >
        <p>确定要将选中的 {selectedRowKeys.length} 个内容更新为
        {targetStatus === 'published' ? '已发布' : 
         targetStatus === 'draft' ? '草稿' : 
         targetStatus === 'archived' ? '已归档' : targetStatus} 状态吗？</p>
      </Modal>
      
      {/* 标签编辑对话框 */}
      <TagsEditModal
        visible={tagsModalVisible}
        onCancel={() => setTagsModalVisible(false)}
        onConfirm={confirmAddTags}
        loading={batchAddTags.isLoading}
      />
    </div>
  )
}

export default ContentListPage
