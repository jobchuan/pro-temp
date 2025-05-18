// src/services/queryClient.js
import { QueryClient } from 'react-query'

// 创建和配置查询客户端
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // 窗口聚焦时不重新获取
      retry: 1, // 失败后最多重试1次
      staleTime: 60 * 1000, // 数据1分钟内视为新鲜
    },
  },
})
