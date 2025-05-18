// src/pages/content/ContentCreatePage.jsx
import React from 'react'
import { Card, Form, Input, Button, Select, Radio, Upload, message } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

const { Option } = Select
const { TextArea } = Input

const ContentCreatePage = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = React.useState(false)
  
  // 处理表单提交
  const handleSubmit = async (values) => {
    setLoading(true)
    try {
      console.log('表单数据:', values)
      
      // 模拟API请求
      setTimeout(() => {
        message.success('内容创建成功！')
        navigate('/content')
        setLoading(false)
      }, 1000)
    } catch (error) {
      message.error('创建失败: ' + (error?.message || '未知错误'))
      setLoading(false)
    }
  }
  
  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1>创建新内容</h1>
        <Button onClick={() => navigate('/content')}>
          返回列表
        </Button>
      </div>
      
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            contentType: '360_video',
            status: 'draft'
          }}
        >
          <Form.Item
            label="标题"
            name={['title', 'zh-CN']}
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请输入内容标题" />
          </Form.Item>
          
          <Form.Item
            label="内容类型"
            name="contentType"
            rules={[{ required: true, message: '请选择内容类型' }]}
          >
            <Select>
              <Option value="180_video">180° 视频</Option>
              <Option value="360_video">360° 视频</Option>
              <Option value="180_photo">180° 照片</Option>
              <Option value="360_photo">360° 照片</Option>
              <Option value="spatial_video">空间视频</Option>
              <Option value="spatial_photo">空间照片</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            label="描述"
            name={['description', 'zh-CN']}
          >
            <TextArea rows={4} placeholder="请输入内容描述" />
          </Form.Item>
          
          <Form.Item
            label="标签"
            name="tags"
          >
            <Select
              mode="tags"
              placeholder="添加标签"
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item
            label="状态"
            name="status"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Radio.Group>
              <Radio value="draft">草稿</Radio>
              <Radio value="pending_review">待审核</Radio>
              <Radio value="published">发布</Radio>
            </Radio.Group>
          </Form.Item>
          
          <Form.Item
            label="媒体文件"
            name="file"
          >
            <Upload
              beforeUpload={() => false}
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              保存
            </Button>
            <Button style={{ marginLeft: 8 }} onClick={() => form.resetFields()}>
              重置
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default ContentCreatePage
