// src/components/layout/Layout.jsx
import React, { useState, useEffect } from 'react'
import { Layout, Menu, theme, Dropdown, Avatar, Badge, Button, Drawer } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardOutlined,
  VideoCameraOutlined,
  FileImageOutlined,
  BarChartOutlined,
  TeamOutlined,
  WalletOutlined,
  CommentOutlined,
  SettingOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  MergeCellsOutlined,
  DownOutlined
} from '@ant-design/icons'
import { useCurrentUser } from '@/hooks/useUser'
import { useLogout } from '@/hooks/useAuth'
import { OfflineStatusBar } from '@/components/common/OfflineStatusBar'

const { Header, Sider, Content } = Layout

const MainLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileVisible, setMobileVisible] = useState(false)
  const isMobile = window.innerWidth < 768
  
  const { data: userData } = useCurrentUser()
  const logout = useLogout()
  
  // 响应式处理
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true)
      }
    }
    
    window.addEventListener('resize', handleResize)
    handleResize()
    
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // 从路径解析当前选中的菜单项
  const getSelectedKeys = () => {
    const pathname = location.pathname
    if (pathname === '/') return ['dashboard']
    const mainPath = pathname.split('/')[1]
    return [mainPath]
  }
  
  // 用户下拉菜单项
  const userMenuItems = [
    {
      key: 'profile',
      label: '个人资料',
      icon: <UserOutlined />,
      onClick: () => navigate('/settings/profile')
    },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      onClick: () => logout.mutate()
    }
  ]
  
  // 主导航菜单项
  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '仪表盘',
      onClick: () => navigate('/')
    },
    {
      key: 'content',
      icon: <VideoCameraOutlined />,
      label: '内容管理',
      onClick: () => navigate('/content')
    },
    {
      key: 'media',
      icon: <FileImageOutlined />,
      label: '媒体库',
      onClick: () => navigate('/media')
    },
    {
      key: 'fusion',
      icon: <MergeCellsOutlined />,
      label: '融合内容',
      onClick: () => navigate('/fusion')
    },
    {
      key: 'analytics',
      icon: <BarChartOutlined />,
      label: '数据分析',
      onClick: () => navigate('/analytics')
    },
    {
      key: 'income',
      icon: <WalletOutlined />,
      label: '收入管理',
      onClick: () => navigate('/income')
    },
    {
      key: 'collaboration',
      icon: <TeamOutlined />,
      label: '协作管理',
      onClick: () => navigate('/collaboration')
    },
    {
      key: 'comments',
      icon: <CommentOutlined />,
      label: '评论管理',
      onClick: () => navigate('/comments')
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
      onClick: () => navigate('/settings/profile')
    }
  ]
  
  const renderSidebar = () => (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={220}
      className="app-sider"
    >
      <div className="logo">
        {collapsed ? 'VP' : 'Vision Pro 创作者'}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={getSelectedKeys()}
        items={menuItems}
      />
    </Sider>
  )
  
  return (
    <Layout className="app-layout">
      {/* 离线状态条 */}
      <OfflineStatusBar />
      
      {/* 移动端侧边栏抽屉 */}
      {isMobile && (
        <Drawer
          placement="left"
          onClose={() => setMobileVisible(false)}
          open={mobileVisible}
          width={220}
          bodyStyle={{ padding: 0 }}
          headerStyle={{ display: 'none' }}
        >
          {renderSidebar()}
        </Drawer>
      )}
      
      <Layout>
        {/* 桌面端侧边栏 */}
        {!isMobile && renderSidebar()}
        
        <Layout>
          <Header className="app-header">
            {/* 折叠按钮 */}
            {isMobile ? (
              <Button
                type="text"
                icon={<MenuUnfoldOutlined />}
                onClick={() => setMobileVisible(true)}
                className="menu-trigger"
              />
            ) : (
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                className="menu-trigger"
              />
            )}
            
            <div className="header-actions">
              {/* 通知按钮 */}
              <Badge count={5} size="small">
                <Button
                  type="text"
                  icon={<BellOutlined />}
                  onClick={() => navigate('/notifications')}
                  className="notification-btn"
                />
              </Badge>
              
              {/* 用户头像和下拉菜单 */}
              <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
                <div className="user-dropdown">
                  <Avatar src={userData?.profile?.avatar || null} icon={<UserOutlined />} />
                  {!isMobile && (
                    <>
                      <span className="username">{userData?.username || '用户'}</span>
                      <DownOutlined />
                    </>
                  )}
                </div>
              </Dropdown>
            </div>
          </Header>
          
          <Content className="app-content">
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  )
}

export default MainLayout
