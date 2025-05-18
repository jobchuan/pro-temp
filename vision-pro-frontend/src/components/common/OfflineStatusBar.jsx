// src/components/common/OfflineStatusBar.jsx
import React from 'react'
import { Alert, Button } from 'antd'

/**
 * 离线状态条组件
 * 显示网络连接状态并提供同步操作
 */
export const OfflineStatusBar = () => {
  // 检查网络连接状态
  const [isOnline, setIsOnline] = React.useState(navigator.onLine)
  const [hasOfflineOperations, setHasOfflineOperations] = React.useState(false)
  
  // 监听网络状态变化
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // 模拟存在离线操作
    if (isOnline) {
      const checkOfflineOperations = setTimeout(() => {
        // 实际项目中应从本地存储或状态管理中检查是否有未同步的操作
        setHasOfflineOperations(Math.random() > 0.7) // 随机模拟有或没有离线操作
      }, 1000)
      
      return () => {
        clearTimeout(checkOfflineOperations)
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [isOnline])
  
  // 同步离线操作
  const handleSync = () => {
    // 实际项目中应同步本地存储的离线操作
    setTimeout(() => {
      setHasOfflineOperations(false)
    }, 1500)
  }
  
  if (isOnline) {
    // 检查是否有待同步的操作
    if (hasOfflineOperations) {
      return (
        <Alert
          type="warning"
          message="您有未同步的操作"
          banner
          action={
            <Button size="small" type="primary" onClick={handleSync}>
              立即同步
            </Button>
          }
        />
      )
    }
    return null
  }
  
  return (
    <Alert
      type="error"
      message="您已离线，操作将临时保存并在网络恢复后同步"
      banner
    />
  )
}

export default OfflineStatusBar
