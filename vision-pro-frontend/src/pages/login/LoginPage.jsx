// src/pages/login/LoginPage.jsx
import React from 'react'
import { Form, Input, Button, Card, Checkbox, Row, Col, Typography, Divider, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { useLogin } from '@/hooks/useAuth'
import './LoginPage.less'

const { Title, Text } = Typography

const LoginPage = () => {
  const [form] = Form.useForm()
  const login = useLogin()
  
  const handleSubmit = async (values) => {
    try {
      await login.mutateAsync({
        email: values.email,
        password: values.password
      })
    } catch (error) {
      // 错误处理在hook中已经完成
      console.error('登录失败:', error)
    }
  }
  
  return (
    <div className="login-page">
      <div className="login-container">
        <Row gutter={24} className="login-row">
          <Col xs={24} sm={24} md={12} lg={12} xl={12} className="login-banner">
            <div className="banner-content">
              <Title level={2}>Vision Pro 创作者平台</Title>
              <Text>一站式VR内容创作与管理平台</Text>
              <div className="banner-features">
                <div className="feature-item">
                  <div className="feature-icon">🎬</div>
                  <div className="feature-text">管理VR内容</div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">📊</div>
                  <div className="feature-text">内容分析</div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">👥</div>
                  <div className="feature-text">团队协作</div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">💰</div>
                  <div className="feature-text">收入管理</div>
                </div>
              </div>
            </div>
          </Col>
          
          <Col xs={24} sm={24} md={12} lg={12} xl={12} className="login-form-container">
            <Card bordered={false} className="login-card">
              <div className="login-header">
                <Title level={3}>欢迎回来</Title>
                <Text type="secondary">登录您的创作者账户</Text>
              </div>
              
              <Form
                form={form}
                name="login"
                initialValues={{ remember: true }}
                onFinish={handleSubmit}
                layout="vertical"
              >
                <Form.Item
                  name="email"
                  rules={[
                    { required: true, message: '请输入邮箱地址' },
                    { type: 'email', message: '请输入有效的邮箱地址' }
                  ]}
                >
                  <Input 
                    prefix={<UserOutlined className="site-form-item-icon" />} 
                    placeholder="邮箱地址" 
                    size="large"
                  />
                </Form.Item>
                
                <Form.Item
                  name="password"
                  rules={[{ required: true, message: '请输入密码' }]}
                >
                  <Input.Password
                    prefix={<LockOutlined className="site-form-item-icon" />}
                    placeholder="密码"
                    size="large"
                  />
                </Form.Item>
                
                <Form.Item>
                  <div className="login-form-options">
                    <Form.Item name="remember" valuePropName="checked" noStyle>
                      <Checkbox>记住我</Checkbox>
                    </Form.Item>
                    
                    <Link to="/forgot-password" className="login-form-forgot">
                      忘记密码?
                    </Link>
                  </div>
                </Form.Item>
                
                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    className="login-form-button"
                    loading={login.isLoading}
                    size="large"
                  >
                    登录
                  </Button>
                </Form.Item>
                
                <Divider plain>或者</Divider>
                
                <div className="social-login">
                  <Button className="social-button wechat">
                    微信登录
                  </Button>
                  <Button className="social-button alipay">
                    支付宝登录
                  </Button>
                </div>
                
                <div className="login-form-register">
                  <Text type="secondary">还没有账号?</Text> <Link to="/register">立即注册</Link>
                </div>
              </Form>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  )
}

export default LoginPage
