// src/pages/comment/CommentManagementPage.jsx
import React, { useState } from 'react'
import { 
  Card, 
  Table, 
  Button, 
  Input, 
  Select, 
  Space, 
  Tag, 
  Avatar, 
  Tooltip, 
  Modal,
  Form, 
  Radio, 
  Spin, 
  Empty, 
  message,
  Tabs,
  Typography,
  Popover,
  Menu,
  Dropdown,
  Popconfirm,
  Drawer,
  List
} from 'antd'
import { 
  SearchOutlined, 
  UserOutlined, 
  FilterOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  EyeOutlined,
  MessageOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
  LikeOutlined,
  DislikeOutlined,
  FlagOutlined,
  MoreOutlined,
  StarOutlined,
  StarFilled,
  LinkOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined
} from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { commentApiService } from '@/services/api/commentService'
import './CommentManagementPage.less'

const { Option } = Select
const { TabPane } = Tabs
const { TextArea } = Input
const { Title, Text, Paragraph } = Typography

const CommentManagementPage = () => {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState({
    status: undefined,
    contentId: undefined,
    keyword: '',
    page: 1,
    limit: 10,
    sort: 'createdAt',
    order: 'desc'
  })
  const [activeTab, setActiveTab] = useState('all')
  const [replyForm] = Form.useForm()
  const [replyModalVisible, setReplyModalVisible] = useState(false)
  const [selectedComment, setSelectedComment] = useState(null)
  const [commentDetailVisible, setCommentDetailVisible] = useState(false)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [commentToDelete, setCommentToDelete] = useState(null)
  const [reportDrawerVisible, setReportDrawerVisible] = useState(false)
  const [reportedComment, setReportedComment] = useState(null)
  
  // 获取评论列表
  const { 
    data: commentsData, 
    isLoading, 
    error 
  } = useQuery(
    ['commentsList', activeTab, filters],
    () => commentApiService.getComments({
      type: activeTab !== 'all' ? activeTab : undefined,
      status: filters.status,
      contentId: filters.contentId,
      keyword: filters.keyword,
      page: filters.page,
      limit: filters.limit,
      sort: filters.sort,
      order: filters.order
    }),
    {
      keepPreviousData: true,
      refetchOnWindowFocus: false
    }
  )
  
  // 获取评论详情
  const {
    data: commentDetailData,
    isLoading: isCommentDetailLoading
  } = useQuery(
    ['commentDetail', selectedComment?.id],
    () => commentApiService.getCommentDetail(selectedComment?.id),
    {
      enabled: !!selectedComment?.id && commentDetailVisible,
      refetchOnWindowFocus: false
    }
  )
  
  // 获取举报详情
  const {
    data: reportData,
    isLoading: isReportLoading
  } = useQuery(
    ['commentReports', reportedComment?.id],
    () => commentApiService.getCommentReports(reportedComment?.id),
    {
      enabled: !!reportedComment?.id && reportDrawerVisible,
      refetchOnWindowFocus: false
    }
  )
  
  // 回复评论mutation
  const replyCommentMutation = useMutation(
    (data) => commentApiService.replyComment(data),
    {
      onSuccess: () => {
        message.success('回复已发送')
        setReplyModalVisible(false)
        replyForm.resetFields()
        queryClient.invalidateQueries('commentsList')
      },
      onError: (error) => {
        message.error('回复失败: ' + error.message)
      }
    }
  )
  
  // 更新评论状态mutation
  const updateCommentStatusMutation = useMutation(
    ({ commentId, status }) => commentApiService.updateCommentStatus(commentId, status),
    {
      onSuccess: () => {
        message.success('状态已更新')
        queryClient.invalidateQueries('commentsList')
      },
      onError: (error) => {
        message.error('更新失败: ' + error.message)
      }
    }
  )
  
  // 删除评论mutation
  const deleteCommentMutation = useMutation(
    (commentId) => commentApiService.deleteComment(commentId),
    {
      onSuccess: () => {
        message.success('评论已删除')
        setDeleteModalVisible(false)
        setCommentToDelete(null)
        queryClient.invalidateQueries('commentsList')
      },
      onError: (error) => {
        message.error('删除失败: ' + error.message)
      }
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
  
  // 处理排序变更
  const handleSortChange = (sort) => {
    if (filters.sort === sort) {
      // 切换排序方向
      handleFilterChange('order', filters.order === 'asc' ? 'desc' : 'asc')
    } else {
      // 设置新的排序字段并默认为降序
      handleFilterChange('sort', sort)
      handleFilterChange('order', 'desc')
    }
  }
  
  // 处理搜索
  const handleSearch = (value) => {
    handleFilterChange('keyword', value)
  }
  
  // 处理回复评论
  const handleReply = (comment) => {
    setSelectedComment(comment)
    setReplyModalVisible(true)
  }
  
  // 提交回复
  const submitReply = (values) => {
    if (!selectedComment) return
    
    replyCommentMutation.mutate({
      parentId: selectedComment.id,
      text: values.text
    })
  }
  
  // 处理查看评论详情
  const handleViewDetail = (comment) => {
    setSelectedComment(comment)
    setCommentDetailVisible(true)
  }
  
  // 处理更新评论状态
  const handleUpdateStatus = (commentId, status) => {
    updateCommentStatusMutation.mutate({ commentId, status })
  }
  
  // 处理删除评论
  const handleDelete = (comment) => {
    setCommentToDelete(comment)
    setDeleteModalVisible(true)
  }
  
  // 确认删除评论
  const confirmDelete = () => {
    if (!commentToDelete) return
    
    deleteCommentMutation.mutate(commentToDelete.id)
  }
  
  // 处理查看举报
  const handleViewReports = (comment) => {
    setReportedComment(comment)
    setReportDrawerVisible(true)
  }
  
  // 获取评论状态标签
  const getStatusTag = (status) => {
    switch (status) {
      case 'approved':
        return <Tag color="success" icon={<CheckCircleOutlined />}>已批准</Tag>
      case 'pending':
        return <Tag color="warning" icon={<ExclamationCircleOutlined />}>待审核</Tag>
      case 'rejected':
        return <Tag color="error" icon={<CloseCircleOutlined />}>已拒绝</Tag>
      case 'spam':
        return <Tag color="default" icon={<FlagOutlined />}>垃圾评论</Tag>
      default:
        return <Tag>{status}</Tag>
    }
  }
  
  // 格式化时间
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }
  
  // 生成头像背景颜色
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
  
  // 表格列定义
  const columns = [
    {
      title: '评论',
      dataIndex: 'text',
      key: 'text',
      render: (text, record) => (
        <div className="comment-cell">
          <div className="comment-author">
            <Avatar 
              src={record.user?.avatar} 
              icon={!record.user?.avatar && <UserOutlined />}
              style={{ 
                backgroundColor: !record.user?.avatar && generateAvatarColor(record.user?.name) 
              }}
            />
            <Space direction="vertical" size={0}>
              <div className="author-name">
                {record.user?.name}
                {record.featured && (
                  <Tooltip title="精选评论">
                    <StarFilled className="featured-icon" />
                  </Tooltip>
                )}
              </div>
              <div className="comment-time">{formatDate(record.createdAt)}</div>
            </Space>
          </div>
          <div className="comment-content">
            <Paragraph 
              ellipsis={{ rows: 2, expandable: true, symbol: '展开' }}
              className="comment-text"
            >
              {text}
            </Paragraph>
            {record.replyCount > 0 && (
              <div className="comment-replies">
                <Button 
                  type="link" 
                  size="small" 
                  onClick={() => handleViewDetail(record)}
                >
                  查看 {record.replyCount} 条回复
                </Button>
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      title: (
        <div className="column-title-with-sort">
          <span>内容</span>
          <Button 
            type="text" 
            size="small" 
            icon={filters.sort === 'contentTitle' ? (filters.order === 'asc' ? <SortAscendingOutlined /> : <SortDescendingOutlined />) : <SortAscendingOutlined style={{ color: '#d9d9d9' }} />} 
            onClick={() => handleSortChange('contentTitle')}
          />
        </div>
      ),
      dataIndex: 'content',
      key: 'content',
      width: 200,
      render: (content) => (
        <div className="content-cell">
          {content ? (
            <>
              <img 
                src={content.thumbnail || '/placeholder-image.png'} 
                alt={content.title} 
                className="content-thumbnail" 
              />
              <div className="content-title">
                <Tooltip title={content.title}>
                  <Link to={`/content/edit/${content.id}`}>{content.title}</Link>
                </Tooltip>
              </div>
            </>
          ) : (
            <span className="no-content">未关联内容</span>
          )}
        </div>
      )
    },
    {
      title: (
        <div className="column-title-with-sort">
          <span>状态</span>
          <Button 
            type="text" 
            size="small" 
            icon={filters.sort === 'status' ? (filters.order === 'asc' ? <SortAscendingOutlined /> : <SortDescendingOutlined />) : <SortAscendingOutlined style={{ color: '#d9d9d9' }} />} 
            onClick={() => handleSortChange('status')}
          />
        </div>
      ),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => getStatusTag(status)
    },
    {
      title: (
        <div className="column-title-with-sort">
          <span>举报</span>
          <Button 
            type="text" 
            size="small" 
            icon={filters.sort === 'reportCount' ? (filters.order === 'asc' ? <SortAscendingOutlined /> : <SortDescendingOutlined />) : <SortAscendingOutlined style={{ color: '#d9d9d9' }} />} 
            onClick={() => handleSortChange('reportCount')}
          />
        </div>
      ),
      dataIndex: 'reportCount',
      key: 'reportCount',
      width: 80,
      render: (count, record) => (
        <Button 
          type="link" 
          disabled={count === 0}
          onClick={() => count > 0 && handleViewReports(record)}
        >
          {count} 个
        </Button>
      )
    },
    {
      title: (
        <div className="column-title-with-sort">
          <span>点赞</span>
          <Button 
            type="text" 
            size="small" 
            icon={filters.sort === 'likeCount' ? (filters.order === 'asc' ? <SortAscendingOutlined /> : <SortDescendingOutlined />) : <SortAscendingOutlined style={{ color: '#d9d9d9' }} />} 
            onClick={() => handleSortChange('likeCount')}
          />
        </div>
      ),
      dataIndex: 'likeCount',
      key: 'likeCount',
      width: 70,
      render: (count) => (
        <span className="count-cell">
          <LikeOutlined /> {count}
        </span>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button 
            type="text" 
            icon={<MessageOutlined />} 
            onClick={() => handleReply(record)}
          />
          <Button 
            type="text" 
            icon={<EyeOutlined />} 
            onClick={() => handleViewDetail(record)}
          />
          <Dropdown
            overlay={
              <Menu>
                <Menu.Item 
                  key="reply" 
                  icon={<MessageOutlined />} 
                  onClick={() => handleReply(record)}
                >
                  回复
                </Menu.Item>
                <Menu.Item 
                  key="view" 
                  icon={<EyeOutlined />} 
                  onClick={() => handleViewDetail(record)}
                >
                  查看详情
                </Menu.Item>
                <Menu.SubMenu 
                  key="status" 
                  title="设置状态" 
                  icon={<EditOutlined />}
                >
                  <Menu.Item 
                    key="approve" 
                    icon={<CheckCircleOutlined />} 
                    onClick={() => handleUpdateStatus(record.id, 'approved')}
                    disabled={record.status === 'approved'}
                  >
                    批准
                  </Menu.Item>
                  <Menu.Item 
                    key="reject" 
                    icon={<CloseCircleOutlined />} 
                    onClick={() => handleUpdateStatus(record.id, 'rejected')}
                    disabled={record.status === 'rejected'}
                  >
                    拒绝
                  </Menu.Item>
                  <Menu.Item 
                    key="spam" 
                    icon={<FlagOutlined />} 
                    onClick={() => handleUpdateStatus(record.id, 'spam')}
                    disabled={record.status === 'spam'}
                  >
                    标记为垃圾评论
                  </Menu.Item>
                </Menu.SubMenu>
                <Menu.Item 
                  key="feature" 
                  icon={record.featured ? <StarFilled /> : <StarOutlined />} 
                  onClick={() => handleUpdateStatus(record.id, record.featured ? 'unfeatured' : 'featured')}
                >
                  {record.featured ? '取消精选' : '设为精选'}
                </Menu.Item>
                {record.reportCount > 0 && (
                  <Menu.Item 
                    key="reports" 
                    icon={<FlagOutlined />} 
                    onClick={() => handleViewReports(record)}
                  >
                    查看举报 ({record.reportCount})
                  </Menu.Item>
                )}
                <Menu.Divider />
                <Menu.Item 
                  key="delete" 
                  icon={<DeleteOutlined />} 
                  danger 
                  onClick={() => handleDelete(record)}
                >
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
  
  return (
    <div className="comment-management-page">
      <div className="page-header">
        <h1>评论管理</h1>
        <div className="header-actions">
          <Input.Search
            placeholder="搜索评论内容或用户"
            allowClear
            onSearch={handleSearch}
            style={{ width: 300 }}
          />
        </div>
      </div>
      
      <Card>
        <div className="filter-toolbar">
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
          >
            <TabPane tab="全部评论" key="all" />
            <TabPane tab="待审核" key="pending" />
            <TabPane tab="已批准" key="approved" />
            <TabPane tab="已拒绝" key="rejected" />
            <TabPane tab="垃圾评论" key="spam" />
          </Tabs>
          
          <div className="filter-actions">
            <Select
              placeholder="内容筛选"
              allowClear
              style={{ width: 200 }}
              value={filters.contentId}
              onChange={(value) => handleFilterChange('contentId', value)}
            >
              {/* 实际项目中应从API获取内容列表 */}
              <Option value="content1">VR视频示例</Option>
              <Option value="content2">太空探索之旅</Option>
              <Option value="content3">海底世界全景</Option>
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
            <Button 
              type="primary" 
              onClick={() => queryClient.invalidateQueries('commentsList')}
              style={{ marginTop: 16 }}
            >
              重新加载
            </Button>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={commentsData?.data?.items || []}
            rowKey="id"
            pagination={{
              current: filters.page,
              pageSize: filters.limit,
              total: commentsData?.data?.pagination?.total || 0,
              showSizeChanger: true,
              showQuickJumper: true,
              onChange: (page) => handleFilterChange('page', page),
              onShowSizeChange: (_, size) => handleFilterChange('limit', size)
            }}
          />
        )}
      </Card>
      
      {/* 回复评论模态框 */}
      <Modal
        title="回复评论"
        open={replyModalVisible}
        onCancel={() => {
          setReplyModalVisible(false)
          setSelectedComment(null)
          replyForm.resetFields()
        }}
        onOk={() => replyForm.submit()}
        okText="发送回复"
        cancelText="取消"
        confirmLoading={replyCommentMutation.isLoading}
      >
        {selectedComment && (
          <div className="original-comment">
            <div className="comment-author">
              <Avatar 
                src={selectedComment.user?.avatar} 
                icon={!selectedComment.user?.avatar && <UserOutlined />}
                style={{ 
                  backgroundColor: !selectedComment.user?.avatar && generateAvatarColor(selectedComment.user?.name) 
                }}
                size="small"
              />
              <span className="author-name">{selectedComment.user?.name}</span>
            </div>
            <div className="comment-content">
              {selectedComment.text}
            </div>
          </div>
        )}
        
        <Form
          form={replyForm}
          layout="vertical"
          onFinish={submitReply}
        >
          <Form.Item
            name="text"
            rules={[{ required: true, message: '请输入回复内容' }]}
          >
            <TextArea 
              rows={4} 
              placeholder="请输入回复内容"
            />
          </Form.Item>
        </Form>
      </Modal>
      
      {/* 评论详情抽屉 */}
      <Drawer
        title="评论详情"
        placement="right"
        width={500}
        onClose={() => {
          setCommentDetailVisible(false)
          setSelectedComment(null)
        }}
        open={commentDetailVisible}
      >
        {isCommentDetailLoading ? (
          <div className="loading-container">
            <Spin size="large" />
          </div>
        ) : (
          selectedComment && (
            <div className="comment-detail">
              <div className="main-comment">
                <div className="comment-header">
                  <div className="commenter-info">
                    <Avatar 
                      src={selectedComment.user?.avatar} 
                      icon={!selectedComment.user?.avatar && <UserOutlined />}
                      style={{ 
                        backgroundColor: !selectedComment.user?.avatar && generateAvatarColor(selectedComment.user?.name) 
                      }}
                      size="large"
                    />
                    <div className="commenter-meta">
                      <div className="commenter-name">
                        {selectedComment.user?.name}
                        {selectedComment.featured && (
                          <Tooltip title="精选评论">
                            <StarFilled className="featured-icon" />
                          </Tooltip>
                        )}
                      </div>
                      <div className="commenter-email">{selectedComment.user?.email}</div>
                    </div>
                  </div>
                  <div className="comment-status">
                    {getStatusTag(selectedComment.status)}
                  </div>
                </div>
                
                <div className="comment-content">
                  <Paragraph className="comment-text">
                    {selectedComment.text}
                  </Paragraph>
                  <div className="comment-meta">
                    <div className="comment-time">
                      {formatDate(selectedComment.createdAt)}
                    </div>
                    <div className="comment-stats">
                      <span className="like-count">
                        <LikeOutlined /> {selectedComment.likeCount || 0}
                      </span>
                      <span className="reply-count">
                        <MessageOutlined /> {selectedComment.replyCount || 0}
                      </span>
                      {selectedComment.reportCount > 0 && (
                        <span className="report-count">
                          <FlagOutlined /> {selectedComment.reportCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {selectedComment.content && (
                  <div className="related-content">
                    <div className="section-title">关联内容</div>
                    <div className="content-info">
                      <img 
                        src={selectedComment.content.thumbnail || '/placeholder-image.png'} 
                        alt={selectedComment.content.title} 
                        className="content-thumbnail" 
                      />
                      <div className="content-meta">
                        <div className="content-title">
                          <Link to={`/content/edit/${selectedComment.content.id}`}>
                            {selectedComment.content.title}
                          </Link>
                        </div>
                        <div className="content-type">
                          {selectedComment.content.contentType}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="comment-actions">
                  <Space>
                    <Button 
                      icon={<MessageOutlined />} 
                      onClick={() => {
                        setCommentDetailVisible(false)
                        handleReply(selectedComment)
                      }}
                    >
                      回复
                    </Button>
                    <Dropdown
                      overlay={
                        <Menu>
                          <Menu.SubMenu 
                            key="status" 
                            title="设置状态" 
                            icon={<EditOutlined />}
                          >
                            <Menu.Item 
                              key="approve" 
                              icon={<CheckCircleOutlined />} 
                              onClick={() => handleUpdateStatus(selectedComment.id, 'approved')}
                              disabled={selectedComment.status === 'approved'}
                            >
                              批准
                            </Menu.Item>
                            <Menu.Item 
                              key="reject" 
                              icon={<CloseCircleOutlined />} 
                              onClick={() => handleUpdateStatus(selectedComment.id, 'rejected')}
                              disabled={selectedComment.status === 'rejected'}
                            >
                              拒绝
                            </Menu.Item>
                            <Menu.Item 
                              key="spam" 
                              icon={<FlagOutlined />} 
                              onClick={() => handleUpdateStatus(selectedComment.id, 'spam')}
                              disabled={selectedComment.status === 'spam'}
                            >
                              标记为垃圾评论
                            </Menu.Item>
                          </Menu.SubMenu>
                          <Menu.Item 
                            key="feature" 
                            icon={selectedComment.featured ? <StarFilled /> : <StarOutlined />} 
                            onClick={() => handleUpdateStatus(selectedComment.id, selectedComment.featured ? 'unfeatured' : 'featured')}
                          >
                            {selectedComment.featured ? '取消精选' : '设为精选'}
                          </Menu.Item>
                          {selectedComment.reportCount > 0 && (
                            <Menu.Item 
                              key="reports" 
                              icon={<FlagOutlined />} 
                              onClick={() => {
                                setCommentDetailVisible(false)
                                handleViewReports(selectedComment)
                              }}
                            >
                              查看举报 ({selectedComment.reportCount})
                            </Menu.Item>
                          )}
                        </Menu>
                      }
                      trigger={['click']}
                    >
                      <Button icon={<EditOutlined />}>
                        操作 <MoreOutlined />
                      </Button>
                    </Dropdown>
                    <Button 
                      danger 
                      icon={<DeleteOutlined />} 
                      onClick={() => {
                        setCommentDetailVisible(false)
                        handleDelete(selectedComment)
                      }}
                    >
                      删除
                    </Button>
                  </Space>
                </div>
              </div>
              
              <Divider orientation="left">回复列表</Divider>
              
              {commentDetailData?.data?.replies?.length > 0 ? (
                <List
                  dataSource={commentDetailData.data.replies}
                  renderItem={reply => (
                    <List.Item>
                      <div className="reply-item">
                        <div className="reply-author">
                          <Avatar 
                            src={reply.user?.avatar} 
                            icon={!reply.user?.avatar && <UserOutlined />}
                            style={{ 
                              backgroundColor: !reply.user?.avatar && generateAvatarColor(reply.user?.name) 
                            }}
                            size="small"
                          />
                          <div className="author-info">
                            <span className="author-name">
                              {reply.user?.name}
                              {reply.user?.isCreator && (
                                <Tag color="blue" size="small">创作者</Tag>
                              )}
                            </span>
                            <span className="reply-time">{formatDate(reply.createdAt)}</span>
                          </div>
                        </div>
                        <div className="reply-content">
                          {reply.text}
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="暂无回复" />
              )}
            </div>
          )
        )}
      </Drawer>
      
      {/* 举报详情抽屉 */}
      <Drawer
        title="举报详情"
        placement="right"
        width={500}
        onClose={() => {
          setReportDrawerVisible(false)
          setReportedComment(null)
        }}
        open={reportDrawerVisible}
      >
        {isReportLoading ? (
          <div className="loading-container">
            <Spin size="large" />
          </div>
        ) : (
          reportedComment && (
            <div className="report-detail">
              <div className="reported-comment">
                <div className="section-title">被举报的评论</div>
                <div className="comment-content">
                  <div className="commenter-info">
                    <Avatar 
                      src={reportedComment.user?.avatar} 
                      icon={!reportedComment.user?.avatar && <UserOutlined />}
                      size="small"
                    />
                    <span className="commenter-name">{reportedComment.user?.name}</span>
                  </div>
                  <div className="comment-text">
                    {reportedComment.text}
                  </div>
                </div>
              </div>
              
              <Divider orientation="left">举报列表 ({reportData?.data?.length || 0})</Divider>
              
              {reportData?.data?.length > 0 ? (
                <List
                  dataSource={reportData.data}
                  renderItem={report => (
                    <List.Item>
                      <div className="report-item">
                        <div className="reporter-info">
                          <Avatar 
                            src={report.reporter?.avatar} 
                            icon={!report.reporter?.avatar && <UserOutlined />}
                            size="small"
                          />
                          <div className="reporter-meta">
                            <span className="reporter-name">{report.reporter?.name}</span>
                            <span className="report-time">{formatDate(report.createdAt)}</span>
                          </div>
                        </div>
                        <div className="report-reason">
                          <div className="reason-type">
                            <Tag color="red">{report.reason}</Tag>
                          </div>
                          {report.description && (
                            <div className="reason-description">
                              {report.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="暂无举报信息" />
              )}
              
              <div className="report-actions">
                <Space>
                  <Button 
                    type="primary" 
                    icon={<CheckCircleOutlined />} 
                    onClick={() => handleUpdateStatus(reportedComment.id, 'approved')}
                  >
                    批准评论
                  </Button>
                  <Button 
                    icon={<CloseCircleOutlined />} 
                    onClick={() => handleUpdateStatus(reportedComment.id, 'rejected')}
                  >
                    拒绝评论
                  </Button>
                  <Button 
                    danger 
                    icon={<DeleteOutlined />} 
                    onClick={() => {
                      setReportDrawerVisible(false)
                      handleDelete(reportedComment)
                    }}
                  >
                    删除评论
                  </Button>
                </Space>
              </div>
            </div>
          )
        )}
      </Drawer>
      
      {/* 删除确认对话框 */}
      <Modal
        title="确认删除"
        open={deleteModalVisible}
        onOk={confirmDelete}
        onCancel={() => {
          setDeleteModalVisible(false)
          setCommentToDelete(null)
        }}
        okText="确认删除"
        cancelText="取消"
        okButtonProps={{ danger: true, loading: deleteCommentMutation.isLoading }}
      >
        <div className="delete-confirmation">
          <ExclamationCircleOutlined className="warning-icon" />
          <p>确定要删除此评论吗？删除后不可恢复。</p>
          {commentToDelete?.replyCount > 0 && (
            <p className="warning-text">此评论有 {commentToDelete.replyCount} 条回复，删除后回复也将被删除。</p>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default CommentManagementPage