// src/components/notification/NotificationPopover.jsx
import React, { useState, useEffect } from 'react'
import { 
  Popover, 
  Badge, 
  List, 
  Avatar, 
  Button, 
  Empty, 
  Spin, 
  Tabs,
  Tag
} from 'antd'
import { 
  BellOutlined, 
  CheckOutlined, 
  RightOutlined,
  CommentOutlined,
  LikeOutlined,
  UserAddOutlined,
  TeamOutlined,
  DollarOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useQuery } from 'react-query'
import { notificationApiService } from '@/services/api/notificationService'
import { setUnreadCount } from '@/store/slices/notificationSlice'
import './NotificationPopover.less'

const { TabPane } = Tabs

const NotificationPopover = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [visible, setVisible] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const unreadCount = useSelector(state => state.notification.unreadCount)
  
  // 获取最新通知
  const { data: notificationsData, isLoading, refetch } = useQuery(
    'recentNotifications',
    () => notificationApiService.getNotifications({ 
      limit: 5, 
      sort: '-createdAt',
      type: activeTab === 'all' ? undefined : activeTab 
    }),
    {
      enabled: visible, // 只在弹出框显示时查询
      staleTime: 60 * 1000, // 1分钟内不重新获取
      onSuccess: (data) => {
        if (data.success) {
          // 更新未读数量
          let count = 0
          data.data.data.forEach(notification => {
            if (!notification.read) count++
          })
          dispatch(setUnreadCount(count))
        }
      }
    }
  )
  
  // 弹出框可见状态变化时触发
  useEffect(() => {
    if (visible) {
      refetch()
    }
  }, [visible, refetch, activeTab])
  
  // Tab切换
  const handleTabChange = (key) => {
    setActiveTab(key)
  }
  
  // 打开通知中心
  const viewAllNotifications = () => {
    setVisible(false)
    navigate('/notifications')
  }
  
  // 标记所有为已读
  const markAllAsRead = async () => {
    try {
      const response = await notificationApiService.markAllAsRead()
      if (response.success) {
        dispatch(setUnreadCount(0))
        refetch()
      }
    } catch (error) {
      console.error('标记已读失败:', error)
    }
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
        return <BellOutlined />
    }
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
  
  // 渲染通知列表
  const renderNotificationList = () => {
    if (isLoading) {
      return (
        <div className="loading-container">
          <Spin tip="加载中..." />
        </div>
      )
    }
    
    const notifications = notificationsData?.data?.data || []
    
    if (notifications.length === 0) {
      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无通知" />
    }
    
    return (
      <List
        itemLayout="horizontal"
        dataSource={notifications}
        renderItem={(notification) => (
          <List.Item
            className={notification.read ? 'read' : 'unread'}
            onClick={() => navigate('/notifications')}
          >
            <List.Item.Meta
              avatar={
                <Badge dot={!notification.read}>
                  <Avatar 
                    src={notification.sender?.avatar}
                    icon={!notification.sender?.avatar && getNotificationIcon(notification.type)}
                  />
                </Badge>
              }
              title={
                <div className="notification-title">
                  <span>{notification.title}</span>
                  <Tag color={getTagColor(notification.type)}>{getTagText(notification.type)}</Tag>
                </div>
              }
              description={
                <div className="notification-content">
                  <div className="content-text">{notification.content}</div>
                  <div className="content-time">{formatTime(notification.time)}</div>
                </div>
              }
            />
          </List.Item>
        )}
      />
    )
  }
  
  // 获取通知类型标签颜色
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
  
  // 获取通知类型标签文本
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
  
  // 渲染弹出框内容
  const notificationContent = (
    <div className="notification-popover-content">
      <div className="popover-header">
        <h3>通知</h3>
        {unreadCount > 0 && (
          <Button 
            type="link" 
            size="small" 
            icon={<CheckOutlined />}
            onClick={markAllAsRead}
          >
            全部已读
          </Button>
        )}
      </div>
      
      <Tabs 
        defaultActiveKey="all" 
        onChange={handleTabChange}
        size="small"
        className="notification-tabs"
      >
        <TabPane tab="全部" key="all">
          {renderNotificationList()}
        </TabPane>
        <TabPane tab="评论" key="comment">
          {renderNotificationList()}
        </TabPane>
        <TabPane tab="系统" key="system">
          {renderNotificationList()}
        </TabPane>
      </Tabs>
      
      <div className="popover-footer">
        <Button 
          type="link" 
          onClick={viewAllNotifications}
        >
          查看全部 <RightOutlined />
        </Button>
      </div>
    </div>
  )
  
  return (
    <Popover
      content={notificationContent}
      trigger="click"
      placement="bottomRight"
      open={visible}
      onOpenChange={setVisible}
      overlayClassName="notification-popover"
      arrow={false}
    >
      <Badge count={unreadCount} overflowCount={99}>
        <Button 
          type="text" 
          icon={<BellOutlined />} 
          className="notification-btn"
        />
      </Badge>
    </Popover>
  )
}

export default NotificationPopover