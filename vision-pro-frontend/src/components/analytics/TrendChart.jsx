// src/components/analytics/TrendChart.jsx
import React, { useState } from 'react'
import { Radio, Spin } from 'antd'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import './TrendChart.less'

const TrendChart = ({ data = [], loading = false }) => {
  const [metric, setMetric] = useState('views')
  
  // 如果没有数据，显示加载或空状态
  if (loading) {
    return (
      <div className="chart-loading">
        <Spin />
      </div>
    )
  }
  
  if (!data || data.length === 0) {
    return <div className="no-data">暂无数据</div>
  }
  
  // 指标选项
  const metricOptions = [
    { label: '观看量', value: 'views' },
    { label: '点赞数', value: 'likes' },
    { label: '评论数', value: 'comments' },
    { label: '收藏数', value: 'favorites' }
  ]
  
  // 处理指标切换
  const handleMetricChange = (e) => {
    setMetric(e.target.value)
  }
  
  // 获取当前指标的颜色
  const getMetricColor = () => {
    switch (metric) {
      case 'views':
        return '#1677ff'
      case 'likes':
        return '#ff4d4f'
      case 'comments':
        return '#52c41a'
      case 'favorites':
        return '#faad14'
      default:
        return '#1677ff'
    }
  }
  
  // 格式化提示内容
  const renderTooltip = (props) => {
    const { active, payload, label } = props
    
    if (active && payload && payload.length) {
      const data = payload[0].payload
      
      return (
        <div className="custom-tooltip">
          <p className="tooltip-date">{label}</p>
          <p className="tooltip-metric">
            <span className="tooltip-label">{getMetricLabel(metric)}:</span>
            <span className="tooltip-value">{data[metric]}</span>
          </p>
        </div>
      )
    }
    
    return null
  }
  
  // 获取指标显示名称
  const getMetricLabel = (metric) => {
    const map = {
      views: '观看量',
      likes: '点赞数',
      comments: '评论数',
      favorites: '收藏数'
    }
    return map[metric] || metric
  }
  
  return (
    <div className="trend-chart-wrapper">
      <div className="chart-controls">
        <Radio.Group
          options={metricOptions}
          value={metric}
          onChange={handleMetricChange}
          optionType="button"
          buttonStyle="solid"
        />
      </div>
      
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip content={renderTooltip} />
            <Legend />
            <Line
              type="monotone"
              dataKey={metric}
              stroke={getMetricColor()}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              name={getMetricLabel(metric)}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default TrendChart
