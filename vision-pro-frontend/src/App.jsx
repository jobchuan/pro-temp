// src/App.jsx
import React, { useEffect, Suspense } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { Spin, ConfigProvider, theme } from 'antd'
import { useSelector } from 'react-redux'

import Layout from './components/layout/Layout'
import LoginPage from './pages/login/LoginPage'
import NotFoundPage from './pages/error/NotFoundPage'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { useCurrentUser } from './hooks/useUser'

// 懒加载页面组件
const DashboardPage = React.lazy(() => import('./pages/dashboard/DashboardPage'))
const ContentListPage = React.lazy(() => import('./pages/content/ContentListPage'))
const ContentCreatePage = React.lazy(() => import('./pages/content/ContentCreatePage'))
const ContentEditPage = React.lazy(() => import('./pages/content/ContentEditPage'))
const AnalyticsPage = React.lazy(() => import('./pages/analytics/AnalyticsPage'))
const ContentAnalyticsPage = React.lazy(() => import('./pages/analytics/ContentAnalyticsPage'))
const AudienceAnalyticsPage = React.lazy(() => import('./pages/analytics/AudienceAnalyticsPage'))
const IncomeOverviewPage = React.lazy(() => import('./pages/income/IncomeOverviewPage'))
const IncomeDetailsPage = React.lazy(() => import('./pages/income/IncomeDetailsPage'))
const WithdrawalPage = React.lazy(() => import('./pages/income/WithdrawalPage'))
const MediaLibraryPage = React.lazy(() => import('./pages/media/MediaLibraryPage'))
const CollaborationListPage = React.lazy(() => import('./pages/collaboration/CollaborationListPage'))
const CollaborationDetailPage = React.lazy(() => import('./pages/collaboration/CollaborationDetailPage'))
const FusionListPage = React.lazy(() => import('./pages/fusion/FusionListPage'))
const FusionEditPage = React.lazy(() => import('./pages/fusion/FusionEditPage'))
const CommentManagementPage = React.lazy(() => import('./pages/comment/CommentManagementPage'))
const NotificationsPage = React.lazy(() => import('./pages/notification/NotificationsPage'))
const ProfilePage = React.lazy(() => import('./pages/settings/ProfilePage'))
const AccountSecurityPage = React.lazy(() => import('./pages/settings/AccountSecurityPage'))
const NotificationSettingsPage = React.lazy(() => import('./pages/settings/NotificationSettingsPage'))

// 加载中组件
const PageLoading = () => (
  <div className="page-loading">
    <Spin size="large" tip="加载中..." />
  </div>
)

const App = () => {
  const { isDarkMode } = useSelector(state => state.theme)
  const location = useLocation()
  const navigate = useNavigate()
  const { data: userData, isLoading: isUserLoading, error: userError } = useCurrentUser()
  
  // 检查用户是否登录
  useEffect(() => {
    const publicPaths = ['/login', '/register', '/forgot-password']
    const isPublicPath = publicPaths.some(path => location.pathname.startsWith(path))
    
    if (!isUserLoading && !userData && !isPublicPath) {
      // 用户未登录且访问非公开页面，重定向到登录页
      navigate('/login', { state: { from: location.pathname } })
    }
  }, [userData, isUserLoading, location.pathname, navigate])
  
  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 6,
        },
      }}
    >
      <ErrorBoundary>
        <Suspense fallback={<PageLoading />}>
          <Routes>
            {/* 公开路由 */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* 需要认证的路由 */}
            <Route path="/" element={<Layout />}>
              <Route index element={<DashboardPage />} />
              
              {/* 内容管理 */}
              <Route path="content">
                <Route index element={<ContentListPage />} />
                <Route path="create" element={<ContentCreatePage />} />
                <Route path="edit/:contentId" element={<ContentEditPage />} />
              </Route>
              
              {/* 分析 */}
              <Route path="analytics">
                <Route index element={<AnalyticsPage />} />
                <Route path="content/:contentId" element={<ContentAnalyticsPage />} />
                <Route path="audience" element={<AudienceAnalyticsPage />} />
              </Route>
              
              {/* 财务 */}
              <Route path="income">
                <Route index element={<IncomeOverviewPage />} />
                <Route path="details" element={<IncomeDetailsPage />} />
                <Route path="withdraw" element={<WithdrawalPage />} />
              </Route>
              
              {/* 媒体库 */}
              <Route path="media" element={<MediaLibraryPage />} />
              
              {/* 协作 */}
              <Route path="collaboration">
                <Route index element={<CollaborationListPage />} />
                <Route path=":collaborationId" element={<CollaborationDetailPage />} />
              </Route>
              
              {/* 融合内容 */}
              <Route path="fusion">
                <Route index element={<FusionListPage />} />
                <Route path="create" element={<FusionEditPage />} />
                <Route path="edit/:fusionId" element={<FusionEditPage />} />
              </Route>
              
              {/* 评论管理 */}
              <Route path="comments" element={<CommentManagementPage />} />
              
              {/* 通知 */}
              <Route path="notifications" element={<NotificationsPage />} />
              
              {/* 设置 */}
              <Route path="settings">
                <Route path="profile" element={<ProfilePage />} />
                <Route path="security" element={<AccountSecurityPage />} />
                <Route path="notifications" element={<NotificationSettingsPage />} />
              </Route>
            </Route>
            
            {/* 404页面 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </ConfigProvider>
  )
}

export default App
