// src/components/content/ContentStatusTag.jsx
import React from 'react'
import { Tag } from 'antd'
import {
  EditOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  InboxOutlined
} from '@ant-design/icons'

const ContentStatusTag = ({ status }) => {
  // 配置状态标签属性
  const statusConfig = {
    draft: {
      color: 'default',
      icon: <EditOutlined />,
      text: '草稿'
    },
    pending_review: {
      color: 'warning',
      icon: <ClockCircleOutlined />,
      text: '待审核'
    },
    approved: {
      color: 'processing',
      icon: <CheckCircleOutlined />,
      text: '已批准'
    },
    published: {
      color: 'success',
      icon: <CheckCircleOutlined />,
      text: '已发布'
    },
    rejected: {
      color: 'error',
      icon: <CloseCircleOutlined />,
      text: '已拒绝'
    },
    archived: {
      color: '#666',
      icon: <InboxOutlined />,
      text: '已归档'
    }
  }
  
  // 根据状态获取对应的配置，默认为草稿
  const config = statusConfig[status] || statusConfig.draft
  
  return (
    <Tag color={config.color} icon={config.icon}>
      {config.text}
    </Tag>
  )
}

export default ContentStatusTag
