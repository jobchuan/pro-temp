// src/hooks/useContent.js
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from 'react-query'
import { message } from 'antd'
import { contentApiService } from '@/services/api/contentService'

/**
 * 获取内容列表Hook
 * @param {object} params - 查询参数
 * @returns {object} - 查询结果
 */
export const useContentList = (params) => {
  return useQuery(
    ['contentList', params],
    () => contentApiService.getContentList(params),
    {
      staleTime: 60 * 1000, // 1分钟内不重新获取
      keepPreviousData: true, // 在加载新数据时保留旧数据
      refetchOnWindowFocus: false // 窗口聚焦时不重新获取
    }
  )
}

/**
 * 获取用户内容列表Hook
 * @param {object} params - 查询参数
 * @returns {object} - 查询结果
 */
export const useUserContentList = (params) => {
  return useQuery(
    ['userContentList', params],
    () => contentApiService.getUserContentList(params),
    {
      staleTime: 60 * 1000, // 1分钟内不重新获取
      keepPreviousData: true, // 在加载新数据时保留旧数据
      refetchOnWindowFocus: false // 窗口聚焦时不重新获取
    }
  )
}

/**
 * 获取用户内容列表（无限滚动版本）Hook
 * @param {object} params - 查询参数
 * @returns {object} - 无限查询结果
 */
export const useUserContentInfiniteList = (params) => {
  return useInfiniteQuery(
    ['userContentInfiniteList', params],
    async ({ pageParam = 1 }) => {
      const response = await contentApiService.getUserContentList({
        ...params,
        page: pageParam
      })
      return response
    },
    {
      getNextPageParam: (lastPage) => {
        const { pagination } = lastPage.data
        return pagination.page < pagination.pages ? pagination.page + 1 : undefined
      },
      staleTime: 60 * 1000, // 1分钟内不重新获取
      refetchOnWindowFocus: false // 窗口聚焦时不重新获取
    }
  )
}

/**
 * 获取内容详情Hook
 * @param {string} contentId - 内容ID
 * @param {boolean} enabled - 是否启用查询
 * @returns {object} - 查询结果
 */
export const useContentDetail = (contentId, enabled = true) => {
  return useQuery(
    ['contentDetail', contentId],
    () => contentApiService.getContentDetail(contentId),
    {
      enabled: enabled && !!contentId,
      staleTime: 2 * 60 * 1000, // 2分钟内不重新获取
      refetchOnWindowFocus: false // 窗口聚焦时不重新获取
    }
  )
}

/**
 * 创建内容Hook
 * @returns {object} - mutation对象
 */
export const useCreateContent = () => {
  const queryClient = useQueryClient()
  
  return useMutation(
    // mutation函数
    (data) => contentApiService.createContent(data),
    // 选项
    {
      onSuccess: (response) => {
        if (response.success) {
          // 更新内容列表缓存
          queryClient.invalidateQueries('userContentList')
          message.success('内容创建成功')
        }
      },
      onError: (error) => {
        message.error('创建失败: ' + (error.response?.data?.message || error.message))
      }
    }
  )
}

/**
 * 更新内容Hook
 * @returns {object} - mutation对象
 */
export const useUpdateContent = () => {
  const queryClient = useQueryClient()
  
  return useMutation(
    // mutation函数
    ({ contentId, data }) => contentApiService.updateContent(contentId, data),
    // 选项
    {
      onSuccess: (response, variables) => {
        if (response.success) {
          // 更新内容详情和列表缓存
          queryClient.invalidateQueries(['contentDetail', variables.contentId])
          queryClient.invalidateQueries('userContentList')
          message.success('内容已更新')
        }
      },
      onError: (error) => {
        message.error('更新失败: ' + (error.response?.data?.message || error.message))
      }
    }
  )
}

/**
 * 删除内容Hook
 * @returns {object} - mutation对象
 */
export const useDeleteContent = () => {
  const queryClient = useQueryClient()
  
  return useMutation(
    // mutation函数
    (contentId) => contentApiService.deleteContent(contentId),
    // 选项
    {
      onSuccess: (response) => {
        if (response.success) {
          // 更新内容列表缓存
          queryClient.invalidateQueries('userContentList')
          message.success('内容已删除')
        }
      },
      onError: (error) => {
        message.error('删除失败: ' + (error.response?.data?.message || error.message))
      }
    }
  )
}

/**
 * 批量更新内容状态Hook
 * @returns {object} - mutation对象
 */
export const useBatchUpdateStatus = () => {
  const queryClient = useQueryClient()
  
  return useMutation(
    // mutation函数
    ({ contentIds, status }) => contentApiService.batchUpdateStatus(contentIds, status),
    // 选项
    {
      onSuccess: (response) => {
        if (response.success) {
          // 更新内容列表缓存
          queryClient.invalidateQueries('userContentList')
          message.success(`已成功更新 ${response.data.updatedCount} 个内容`)
        }
      }
    }
  )
}

/**
 * 批量添加标签Hook
 * @returns {object} - mutation对象
 */
export const useBatchAddTags = () => {
  const queryClient = useQueryClient()
  
  return useMutation(
    // mutation函数
    ({ contentIds, tags }) => contentApiService.batchAddTags(contentIds, tags),
    // 选项
    {
      onSuccess: (response) => {
        if (response.success) {
          // 更新内容列表缓存
          queryClient.invalidateQueries('userContentList')
          message.success(`已成功添加标签到 ${response.data.updatedCount} 个内容`)
        }
      }
    }
  )
}
