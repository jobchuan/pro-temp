// src/pages/notification/NotificationsPage.jsx
import React, { useState, useEffect } from 'react'
import { 
  List, 
  Card, 
  Avatar, 
  Button, 
  Tabs, 
  Badge, 
  Empty, 
  Spin, 
  Typography, 
  Dropdown, 
  Space, 
  Tag, 
  Divider,
  Menu,
  Skeleton,
  message
} from 'antd'
import { 
  BellOutlined, 
  CheckOutlined, 
  DeleteOutlined, 
  FilterOutlined, 
  MoreOutlined, 
  EyeOutlined, 
  ClockCircleOutlined, 
  MessageOutlined, 
  TeamOutlined, 
  HeartOutlined, 
  DollarOutlined,
  FileTextOutlined,
  LikeOutlined,
  CommentOutlined,
  UserAddOutlined
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { 
  markAsRead, 
  markAllAsRead, 
  removeNotification, 
  setPage, 
  appendNotifications, 
  setHasMore, 
  setLoading 
} from '@/store/slices/notificationSlice'
import './NotificationsPage.less'

const { Title, Text } = Typography
const { TabPane } = Tabs

// 模拟通知API服务
const fetchNotifications = async (type = 'all', page = 1, limit = 10) => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 800))
  
  // 模拟通知数据
  const allNotifications = [
    {
      id: '1',
      type: 'comment',
      title: '新评论通知',
      content: '用户 张三 评论了您的作品 "深海VR探索"',
      time: new Date(2023, 11, 5, 14, 30),
      read: false,
      sender: {
        id: 'user1',
        name: '张三',
        avatar: 'https://randomuser.me/api/portraits/men/1.jpg'
      },
      data: {
        contentId: 'content1',
        contentTitle: '深海VR探索',
        commentId: 'comment1'
      }
    },
    {
      id: '2',
      type: 'like',
      title: '点赞通知',
      content: '用户 李四 点赞了您的作品 "森林徒步VR"',
      time: new Date(2023, 11, 4, 9, 15),
      read: true,
      sender: {
        id: 'user2',
        name: '李四',
        avatar: 'https://randomuser.me/api/portraits/women/2.jpg'
      },
      data: {
        contentId: 'content2',
        contentTitle: '森林徒步VR'
      }
    },
    {
      id: '3',
      type: 'system',
      title: '系统通知',
      content: '您的作品 "太空站VR" 已通过审核并发布',
      time: new Date(2023, 11, 3, 16, 45),
      read: false,
      sender: {
        id: 'system',
        name: '系统',
        avatar: null
      },
      data: {
        contentId: 'content3',
        contentTitle: '太空站VR'
      }
    },
    {
      id: '4',
      type: 'collaboration',
      title: '协作邀请',
      content: '用户 王五 邀请您参与协作项目 "城市漫游VR"',
      time: new Date(2023, 11, 2, 11, 20),
      read: false,
      sender: {
        id: 'user3',
        name: '王五',
        avatar: 'https://randomuser.me/api/portraits/men/3.jpg'
      },
      data: {
        projectId: 'proj1',
        projectTitle: '城市漫游VR'
      }
    },
    {
      id: '5',
      type: 'income',
      title: '收入通知',
      content: '您的内容 "深海VR探索" 本月产生收入 ¥258.50',
      time: new Date(2023, 11, 1, 8, 10),
      read: true,
      sender: {
        id: 'system',
        name: '系统',
        avatar: null
      },
      data: {
        contentId: 'content1',
        contentTitle: '深海VR探索',
        amount: 258.5
      }
    },
    {
      id: '6',
      type: 'follow',
      title: '新粉丝通知',
      content: '用户 赵六 关注了您',
      time: new Date(2023, 10, 30, 19, 5),
      read: true,
      sender: {
        id: 'user4',
        name: '赵六',
        avatar: 'https://randomuser.me/api/portraits/women/4.jpg'
      },
      data: {
        userId: 'user4'
      }
    },
    {
      id: '7',
      type: 'comment',
      title: '新评论通知',
      content: '用户 孙七 评论了您的作品 "森林徒步VR"',
      time: new Date(2023, 10, 29, 12, 40),
      read: false,
      sender: {
        id: 'user5',
        name: '孙七',
        avatar: 'https://randomuser.me/api/portraits/men/5.jpg'
      },
      data: {
        contentId: 'content2',
        contentTitle: '森林徒步VR',
        commentId: 'comment2'
      }
    },
    {
      id: '8',
      type: 'system',
      title: '系统通知',
      content: '平台将于2023年12月15日进行系统升级，届时服务可能短暂不可用',
      time: new Date(2023, 10, 28, 14, 0),
      read: true,
      sender: {
        id: 'system',
        name: '系统',
        avatar: null
      },
      data: {}
    },
    {
      id: '9',
      type: 'like',
      title: '点赞通知',
      content: '用户 周八 点赞了您的作品 "太空站VR"',
      time: new Date(2023, 10, 27, 9, 50),
      read: true,
      sender: {
        id: 'user6',
        name: '周八',
        avatar: 'https://randomuser.me/api/portraits/women/6.jpg'
      },
      data: {
        contentId: 'content3',
        contentTitle: '太空站VR'
      }
    },
    {
      id: '10',
      type: 'collaboration',
      title: '协作更新',
      content: '项目 "城市漫游VR" 有新的更新',
      time: new Date(2023, 10, 26, 16, 30),
      read: false,
      sender: {
        id: 'system',
        name: '系统',
        avatar: null
      },
      data: {
        projectId: 'proj1',
        projectTitle: '城市漫游VR'
      }
    }
  ]
  
  // 根据类型筛选
  let filtered = [...allNotifications]
  if (type !== 'all') {
    filtered = allNotifications.filter(notification => notification.type === type)
  }
  
  // 分页
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  const paginatedData = filtered.slice(startIndex, endIndex)
  
  return {
    data: paginatedData,
    pagination: {
      total: filtered.length,
      page,
      pages: Math.ceil(filtered.length / limit),
      limit
    }
  }
}

const NotificationsPage = () => {
  const dispatch = useDispatch()
  const notificationState = useSelector(state => state.notification)
  const [activeTab, setActiveTab] = useState('all')
  const [isFetching, setIsFetching] = useState(false)
  
  // 初始加载通知
  useEffect(() => {
    loadNotifications(true)
  }, [activeTab])
  
  // 加载通知
  const loadNotifications = async (isInitial = false) => {
    if (isFetching) return
    
    try {
      setIsFetching(true)
      if (isInitial) {
        dispatch(setLoading(true))
      }
      
      const currentPage = isInitial ? 1 : notificationState.page
      
      const response = await fetchNotifications(
        activeTab === 'all' ? 'all' : activeTab, 
        currentPage,
        10
      )
      
      if (isInitial) {
        // 重置并加载第一页
        dispatch({ type: 'notification/setNotifications', payload: response.data })
        dispatch(setPage(1))
      } else {
        // 追加加载更多
        dispatch(appendNotifications(response.data))
        dispatch(setPage(currentPage + 1))
      }
      
      // 更新是否有更多
      const hasMore = currentPage < response.pagination.pages
      dispatch(setHasMore(hasMore))
      
      if (isInitial) {
        dispatch(setLoading(false))
      }
    } catch (error) {
      message.error('加载通知失败')
      if (isInitial) {
        dispatch(setLoading(false))
      }
    } finally {
      setIsFetching(false)
    }
  }
  
  // 处理tab切换
  const handleTabChange = (key) => {
    setActiveTab(key)
  }
  
  // 加载更多
  const handleLoadMore = () => {
    loadNotifications(false)
  }
  
  // 标记为已读
  const handleMarkAsRead = (notification) => {
    dispatch(markAsRead({ notificationId: notification.id }))
    message.success('已标记为已读')
  }
  
  // 标记所有为已读
  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead())
    message.success('已全部标记为已读')
  }
  
  // 删除通知
  const handleRemove = (notification) => {
    dispatch(removeNotification({ notificationId: notification.id }))
    message.success('通知已删除')
  }
  
  // 获取图标
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'comment':
        return <CommentOutlined style={{ color: '#1677ff' }} />
      case 'like':
        return <LikeOutlined style={{ color: '#ff4d4f' }} />
      case 'system':
        return <BellOutlined style={{ color: '#faad14' }} />
      case 'collaboration':
        return <TeamOutlined style={{ color: '#52c41a' }} />
      case 'income':
        return <DollarOutlined style={{ color: '#722ed1' }} />
      case 'follow':
        return <UserAddOutlined style={{ color: '#13c2c2' }} />
      default:
        return <MessageOutlined />
    }
  }
  
  // 格式化时间
  const formatNotificationTime = (time) => {
    const now = new Date()
    const diff = now - new Date(time)
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (minutes < 60) {
      return `${minutes}分钟前`
    } else if (hours < 24) {
      return `${hours}小时前`
    } else if (days < 30) {
      return `${days}天前`
    } else {
      const date = new Date(time)
      return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
    }
  }
  
  // 渲染通知项
  const renderNotificationItem = (notification) => {
    const icon = getNotificationIcon(notification.type)
    
    // 通知类型标签颜色
    const getTagColor = (type) => {
      switch (type) {
        case 'comment':
          return 'blue'
        case 'like':
          return 'red'
        case 'system':
          return 'orange'
        case 'collaboration':
          return 'green'
        case 'income':
          return 'purple'
        case 'follow':
          return 'cyan'
        default:
          return 'default'
      }
    }
    
    // 通知类型标签文本
    const getTagText = (type) => {
      switch (type) {
        case 'comment':
          return '评论'
        case 'like':
          return '点赞'
        case 'system':
          return '系统'
        case 'collaboration':
          return '协作'
        case 'income':
          return '收入'
        case 'follow':
          return '关注'
        default:
          return '通知'
      }
    }
    
    // 操作菜单
    const actionMenu = (
      <Menu>
        {!notification.read && (
          <Menu.Item key="mark-read" icon={<EyeOutlined />} onClick={() => handleMarkAsRead(notification)}>
            标记为已读
          </Menu.Item>
        )}
        <Menu.Item key="delete" icon={<DeleteOutlined />} danger onClick={() => handleRemove(notification)}>
          删除通知
        </Menu.Item>
      </Menu>
    )
    
    return (
      <List.Item
        className={`notification-item ${notification.read ? 'read' : 'unread'}`}
        actions={[
          <Dropdown overlay={actionMenu} trigger={['click']}>
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        ]}
      >
        <List.Item.Meta
          avatar={
            <Badge dot={!notification.read} offset={[-5, 5]}>
              <Avatar 
                src={notification.sender.avatar} 
                icon={!notification.sender.avatar && icon}
              />
            </Badge>
          }
          title={
            <div className="notification-title">
              <span className="title-text">{notification.title}</span>
              <Tag color={getTagColor(notification.type)} className="type-tag">
                {getTagText(notification.type)}
              </Tag>
            </div>
          }
          description={
            <div className="notification-desc">
              <div className="notification-content">{notification.content}</div>
              <div className="notification-time">
                <ClockCircleOutlined /> {formatNotificationTime(notification.time)}
              </div>
            </div>
          }
        />
      </List.Item>
    )
  }
  
  // 渲染加载更多按钮
  const renderLoadMore = () => {
    if (!notificationState.hasMore) {
      return null
    }
    
    return (
      <div className="load-more-container">
        <Button 
          onClick={handleLoadMore} 
          loading={isFetching}
          disabled={isFetching || notificationState.isLoading}
        >
          加载更多
        </Button>
      </div>
    )
  }
  
  // 渲染空状态
  const renderEmpty = () => {
    return (
      <Empty 
        image={Empty.PRESENTED_IMAGE_SIMPLE} 
        description="暂无通知" 
      />
    )
  }
  
  return (
    <div className="notifications-page">
      <div className="page-header">
        <Title level={2}>通知中心</Title>
        
        <div className="header-actions">
          <Button 
            icon={<CheckOutlined />} 
            onClick={handleMarkAllAsRead}
            disabled={notificationState.isLoading || notificationState.notifications.every(n => n.read)}
          >
            全部标为已读
          </Button>
        </div>
      </div>
      
      <Card>
        <Tabs 
          onChange={handleTabChange} 
          defaultActiveKey="all"
          tabBarExtraContent={
            <Dropdown 
              overlay={
                <Menu>
                  <Menu.Item key="all">全部通知</Menu.Item>
                  <Menu.Item key="unread">未读通知</Menu.Item>
                </Menu>
              } 
              trigger={['click']}
            >
              <Button icon={<FilterOutlined />}>
                筛选 <MoreOutlined />
              </Button>
            </Dropdown>
          }
        >
          <TabPane 
            tab={
              <Badge 
                count={notificationState.unreadCount} 
                size="small" 
                offset={[5, 0]}
                style={{ backgroundColor: notificationState.unreadCount ? '#ff4d4f' : '#52c41a' }}
              >
                全部
              </Badge>
            } 
            key="all"
          >
            <div className="tab-content">
              {notificationState.isLoading ? (
                <Skeleton active avatar paragraph={{ rows: 3 }} />
              ) : notificationState.notifications.length === 0 ? (
                renderEmpty()
              ) : (
                <>
                  <List
                    itemLayout="horizontal"
                    dataSource={notificationState.notifications}
                    renderItem={renderNotificationItem}
                  />
                  {renderLoadMore()}
                </>
              )}
            </div>
          </TabPane>
          
          <TabPane tab="评论" key="comment">
            <div className="tab-content">
              {notificationState.isLoading ? (
                <Skeleton active avatar paragraph={{ rows: 3 }} />
              ) : notificationState.notifications.filter(n => n.type === 'comment').length === 0 ? (
                renderEmpty()
              ) : (
                <>
                  <List
                    itemLayout="horizontal"
                    dataSource={notificationState.notifications.filter(n => n.type === 'comment')}
                    renderItem={renderNotificationItem}
                  />
                  {renderLoadMore()}
                </>
              )}
            </div>
          </TabPane>
          
          <TabPane tab="点赞" key="like">
            <div className="tab-content">
              {notificationState.isLoading ? (
                <Skeleton active avatar paragraph={{ rows: 3 }} />
              ) : notificationState.notifications.filter(n => n.type === 'like').length === 0 ? (
                renderEmpty()
              ) : (
                <>
                  <List
                    itemLayout="horizontal"
                    dataSource={notificationState.notifications.filter(n => n.type === 'like')}
                    renderItem={renderNotificationItem}
                  />
                  {renderLoadMore()}
                </>
              )}
            </div>
          </TabPane>
          
          <TabPane tab="系统" key="system">
            <div className="tab-content">
              {notificationState.isLoading ? (
                <Skeleton active avatar paragraph={{ rows: 3 }} />
              ) : notificationState.notifications.filter(n => n.type === 'system').length === 0 ? (
                renderEmpty()
              ) : (
                <>
                  <List
                    itemLayout="horizontal"
                    dataSource={notificationState.notifications.filter(n => n.type === 'system')}
                    renderItem={renderNotificationItem}
                  />
                  {renderLoadMore()}
                </>
              )}
            </div>
          </TabPane>
          
          <TabPane tab="协作" key="collaboration">
            <div className="tab-content">
              {notificationState.isLoading ? (
                <Skeleton active avatar paragraph={{ rows: 3 }} />
              ) : notificationState.notifications.filter(n => n.type === 'collaboration').length === 0 ? (
                renderEmpty()
              ) : (
                <>
                  <List
                    itemLayout="horizontal"
                    dataSource={notificationState.notifications.filter(n => n.type === 'collaboration')}
                    renderItem={renderNotificationItem}
                  />
                  {renderLoadMore()}
                </>
              )}
            </div>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  )
}

export default NotificationsPage