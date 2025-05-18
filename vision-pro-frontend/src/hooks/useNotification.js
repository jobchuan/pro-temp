// src/hooks/useNotification.js
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { message } from 'antd'
import { useDispatch } from 'react-redux'
import { 
  setNotifications, 
  setUnreadCount, 
  markAsRead, 
  markAllAsRead, 
  removeNotification 
} from '@/store/slices/notificationSlice'
import { notificationApiService } from '@/services/api/notificationService'

/**
 * 获取通知列表Hook
 * @param {object} params - 查询参数
 * @returns {object} - 查询结果
 */
export const useNotificationList = (params) => {
  const dispatch = useDispatch()
  
  return useQuery(
    ['notificationList', params],
    () => notificationApiService.getNotifications(params),
    {
      staleTime: 60 * 1000, // 1分钟内不重新获取
      keepPreviousData: true,
      onSuccess: (data) => {
        if (data.success) {
          dispatch(setNotifications(data.data.data))
        }
      }
    }
  )
}

/**
 * 获取未读通知数量Hook
 * @returns {object} - 查询结果
 */
export const useUnreadCount = () => {
  const dispatch = useDispatch()
  
  return useQuery(
    'unreadNotifications',
    () => notificationApiService.getUnreadCount(),
    {
      staleTime: 60 * 1000, // 1分钟内不重新获取
      refetchInterval: 5 * 60 * 1000, // 5分钟定时刷新
      onSuccess: (data) => {
        if (data.success) {
          dispatch(setUnreadCount(data.data.count))
        }
      }
    }
  )
}

/**
 * 标记通知为已读Hook
 * @returns {object} - mutation对象
 */
export const useMarkAsRead = () => {
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  
  return useMutation(
    (notificationId) => notificationApiService.markAsRead(notificationId),
    {
      onSuccess: (_, notificationId) => {
        // 更新本地状态
        dispatch(markAsRead({ notificationId }))
        
        // 更新缓存
        queryClient.invalidateQueries('unreadNotifications')
      },
      onError: (error) => {
        message.error('标记失败: ' + (error.response?.data?.message || error.message))
      }
    }
  )
}

/**
 * 标记所有通知为已读Hook
 * @returns {object} - mutation对象
 */
export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  
  return useMutation(
    () => notificationApiService.markAllAsRead(),
    {
      onSuccess: () => {
        // 更新本地状态
        dispatch(markAllAsRead())
        
        // 更新缓存
        queryClient.invalidateQueries('unreadNotifications')
      },
      onError: (error) => {
        message.error('标记失败: ' + (error.response?.data?.message || error.message))
      }
    }
  )
}

/**
 * 删除通知Hook
 * @returns {object} - mutation对象
 */
export const useDeleteNotification = () => {
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  
  return useMutation(
    (notificationId) => notificationApiService.deleteNotification(notificationId),
    {
      onSuccess: (_, notificationId) => {
        // 更新本地状态
        dispatch(removeNotification({ notificationId }))
        
        // 更新缓存
        queryClient.invalidateQueries('unreadNotifications')
      },
      onError: (error) => {
        message.error('删除失败: ' + (error.response?.data?.message || error.message))
      }
    }
  )
}

/**
 * 获取通知设置Hook
 * @returns {object} - 查询结果
 */
export const useNotificationSettings = () => {
  return useQuery(
    'notificationSettings',
    () => notificationApiService.getNotificationSettings(),
    {
      staleTime: 5 * 60 * 1000 // 5分钟内不重新获取
    }
  )
}

/**
 * 更新通知设置Hook
 * @returns {object} - mutation对象
 */
export const useUpdateNotificationSettings = () => {
  const queryClient = useQueryClient()
  
  return useMutation(
    (settings) => notificationApiService.updateNotificationSettings(settings),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notificationSettings')
        message.success('通知设置已更新')
      },
      onError: (error) => {
        message.error('更新失败: ' + (error.response?.data?.message || error.message))
      }
    }
  )
}
