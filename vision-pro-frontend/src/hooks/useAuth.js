// src/hooks/useAuth.js
import { useMutation, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { message } from 'antd'
import { authApiService } from '@/services/api/authService'
import { clearTokens } from '@/utils/tokenStorage'

/**
 * 登录Hook
 * @returns {object} - 登录mutation对象
 */
export const useLogin = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation(
    // mutation函数
    ({ email, password }) => authApiService.login(email, password),
    // 选项
    {
      onSuccess: (data) => {
        if (data.success) {
          // 更新用户查询缓存
          queryClient.invalidateQueries('currentUser')
          message.success('登录成功！')
          // 导航到首页
          navigate('/')
        }
      },
      onError: (error) => {
        message.error('登录失败: ' + (error.response?.data?.message || error.message))
      }
    }
  )
}

/**
 * 注册Hook
 * @returns {object} - 注册mutation对象
 */
export const useRegister = () => {
  const navigate = useNavigate()
  
  return useMutation(
    // mutation函数
    (userData) => authApiService.register(userData),
    // 选项
    {
      onSuccess: (data) => {
        if (data.success) {
          message.success('注册成功！')
          // 导航到首页
          navigate('/')
        }
      },
      onError: (error) => {
        message.error('注册失败: ' + (error.response?.data?.message || error.message))
      }
    }
  )
}

/**
 * 登出Hook
 * @returns {object} - 登出mutation对象
 */
export const useLogout = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  return useMutation(
    // mutation函数
    () => authApiService.logout(),
    // 选项
    {
      onSuccess: () => {
        // 清除认证令牌
        clearTokens()
        // 清除查询缓存
        queryClient.clear()
        message.success('您已成功登出')
        // 导航到登录页
        navigate('/login')
      },
      onError: () => {
        // 即使API调用失败也清除本地令牌
        clearTokens()
        queryClient.clear()
        message.info('您已登出')
        navigate('/login')
      }
    }
  )
}
