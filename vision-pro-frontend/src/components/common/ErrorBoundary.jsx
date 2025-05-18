// src/components/common/ErrorBoundary.jsx
import React, { Component } from 'react'
import { Result, Button } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'

/**
 * 错误边界组件，用于捕获子组件树中的JavaScript错误，并显示备用UI
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('组件错误:', error)
    console.error('组件堆栈:', errorInfo.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <Result
        status="error"
        title="页面出错了"
        subTitle="抱歉，页面渲染时发生了错误"
        extra={[
          <Button 
            key="reset" 
            type="primary" 
            onClick={this.handleReset}
          >
            尝试恢复
          </Button>,
          <Button 
            key="reload" 
            onClick={this.handleReload}
            icon={<ReloadOutlined />}
          >
            刷新页面
          </Button>
        ]}
      />
    )
  }
}

export default ErrorBoundary
