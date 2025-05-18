// src/hooks/useUser.js
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { message } from 'antd'
import { userApiService } from '@/services/api/userService'

/**
 * 获取当前用户信息Hook
 * @returns {object} - 查询结果
 */
export const useCurrentUser = () => {
  return useQuery(
    'currentUser', 
    () => userApiService.getCurrentUser(),
    {
      staleTime: 5 * 60 * 1000, // 5分钟内不重新获取
      cacheTime: 10 * 60 * 1000, // 缓存10分钟
      retry: 1, // 失败后重试1次
      // 检查是否有访问令牌，没有则禁用查询
      enabled: !!localStorage.getItem('token')
    }
  )
}

/**
 * 更新用户资料Hook
 * @returns {object} - mutation对象
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient()
  
  return useMutation(
    // mutation函数
    (data) => userApiService.updateProfile(data),
    // 选项
    {
      onSuccess: (response) => {
        if (response.success) {
          // 更新缓存的用户数据
          queryClient.invalidateQueries('currentUser')
          message.success('个人资料已更新')
        }
      },
      onError: (error) => {
        message.error('更新失败: ' + (error.response?.data?.message || error.message))
      }
    }
  )
}

/**
 * 修改密码Hook
 * @returns {object} - mutation对象
 */
export const useChangePassword = () => {
  return useMutation(
    // mutation函数
    (data) => userApiService.changePassword(data),
    // 选项
    {
      onSuccess: (response) => {
        if (response.success) {
          message.success('密码已成功修改')
        }
      },
      onError: (error) => {
        message.error('密码修改失败: ' + (error.response?.data?.message || error.message))
      }
    }
  )
}

/**
 * 获取创作者信息Hook
 * @param {string} creatorId - 创作者ID
 * @returns {object} - 查询结果
 */
export const useCreatorProfile = (creatorId) => {
  return useQuery(
    ['creatorProfile', creatorId],
    () => userApiService.getCreatorProfile(creatorId),
    {
      enabled: !!creatorId,
      staleTime: 5 * 60 * 1000 // 5分钟内不重新获取
    }
  )
}

/**
 * 更新创作者信息Hook
 * @returns {object} - mutation对象
 */
export const useUpdateCreatorProfile = () => {
  const queryClient = useQueryClient()
  
  return useMutation(
    // mutation函数
    (data) => userApiService.updateCreatorProfile(data),
    // 选项
    {
      onSuccess: (response) => {
        if (response.success) {
          // 更新缓存的创作者数据
          queryClient.invalidateQueries('currentUser')
          message.success('创作者资料已更新')
        }
      }
    }
  )
}
