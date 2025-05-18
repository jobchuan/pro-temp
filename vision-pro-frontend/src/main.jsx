// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider } from 'antd'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'
import { Provider } from 'react-redux'
import zhCN from 'antd/lib/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

import { store } from './store'
import { queryClient } from './services/queryClient'
import App from './App'
import './styles/index.less'

// 设置dayjs语言为中文
dayjs.locale('zh-cn')

// 检查是否存在i18n配置并初始化
try {
  const { setupI18n } = require('./locales/i18n')
  setupI18n()
} catch (error) {
  console.warn('i18n初始化失败，将使用默认语言', error)
}

// 确保严格渲染在root元素内
const rootElement = document.getElementById('root')

if (!rootElement) {
  console.error('找不到root元素，请检查index.html文件')
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <ConfigProvider locale={zhCN}>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </ConfigProvider>
          {import.meta.env.DEV && <ReactQueryDevtools />}
        </QueryClientProvider>
      </Provider>
    </React.StrictMode>,
  )
}