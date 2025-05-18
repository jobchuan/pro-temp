// src/pages/collaboration/CollaborationListPage.jsx
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
  Tabs
} from 'antd'
import { 
  PlusOutlined, 
  SearchOutlined, 
  TeamOutlined, 
  UserOutlined, 
  FilterOutlined,
  MoreOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  UserAddOutlined,
  ExclamationCircleOutlined,
  MailOutlined
} from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { collaborationApiService } from '@/services/api/collaborationService'
import './CollaborationListPage.less'

const { Option } = Select
const { TabPane } = Tabs

const CollaborationListPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchKeyword, setSearchKeyword] = useState('')
  const [filters, setFilters] = useState({
    status: undefined,
    role: undefined,
    page: 1,
    limit: 10
  })
  const [activeTab, setActiveTab] = useState('all')
  const [inviteModalVisible, setInviteModalVisible] = useState(false)
  const [inviteForm] = Form.useForm()
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false)
  const [collaborationToDelete, setCollaborationToDelete] = useState(null)
  
  // 获取协作项目列表
  const { 
    data: collaborationData, 
    isLoading, 
    error 
  } = useQuery(
    ['collaborationList', activeTab, filters, searchKeyword],
    () => collaborationApiService.getCollaborations({
      type: activeTab !== 'all' ? activeTab : undefined,
      status: filters.status,
      role: filters.role,
      keyword: searchKeyword,
      page: filters.page,
      limit: filters.limit
    }),
    {
      keepPreviousData: true,
      refetchOnWindowFocus: false
    }
  )
  
  // 添加协作者mutation
  const inviteMutation = useMutation(
    (data) => collaborationApiService.inviteCollaborator(data),
    {
      onSuccess: () => {
        message.success('邀请已发送')
        setInviteModalVisible(false)
        inviteForm.resetFields()
        queryClient.invalidateQueries('collaborationList')
      },
      onError: (error) => {
        message.error('邀请失败: ' + error.message)
      }
    }
  )
  
  // 删除协作项目mutation
  const deleteMutation = useMutation(
    (id) => collaborationApiService.deleteCollaboration(id),
    {
      onSuccess: () => {
        message.success('协作项目已删除')
        setConfirmDeleteVisible(false)
        setCollaborationToDelete(null)
        queryClient.invalidateQueries('collaborationList')
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
  const handleDelete = (collaboration) => {
    setCollaborationToDelete(collaboration)
    setConfirmDeleteVisible(true)
  }
  
  // 确认删除
  const confirmDelete = () => {
    deleteMutation.mutate(collaborationToDelete.id)
  }
  
  // 处理邀请提交
  const handleInviteSubmit = (values) => {
    inviteMutation.mutate(values)
  }
  
  // 获取角色标签
  const getRoleTag = (role) => {
    switch (role) {
      case 'owner':
        return <Tag color="gold">创建者</Tag>
      case 'editor':
        return <Tag color="blue">编辑者</Tag>
      case 'viewer':
        return <Tag color="green">查看者</Tag>
      default:
        return <Tag>{role}</Tag>
    }
  }
  
  // 获取状态标签
  const getStatusTag = (status) => {
    switch (status) {
      case 'active':
        return <Tag color="success" icon={<CheckCircleOutlined />}>进行中</Tag>
      case 'pending':
        return <Tag color="warning" icon={<ClockCircleOutlined />}>等待确认</Tag>
      case 'completed':
        return <Tag color="default" icon={<CheckCircleOutlined />}>已完成</Tag>
      case 'canceled':
        return <Tag color="error" icon={<CloseCircleOutlined />}>已取消</Tag>
      default:
        return <Tag>{status}</Tag>
    }
  }
  
  // 获取类型标签
  const getTypeTag = (type) => {
    switch (type) {
      case 'content':
        return <Tag color="purple">内容协作</Tag>
      case 'project':
        return <Tag color="cyan">项目协作</Tag>
      default:
        return <Tag>{type}</Tag>
    }
  }
  
  // 表格列定义
  const columns = [
    {
      title: '项目名称',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div className="collaboration-title">
          <div className="title-main">
            <Link to={`/collaboration/${record.id}`}>{text}</Link>
          </div>
          <div className="title-sub">
            {getTypeTag(record.type)}
            {record.contentCount > 0 && (
              <span className="content-count">{record.contentCount} 个内容</span>
            )}
          </div>
        </div>
      )
    },
    {
      title: '参与者',
      dataIndex: 'collaborators',
      key: 'collaborators',
      render: (collaborators = []) => (
        <div className="collaborators">
          <Avatar.Group
            maxCount={5}
            maxStyle={{ color: '#f56a00', backgroundColor: '#fde3cf' }}
          >
            {collaborators.map(user => (
              <Tooltip key={user.id} title={`${user.name} (${user.role})`}>
                <Avatar 
                  src={user.avatar} 
                  icon={!user.avatar && <UserOutlined />}
                  style={{ 
                    backgroundColor: !user.avatar && generateAvatarColor(user.name) 
                  }}
                >
                  {!user.avatar && user.name?.charAt(0)}
                </Avatar>
              </Tooltip>
            ))}
          </Avatar.Group>
        </div>
      )
    },
    {
      title: '我的角色',
      dataIndex: 'myRole',
      key: 'myRole',
      width: 100,
      render: (role) => getRoleTag(role)
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => getStatusTag(status)
    },
    {
      title: '最近更新',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 120,
      render: (date) => {
        const d = new Date(date)
        return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Space>
          <Tooltip title="查看详情">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => navigate(`/collaboration/${record.id}`)} 
            />
          </Tooltip>
          <Dropdown
            overlay={
              <Menu>
                <Menu.Item key="view" icon={<EyeOutlined />} onClick={() => navigate(`/collaboration/${record.id}`)}>
                  查看详情
                </Menu.Item>
                {record.myRole === 'owner' && (
                  <>
                    <Menu.Item key="invite" icon={<UserAddOutlined />} onClick={() => setInviteModalVisible(true)}>
                      邀请协作者
                    </Menu.Item>
                    <Menu.Item key="edit" icon={<EditOutlined />} onClick={() => navigate(`/collaboration/${record.id}/edit`)}>
                      编辑协作
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item key="delete" icon={<DeleteOutlined />} danger onClick={() => handleDelete(record)}>
                      删除协作
                    </Menu.Item>
                  </>
                )}
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
  
  // 生成头像背景色
  const generateAvatarColor = (name) => {
    const colors = [
      '#f56a00', '#7265e6', '#ffbf00', '#00a2ae',
      '#1890ff', '#52c41a', '#722ed1', '#eb2f96'
    ]
    
    // 简单的哈希函数
    let hash = 0
    for (let i = 0; i < name?.length || 0; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    
    return colors[Math.abs(hash) % colors.length]
  }
  
  return (
    <div className="collaboration-list-page">
      <div className="page-header">
        <h1>协作管理</h1>
        <div className="header-actions">
          <Input.Search
            placeholder="搜索协作项目"
            allowClear
            onSearch={handleSearch}
            style={{ width: 250, marginRight: 16 }}
          />
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => navigate('/collaboration/create')}
          >
            创建协作
          </Button>
        </div>
      </div>
      
      <Card>
        <div className="filter-toolbar">
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
          >
            <TabPane tab="全部" key="all" />
            <TabPane tab="内容协作" key="content" />
            <TabPane tab="项目协作" key="project" />
          </Tabs>
          
          <div className="filter-actions">
            <Select
              placeholder="状态筛选"
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
              allowClear
              style={{ width: 120, marginRight: 8 }}
            >
              <Option value="active">进行中</Option>
              <Option value="pending">等待确认</Option>
              <Option value="completed">已完成</Option>
              <Option value="canceled">已取消</Option>
            </Select>
            
            <Select
              placeholder="角色筛选"
              value={filters.role}
              onChange={(value) => handleFilterChange('role', value)}
              allowClear
              style={{ width: 120 }}
            >
              <Option value="owner">创建者</Option>
              <Option value="editor">编辑者</Option>
              <Option value="viewer">查看者</Option>
            </Select>
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
            <Button type="primary" style={{ marginTop: 16 }} onClick={() => queryClient.invalidateQueries('collaborationList')}>
              重新加载
            </Button>
          </div>
        ) : collaborationData?.data?.items?.length === 0 ? (
          <Empty description={(
            <span>
              暂无协作项目 
              <Button 
                type="link" 
                onClick={() => navigate('/collaboration/create')}
              >
                创建协作
              </Button>
            </span>
          )} />
        ) : (
          <Table
            columns={columns}
            dataSource={collaborationData?.data?.items || []}
            rowKey="id"
            pagination={{
              current: filters.page,
              pageSize: filters.limit,
              total: collaborationData?.data?.pagination?.total || 0,
              showSizeChanger: true,
              showQuickJumper: true,
              onChange: (page) => handleFilterChange('page', page),
              onShowSizeChange: (_, size) => handleFilterChange('limit', size)
            }}
          />
        )}
      </Card>
      
      {/* 邀请协作者模态框 */}
      <Modal
        title="邀请协作者"
        open={inviteModalVisible}
        onCancel={() => {
          setInviteModalVisible(false)
          inviteForm.resetFields()
        }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={inviteForm}
          layout="vertical"
          onFinish={handleInviteSubmit}
        >
          <Form.Item
            name="collaborationId"
            initialValue={collaborationToDelete?.id}
            hidden
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="email"
            label="邮箱地址"
            rules={[
              { required: true, message: '请输入邮箱地址' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="请输入协作者邮箱" />
          </Form.Item>
          
          <Form.Item
            name="role"
            label="协作角色"
            rules={[{ required: true, message: '请选择协作角色' }]}
            initialValue="editor"
          >
            <Select>
              <Option value="editor">
                <span className="role-option">
                  <EditOutlined /> 编辑者
                </span>
                <div className="role-description">可以编辑和查看内容</div>
              </Option>
              <Option value="viewer">
                <span className="role-option">
                  <EyeOutlined /> 查看者
                </span>
                <div className="role-description">只能查看内容，不能编辑</div>
              </Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="message"
            label="邀请信息"
          >
            <Input.TextArea 
              placeholder="可选：添加邀请信息"
              rows={3}
            />
          </Form.Item>
          
          <Form.Item className="form-actions">
            <Button 
              type="default" 
              onClick={() => {
                setInviteModalVisible(false)
                inviteForm.resetFields()
              }}
              style={{ marginRight: 8 }}
            >
              取消
            </Button>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={inviteMutation.isLoading}
            >
              发送邀请
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* 删除确认对话框 */}
      <Modal
        title="确认删除"
        open={confirmDeleteVisible}
        onOk={confirmDelete}
        onCancel={() => {
          setConfirmDeleteVisible(false)
          setCollaborationToDelete(null)
        }}
        okText="确认删除"
        cancelText="取消"
        okButtonProps={{ danger: true, loading: deleteMutation.isLoading }}
      >
        <div className="delete-confirmation">
          <ExclamationCircleOutlined className="warning-icon" />
          <p>确定要删除协作项目 "{collaborationToDelete?.title}" 吗？</p>
          <p className="warning-text">此操作无法撤销，项目中的协作内容将被移除协作关系。</p>
        </div>
      </Modal>
    </div>
  )
}

export default CollaborationListPage