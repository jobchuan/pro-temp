// src/pages/collaboration/CollaborationDetailPage.jsx
import React, { useState } from 'react'
import { 
  Card, 
  Button, 
  Tabs, 
  Avatar, 
  Tag, 
  Space, 
  Dropdown, 
  Menu, 
  List,
  Table,
  Timeline,
  Tooltip,
  Modal,
  Form,
  Input,
  Select,
  message,
  Spin,
  Empty,
  Descriptions,
  Typography,
  Divider,
  Popconfirm
} from 'antd'
import { 
  TeamOutlined, 
  UserOutlined, 
  EditOutlined, 
  EyeOutlined, 
  MoreOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  UserAddOutlined,
  MailOutlined,
  FileTextOutlined,
  HistoryOutlined,
  MessageOutlined,
  PlusOutlined,
  SettingOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { collaborationApiService } from '@/services/api/collaborationService'
import './CollaborationDetailPage.less'

const { TabPane } = Tabs
const { Title, Paragraph, Text } = Typography
const { Option } = Select

const CollaborationDetailPage = () => {
  const { collaborationId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('overview')
  const [inviteModalVisible, setInviteModalVisible] = useState(false)
  const [messageModalVisible, setMessageModalVisible] = useState(false)
  const [inviteForm] = Form.useForm()
  const [messageForm] = Form.useForm()
  
  // 获取协作详情
  const { 
    data: collaborationData, 
    isLoading, 
    error 
  } = useQuery(
    ['collaborationDetail', collaborationId],
    () => collaborationApiService.getCollaborationDetail(collaborationId),
    {
      enabled: !!collaborationId,
      refetchOnWindowFocus: false
    }
  )
  
  // 获取协作者列表
  const { 
    data: collaboratorsData,
    isLoading: isCollaboratorsLoading
  } = useQuery(
    ['collaborationCollaborators', collaborationId],
    () => collaborationApiService.getCollaborators(collaborationId),
    {
      enabled: !!collaborationId && activeTab === 'collaborators',
      refetchOnWindowFocus: false
    }
  )
  
  // 获取协作内容列表
  const {
    data: contentsData,
    isLoading: isContentsLoading
  } = useQuery(
    ['collaborationContents', collaborationId],
    () => collaborationApiService.getCollaborationContents(collaborationId),
    {
      enabled: !!collaborationId && activeTab === 'contents',
      refetchOnWindowFocus: false
    }
  )
  
  // 获取活动历史
  const {
    data: activitiesData,
    isLoading: isActivitiesLoading
  } = useQuery(
    ['collaborationActivities', collaborationId],
    () => collaborationApiService.getCollaborationActivities(collaborationId),
    {
      enabled: !!collaborationId && activeTab === 'activities',
      refetchOnWindowFocus: false
    }
  )
  
  // 添加协作者mutation
  const inviteMutation = useMutation(
    (data) => collaborationApiService.inviteCollaborator({ ...data, collaborationId }),
    {
      onSuccess: () => {
        message.success('邀请已发送')
        setInviteModalVisible(false)
        inviteForm.resetFields()
        queryClient.invalidateQueries(['collaborationCollaborators', collaborationId])
      },
      onError: (error) => {
        message.error('邀请失败: ' + error.message)
      }
    }
  )
  
  // 发送消息mutation
  const messageMutation = useMutation(
    (data) => collaborationApiService.sendMessage({ ...data, collaborationId }),
    {
      onSuccess: () => {
        message.success('消息已发送')
        setMessageModalVisible(false)
        messageForm.resetFields()
        queryClient.invalidateQueries(['collaborationActivities', collaborationId])
      },
      onError: (error) => {
        message.error('发送失败: ' + error.message)
      }
    }
  )
  
  // 移除协作者mutation
  const removeCollaboratorMutation = useMutation(
    ({collaboratorId}) => collaborationApiService.removeCollaborator(collaborationId, collaboratorId),
    {
      onSuccess: () => {
        message.success('协作者已移除')
        queryClient.invalidateQueries(['collaborationCollaborators', collaborationId])
      },
      onError: (error) => {
        message.error('移除失败: ' + error.message)
      }
    }
  )
  
  // 更新协作者角色mutation
  const updateRoleMutation = useMutation(
    ({collaboratorId, role}) => collaborationApiService.updateCollaboratorRole(collaborationId, collaboratorId, role),
    {
      onSuccess: () => {
        message.success('角色已更新')
        queryClient.invalidateQueries(['collaborationCollaborators', collaborationId])
      },
      onError: (error) => {
        message.error('更新失败: ' + error.message)
      }
    }
  )
  
  // 更新协作状态mutation
  const updateStatusMutation = useMutation(
    (status) => collaborationApiService.updateCollaborationStatus(collaborationId, status),
    {
      onSuccess: () => {
        message.success('状态已更新')
        queryClient.invalidateQueries(['collaborationDetail', collaborationId])
      },
      onError: (error) => {
        message.error('更新失败: ' + error.message)
      }
    }
  )
  
  // 处理邀请提交
  const handleInviteSubmit = (values) => {
    inviteMutation.mutate(values)
  }
  
  // 处理消息提交
  const handleMessageSubmit = (values) => {
    messageMutation.mutate(values)
  }
  
  // 处理移除协作者
  const handleRemoveCollaborator = (collaboratorId) => {
    removeCollaboratorMutation.mutate({ collaboratorId })
  }
  
  // 处理更新角色
  const handleRoleChange = (collaboratorId, role) => {
    updateRoleMutation.mutate({ collaboratorId, role })
  }
  
  // 处理更新状态
  const handleStatusChange = (status) => {
    updateStatusMutation.mutate(status)
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
  
  // 渲染协作者列表
  const renderCollaborators = () => {
    if (isCollaboratorsLoading) {
      return (
        <div className="loading-container">
          <Spin size="large" />
        </div>
      )
    }
    
    const collaborators = collaboratorsData?.data || []
    const collaboration = collaborationData?.data
    const isOwner = collaboration?.myRole === 'owner'
    
    return (
      <div className="collaborators-container">
        <div className="section-header">
          <h3>协作者 ({collaborators.length})</h3>
          {isOwner && (
            <Button 
              type="primary" 
              icon={<UserAddOutlined />}
              onClick={() => setInviteModalVisible(true)}
            >
              邀请协作者
            </Button>
          )}
        </div>
        
        <List
          dataSource={collaborators}
          renderItem={item => (
            <List.Item
              key={item.id}
              actions={isOwner && item.role !== 'owner' ? [
                <Dropdown
                  overlay={
                    <Menu>
                      <Menu.SubMenu key="role" title="修改角色">
                        <Menu.Item 
                          key="editor" 
                          onClick={() => handleRoleChange(item.id, 'editor')}
                          disabled={item.role === 'editor'}
                        >
                          <EditOutlined /> 编辑者
                        </Menu.Item>
                        <Menu.Item 
                          key="viewer" 
                          onClick={() => handleRoleChange(item.id, 'viewer')}
                          disabled={item.role === 'viewer'}
                        >
                          <EyeOutlined /> 查看者
                        </Menu.Item>
                      </Menu.SubMenu>
                      <Menu.Divider />
                      <Menu.Item 
                        key="remove" 
                        danger 
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveCollaborator(item.id)}
                      >
                        移除协作者
                      </Menu.Item>
                    </Menu>
                  }
                  trigger={['click']}
                >
                  <Button type="text" icon={<MoreOutlined />} />
                </Dropdown>
              ] : []}
            >
              <List.Item.Meta
                avatar={
                  <Avatar 
                    src={item.avatar} 
                    icon={!item.avatar && <UserOutlined />}
                    size="large"
                    style={{ 
                      backgroundColor: !item.avatar && generateAvatarColor(item.name) 
                    }}
                  >
                    {!item.avatar && item.name?.charAt(0)}
                  </Avatar>
                }
                title={
                  <Space>
                    <span className="collaborator-name">{item.name}</span>
                    {getRoleTag(item.role)}
                    {item.status === 'pending' && (
                      <Tag color="orange">待确认</Tag>
                    )}
                  </Space>
                }
                description={
                  <div className="collaborator-info">
                    <div className="collaborator-email">{item.email}</div>
                    <div className="collaborator-joined">加入时间: {formatDate(item.joinedAt)}</div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </div>
    )
  }
  
  // 渲染协作内容列表
  const renderContents = () => {
    if (isContentsLoading) {
      return (
        <div className="loading-container">
          <Spin size="large" />
        </div>
      )
    }
    
    const contents = contentsData?.data || []
    const collaboration = collaborationData?.data
    const canEdit = ['owner', 'editor'].includes(collaboration?.myRole)
    
    // 内容类型标签
    const getContentTypeTag = (type) => {
      const types = {
        '180_video': { color: 'magenta', text: '180° 视频' },
        '360_video': { color: 'magenta', text: '360° 视频' },
        '180_photo': { color: 'purple', text: '180° 照片' },
        '360_photo': { color: 'purple', text: '360° 照片' },
        'spatial_video': { color: 'magenta', text: '空间视频' },
        'spatial_photo': { color: 'purple', text: '空间照片' }
      }
      
      const typeInfo = types[type] || { color: 'default', text: type }
      return <Tag color={typeInfo.color}>{typeInfo.text}</Tag>
    }
    
    const columns = [
      {
        title: '内容名称',
        dataIndex: 'title',
        key: 'title',
        render: (text, record) => (
          <div className="content-info">
            <img 
              src={record.thumbnail || '/placeholder-image.png'} 
              alt={text} 
              className="content-thumbnail" 
            />
            <div className="content-meta">
              <div className="content-title">
                <Link to={`/content/edit/${record.id}`}>{text}</Link>
              </div>
              <div className="content-type">
                {getContentTypeTag(record.contentType)}
              </div>
            </div>
          </div>
        )
      },
      {
        title: '创建者',
        dataIndex: 'creator',
        key: 'creator',
        width: 150,
        render: (creator) => (
          <div className="creator-info">
            <Avatar 
              src={creator?.avatar} 
              icon={!creator?.avatar && <UserOutlined />}
              size="small"
              style={{ 
                backgroundColor: !creator?.avatar && generateAvatarColor(creator?.name) 
              }}
            />
            <span className="creator-name">{creator?.name}</span>
          </div>
        )
      },
      {
        title: '更新时间',
        dataIndex: 'updatedAt',
        key: 'updatedAt',
        width: 120,
        render: (date) => formatDate(date)
      },
      {
        title: '权限',
        dataIndex: 'permission',
        key: 'permission',
        width: 100,
        render: (permission) => {
          switch (permission) {
            case 'edit':
              return <Tag color="blue" icon={<EditOutlined />}>可编辑</Tag>
            case 'view':
              return <Tag color="green" icon={<EyeOutlined />}>可查看</Tag>
            default:
              return <Tag>{permission}</Tag>
          }
        }
      },
      {
        title: '操作',
        key: 'action',
        width: 120,
        render: (_, record) => (
          <Space>
            {record.permission === 'edit' ? (
              <Button 
                type="link" 
                icon={<EditOutlined />}
                onClick={() => navigate(`/content/edit/${record.id}`)}
              >
                编辑
              </Button>
            ) : (
              <Button 
                type="link" 
                icon={<EyeOutlined />}
                onClick={() => navigate(`/content/view/${record.id}`)}
              >
                查看
              </Button>
            )}
          </Space>
        )
      }
    ]
    
    return (
      <div className="contents-container">
        <div className="section-header">
          <h3>协作内容 ({contents.length})</h3>
          {canEdit && (
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => navigate('/content/create', { state: { collaborationId } })}
            >
              添加内容
            </Button>
          )}
        </div>
        
        {contents.length === 0 ? (
          <Empty 
            description={
              <span>
                暂无协作内容
                {canEdit && (
                  <Button 
                    type="link" 
                    onClick={() => navigate('/content/create', { state: { collaborationId } })}
                  >
                    添加内容
                  </Button>
                )}
              </span>
            } 
          />
        ) : (
          <Table
            columns={columns}
            dataSource={contents}
            rowKey="id"
            pagination={false}
          />
        )}
      </div>
    )
  }
  
  // 渲染活动历史
  const renderActivities = () => {
    if (isActivitiesLoading) {
      return (
        <div className="loading-container">
          <Spin size="large" />
        </div>
      )
    }
    
    const activities = activitiesData?.data || []
    
    return (
      <div className="activities-container">
        <div className="section-header">
          <h3>活动历史</h3>
          <Button 
            type="primary" 
            icon={<MessageOutlined />}
            onClick={() => setMessageModalVisible(true)}
          >
            发送消息
          </Button>
        </div>
        
        <Timeline>
          {activities.map(activity => (
            <Timeline.Item 
              key={activity.id}
              dot={getActivityIcon(activity.type)}
              color={getActivityColor(activity.type)}
            >
              <div className="activity-item">
                <div className="activity-header">
                  <span className="activity-user">{activity.user.name}</span>
                  <span className="activity-time">{formatDateTime(activity.timestamp)}</span>
                </div>
                <div className="activity-content">
                  {activity.type === 'message' ? (
                    <div className="message-content">
                      {activity.content}
                    </div>
                  ) : (
                    <div className="action-content">
                      {getActivityDescription(activity)}
                    </div>
                  )}
                </div>
              </div>
            </Timeline.Item>
          ))}
          
          {activities.length === 0 && (
            <Empty description="暂无活动记录" />
          )}
        </Timeline>
      </div>
    )
  }
  
  // 获取活动图标
  const getActivityIcon = (type) => {
    switch (type) {
      case 'create':
        return <PlusOutlined />
      case 'update':
        return <EditOutlined />
      case 'invite':
        return <UserAddOutlined />
      case 'join':
        return <TeamOutlined />
      case 'leave':
        return <DeleteOutlined />
      case 'message':
        return <MessageOutlined />
      case 'content_add':
        return <FileTextOutlined />
      case 'status_change':
        return <CheckCircleOutlined />
      default:
        return <HistoryOutlined />
    }
  }
  
  // 获取活动颜色
  const getActivityColor = (type) => {
    switch (type) {
      case 'create':
      case 'content_add':
        return 'green'
      case 'update':
        return 'blue'
      case 'invite':
      case 'join':
        return 'purple'
      case 'leave':
        return 'red'
      case 'message':
        return 'blue'
      case 'status_change':
        return 'orange'
      default:
        return 'gray'
    }
  }
  
  // 获取活动描述
  const getActivityDescription = (activity) => {
    switch (activity.type) {
      case 'create':
        return '创建了协作项目'
      case 'update':
        return '更新了协作项目'
      case 'invite':
        return `邀请 ${activity.targetUser?.name || activity.data?.email} 加入协作`
      case 'join':
        return '加入了协作项目'
      case 'leave':
        return '离开了协作项目'
      case 'content_add':
        return `添加了内容 "${activity.data?.contentTitle}"`
      case 'status_change':
        return `将状态修改为 "${getStatusText(activity.data?.status)}"`
      default:
        return '进行了操作'
    }
  }
  
  // 获取状态文本
  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return '进行中'
      case 'pending':
        return '等待确认'
      case 'completed':
        return '已完成'
      case 'canceled':
        return '已取消'
      default:
        return status
    }
  }
  
  // 格式化日期
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }
  
  // 格式化日期时间
  const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    return `${formatDate(dateString)} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }
  
  // 渲染概览
  const renderOverview = () => {
    if (isLoading || !collaborationData?.data) {
      return (
        <div className="loading-container">
          <Spin size="large" />
        </div>
      )
    }
    
    const collaboration = collaborationData.data
    const isOwner = collaboration.myRole === 'owner'
    
    return (
      <div className="overview-container">
        <Card className="info-card">
          <Descriptions 
            title="协作信息" 
            bordered 
            column={{ xxl: 3, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}
            extra={
              isOwner && (
                <Button 
                  type="primary" 
                  icon={<EditOutlined />}
                  onClick={() => navigate(`/collaboration/${collaborationId}/edit`)}
                >
                  编辑协作
                </Button>
              )
            }
          >
            <Descriptions.Item label="协作类型">{getTypeTag(collaboration.type)}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{formatDate(collaboration.createdAt)}</Descriptions.Item>
            <Descriptions.Item label="更新时间">{formatDate(collaboration.updatedAt)}</Descriptions.Item>
            <Descriptions.Item label="协作状态">
              {getStatusTag(collaboration.status)}
              {isOwner && (
                <Dropdown
                  overlay={
                    <Menu>
                      <Menu.Item 
                        key="active" 
                        icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                        disabled={collaboration.status === 'active'}
                        onClick={() => handleStatusChange('active')}
                      >
                        进行中
                      </Menu.Item>
                      <Menu.Item 
                        key="completed" 
                        icon={<CheckCircleOutlined />}
                        disabled={collaboration.status === 'completed'}
                        onClick={() => handleStatusChange('completed')}
                      >
                        已完成
                      </Menu.Item>
                      <Menu.Item 
                        key="canceled" 
                        icon={<CloseCircleOutlined />}
                        disabled={collaboration.status === 'canceled'}
                        onClick={() => handleStatusChange('canceled')}
                      >
                        已取消
                      </Menu.Item>
                    </Menu>
                  }
                  trigger={['click']}
                >
                  <Button type="link" size="small" icon={<EditOutlined />}>修改状态</Button>
                </Dropdown>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="我的角色">{getRoleTag(collaboration.myRole)}</Descriptions.Item>
            <Descriptions.Item label="协作者数量">{collaboration.collaboratorCount || 0} 人</Descriptions.Item>
            <Descriptions.Item label="内容数量">
              {collaboration.contentCount || 0} 个
              {collaboration.contentCount > 0 && (
                <Button 
                  type="link" 
                  size="small"
                  onClick={() => setActiveTab('contents')}
                >
                  查看内容
                </Button>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="创建者">
              <div className="creator-info">
                <Avatar 
                  src={collaboration.creator?.avatar} 
                  icon={!collaboration.creator?.avatar && <UserOutlined />}
                  size="small"
                  style={{ 
                    backgroundColor: !collaboration.creator?.avatar && generateAvatarColor(collaboration.creator?.name) 
                  }}
                />
                <span className="creator-name">{collaboration.creator?.name}</span>
              </div>
            </Descriptions.Item>
          </Descriptions>
          
          <Divider />
          
          <div className="description-section">
            <Title level={5}>协作描述</Title>
            <Paragraph>
              {collaboration.description || '暂无描述'}
            </Paragraph>
          </div>
          
          {collaboration.notes && (
            <>
              <Divider />
              <div className="notes-section">
                <Title level={5}>协作备注</Title>
                <Paragraph>
                  {collaboration.notes}
                </Paragraph>
              </div>
            </>
          )}
        </Card>
        
        <div className="action-buttons">
          {isOwner && (
            <>
              <Button 
                icon={<UserAddOutlined />}
                onClick={() => setInviteModalVisible(true)}
              >
                邀请协作者
              </Button>
              <Button 
                icon={<MessageOutlined />}
                onClick={() => setMessageModalVisible(true)}
              >
                发送消息
              </Button>
              {collaboration.type === 'content' && (
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => navigate('/content/create', { state: { collaborationId } })}
                >
                  添加内容
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    )
  }
  
  // 处理返回列表
  const handleBackToList = () => {
    navigate('/collaboration')
  }
  
  if (error) {
    return (
      <div className="error-container">
        <Empty 
          image={Empty.PRESENTED_IMAGE_SIMPLE} 
          description="加载失败，协作项目可能不存在或已被删除"
        />
        <Button type="primary" onClick={handleBackToList}>
          返回协作列表
        </Button>
      </div>
    )
  }
  
  return (
    <div className="collaboration-detail-page">
      <div className="page-header">
        <div className="header-left">
          <Button 
            type="link" 
            icon={<TeamOutlined />}
            onClick={handleBackToList}
            className="back-link"
          >
            协作管理
          </Button>
          <span className="header-separator">/</span>
          {isLoading ? (
            <Spin size="small" />
          ) : (
            <h1>{collaborationData?.data?.title}</h1>
          )}
        </div>
        
        {!isLoading && collaborationData?.data?.myRole === 'owner' && (
          <div className="header-actions">
            <Button 
              danger
              onClick={() => navigate(`/collaboration/${collaborationId}/edit`)}
            >
              结束协作
            </Button>
          </div>
        )}
      </div>
      
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        className="detail-tabs"
      >
        <TabPane tab="概览" key="overview">
          {renderOverview()}
        </TabPane>
        <TabPane tab="协作者" key="collaborators">
          {renderCollaborators()}
        </TabPane>
        <TabPane tab="协作内容" key="contents">
          {renderContents()}
        </TabPane>
        <TabPane tab="活动历史" key="activities">
          {renderActivities()}
        </TabPane>
      </Tabs>
      
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
      
      {/* 发送消息模态框 */}
      <Modal
        title="发送消息"
        open={messageModalVisible}
        onCancel={() => {
          setMessageModalVisible(false)
          messageForm.resetFields()
        }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={messageForm}
          layout="vertical"
          onFinish={handleMessageSubmit}
        >
          <Form.Item
            name="message"
            rules={[{ required: true, message: '请输入消息内容' }]}
          >
            <Input.TextArea 
              placeholder="输入消息内容..."
              rows={4}
            />
          </Form.Item>
          
          <Form.Item className="form-actions">
            <Button 
              type="default" 
              onClick={() => {
                setMessageModalVisible(false)
                messageForm.resetFields()
              }}
              style={{ marginRight: 8 }}
            >
              取消
            </Button>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={messageMutation.isLoading}
            >
              发送
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default CollaborationDetailPage