// src/pages/settings/AccountSecurityPage.jsx
import React, { useState } from 'react'
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Divider,
  message,
  Space,
  Switch,
  Modal,
  Steps,
  Tabs,
  List,
  Badge,
  Tag
} from 'antd'
import {
  LockOutlined,
  SafetyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ShieldOutlined,
  CheckOutlined,
  MobileOutlined,
  LinkOutlined,
  UnlockOutlined,
  MailOutlined,
  WechatOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'
import { useChangePassword } from '@/hooks/useUser'
import './SettingsPage.less'

const { Title, Text, Paragraph } = Typography
const { TabPane } = Tabs
const { Step } = Steps

const AccountSecurityPage = () => {
  const [passwordForm] = Form.useForm()
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [setupTwoFactorVisible, setSetupTwoFactorVisible] = useState(false)
  const [twoFactorStep, setTwoFactorStep] = useState(0)
  const [verificationCode, setVerificationCode] = useState('')
  
  // 修改密码mutation
  const changePassword = useChangePassword()
  
  // 处理密码修改提交
  const handlePasswordSubmit = async (values) => {
    try {
      await changePassword.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      })
      
      // 成功后清空表单
      passwordForm.resetFields()
    } catch (error) {
      console.error('修改密码失败:', error)
    }
  }
  
  // 处理启用/禁用两步验证
  const handleTwoFactorChange = (checked) => {
    if (checked && !twoFactorEnabled) {
      // 打开设置流程
      setSetupTwoFactorVisible(true)
    } else if (!checked && twoFactorEnabled) {
      // 显示确认对话框
      Modal.confirm({
        title: '确定要关闭两步验证吗？',
        icon: <ExclamationCircleOutlined />,
        content: '关闭两步验证后，您的账户安全性将降低。',
        onOk() {
          setTwoFactorEnabled(false)
          message.success('两步验证已关闭')
        }
      })
    }
  }
  
  // 处理设置两步验证步骤
  const handleTwoFactorSetup = () => {
    // 模拟后续步骤
    if (twoFactorStep < 2) {
      setTwoFactorStep(twoFactorStep + 1)
    } else {
      // 完成设置
      setTwoFactorEnabled(true)
      setSetupTwoFactorVisible(false)
      setTwoFactorStep(0)
      message.success('两步验证已成功设置')
    }
  }
  
  // 关闭设置对话框
  const closeTwoFactorSetup = () => {
    setSetupTwoFactorVisible(false)
    setTwoFactorStep(0)
  }
  
  // 登录设备列表
  const loginDevices = [
    {
      id: 1,
      name: 'MacBook Pro',
      os: 'macOS',
      location: '北京',
      ip: '120.52.xx.xx',
      lastActive: new Date(Date.now() - 5 * 60 * 1000),
      current: true
    },
    {
      id: 2,
      name: 'iPhone 14 Pro',
      os: 'iOS',
      location: '北京',
      ip: '120.52.xx.xx',
      lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
      current: false
    },
    {
      id: 3,
      name: 'Chrome on Windows',
      os: 'Windows',
      location: '上海',
      ip: '114.88.xx.xx',
      lastActive: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      current: false
    }
  ]
  
  // 格式化时间
  const formatTime = (time) => {
    const now = new Date()
    const diff = now - time
    
    // 小于1分钟
    if (diff < 60 * 1000) {
      return '刚刚'
    }
    
    // 小于1小时
    if (diff < 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 1000))}分钟前`
    }
    
    // 小于1天
    if (diff < 24 * 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 60 * 1000))}小时前`
    }
    
    // 小于30天
    if (diff < 30 * 24 * 60 * 60 * 1000) {
      return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`
    }
    
    // 大于30天
    return `${time.getFullYear()}-${time.getMonth() + 1}-${time.getDate()}`
  }
  
  // 登出设备
  const logoutDevice = (deviceId) => {
    message.success('设备已登出')
  }
  
  // 登出所有设备
  const logoutAllDevices = () => {
    Modal.confirm({
      title: '确认登出所有其他设备？',
      icon: <ExclamationCircleOutlined />,
      content: '这将终止所有其他设备上的活动会话，需要重新登录。',
      onOk() {
        message.success('已登出所有其他设备')
      }
    })
  }
  
  return (
    <div className="settings-page security-settings">
      <Title level={2}>账户安全</Title>
      
      <Tabs defaultActiveKey="password">
        <TabPane
          tab={
            <span>
              <LockOutlined />
              密码管理
            </span>
          }
          key="password"
        >
          <Card className="settings-card">
            <Title level={4}>修改密码</Title>
            <Paragraph type="secondary">
              定期更改密码可以提高账户安全性。强密码应包含字母、数字和特殊字符的组合。
            </Paragraph>
            
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handlePasswordSubmit}
            >
              <Form.Item
                name="currentPassword"
                label="当前密码"
                rules={[
                  { required: true, message: '请输入当前密码' }
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="输入当前密码" 
                />
              </Form.Item>
              
              <Form.Item
                name="newPassword"
                label="新密码"
                rules={[
                  { required: true, message: '请输入新密码' },
                  { min: 8, message: '密码至少8个字符' },
                  {
                    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
                    message: '密码必须包含大小写字母和数字'
                  }
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="输入新密码" 
                />
              </Form.Item>
              
              <Form.Item
                name="confirmPassword"
                label="确认新密码"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: '请确认新密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve()
                      }
                      return Promise.reject(new Error('两次输入的密码不一致'))
                    }
                  })
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="确认新密码" 
                />
              </Form.Item>
              
              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={changePassword.isLoading}
                >
                  更新密码
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>
        
        <TabPane
          tab={
            <span>
              <SafetyOutlined />
              登录安全
            </span>
          }
          key="security"
        >
          <Card className="settings-card">
            <Title level={4}>两步验证</Title>
            <Paragraph type="secondary">
              启用两步验证后，登录时除了需要输入密码外，还需要输入手机验证码，提高账户安全性。
            </Paragraph>
            
            <div className="security-option">
              <div className="option-info">
                <div className="option-title">
                  <Text strong>两步验证</Text>
                  {twoFactorEnabled ? (
                    <Tag color="success" icon={<CheckCircleOutlined />}>已启用</Tag>
                  ) : (
                    <Tag color="warning" icon={<CloseCircleOutlined />}>未启用</Tag>
                  )}
                </div>
                <Text type="secondary">
                  {twoFactorEnabled 
                    ? '已绑定手机：138****6789，登录时将发送验证码' 
                    : '未启用两步验证，建议开启以提高账户安全性'}
                </Text>
              </div>
              <Switch 
                checked={twoFactorEnabled} 
                onChange={handleTwoFactorChange}
              />
            </div>
          </Card>
          
          <Card className="settings-card">
            <div className="section-header">
              <Title level={4}>当前登录设备</Title>
              <Button 
                type="primary" 
                danger 
                onClick={logoutAllDevices}
              >
                登出所有其他设备
              </Button>
            </div>
            
            <List
              itemLayout="horizontal"
              dataSource={loginDevices}
              renderItem={(device) => (
                <List.Item
                  actions={[
                    device.current ? (
                      <Tag color="processing">当前设备</Tag>
                    ) : (
                      <Button 
                        type="link" 
                        danger
                        onClick={() => logoutDevice(device.id)}
                      >
                        登出
                      </Button>
                    )
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Badge 
                        status={device.current ? "processing" : "default"} 
                        offset={[0, 0]}
                      >
                        <ShieldOutlined style={{ fontSize: 24 }} />
                      </Badge>
                    }
                    title={
                      <Space>
                        <span>{device.name}</span>
                        {device.current && <Tag color="blue">当前设备</Tag>}
                      </Space>
                    }
                    description={
                      <div className="device-info">
                        <div>
                          <Text type="secondary">
                            {device.os} · {device.location} · IP: {device.ip}
                          </Text>
                        </div>
                        <div>
                          <Text type="secondary">
                            <ClockCircleOutlined /> 最近活动: {formatTime(device.lastActive)}
                          </Text>
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </TabPane>
        
        <TabPane
          tab={
            <span>
              <LinkOutlined />
              关联账号
            </span>
          }
          key="connections"
        >
          <Card className="settings-card">
            <Title level={4}>关联账号</Title>
            <Paragraph type="secondary">
              关联其他平台账号，可以使用这些账号直接登录。
            </Paragraph>
            
            <List
              itemLayout="horizontal"
              dataSource={[
                {
                  name: '微信',
                  icon: <WechatOutlined style={{ color: '#07C160' }} />,
                  connected: true,
                  info: '已关联: WeChat_User'
                },
                {
                  name: '邮箱',
                  icon: <MailOutlined style={{ color: '#1677FF' }} />,
                  connected: true,
                  info: '已验证: user@example.com'
                },
                {
                  name: '手机',
                  icon: <MobileOutlined style={{ color: '#FA541C' }} />,
                  connected: true,
                  info: '已绑定: 138****6789'
                }
              ]}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    item.connected ? (
                      <Button>解绑</Button>
                    ) : (
                      <Button type="primary">关联</Button>
                    )
                  ]}
                >
                  <List.Item.Meta
                    avatar={item.icon}
                    title={item.name}
                    description={
                      item.connected ? (
                        <div>
                          <Tag color="success" icon={<CheckOutlined />}>已关联</Tag>
                          <Text type="secondary" style={{ marginLeft: 8 }}>{item.info}</Text>
                        </div>
                      ) : (
                        <Text type="secondary">未关联</Text>
                      )
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </TabPane>
      </Tabs>
      
      {/* 两步验证设置对话框 */}
      <Modal
        title="设置两步验证"
        open={setupTwoFactorVisible}
        onCancel={closeTwoFactorSetup}
        footer={null}
        destroyOnClose
      >
        <Steps current={twoFactorStep} className="two-factor-steps">
          <Step title="验证身份" />
          <Step title="绑定手机" />
          <Step title="完成设置" />
        </Steps>
        
        <div className="steps-content" style={{ marginTop: 24, marginBottom: 24 }}>
          {twoFactorStep === 0 && (
            <div className="step-form">
              <Paragraph>
                为确保是您本人操作，请先验证当前密码。
              </Paragraph>
              <Form layout="vertical">
                <Form.Item
                  label="当前密码"
                  name="verifyPassword"
                  rules={[{ required: true, message: '请输入当前密码' }]}
                >
                  <Input.Password placeholder="输入当前密码" />
                </Form.Item>
              </Form>
            </div>
          )}
          
          {twoFactorStep === 1 && (
            <div className="step-form">
              <Paragraph>
                请输入您的手机号码，我们将发送验证码确认。
              </Paragraph>
              <Form layout="vertical">
                <Form.Item
                  label="手机号码"
                  name="phoneNumber"
                  rules={[
                    { required: true, message: '请输入手机号码' },
                    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' }
                  ]}
                >
                  <Input placeholder="输入手机号码" />
                </Form.Item>
                
                <Form.Item
                  label="验证码"
                  name="verificationCode"
                  rules={[
                    { required: true, message: '请输入验证码' },
                    { pattern: /^\d{6}$/, message: '验证码应为6位数字' }
                  ]}
                  extra={
                    <Button type="link" style={{ padding: 0 }}>
                      获取验证码
                    </Button>
                  }
                >
                  <Input placeholder="输入验证码" onChange={(e) => setVerificationCode(e.target.value)} />
                </Form.Item>
              </Form>
            </div>
          )}
          
          {twoFactorStep === 2 && (
            <div className="step-completed">
              <div className="success-icon">
                <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
              </div>
              <Title level={4}>设置成功</Title>
              <Paragraph>
                两步验证已成功设置，下次登录时将需要输入手机验证码。
              </Paragraph>
              <Paragraph type="secondary">
                请妥善保管您的手机，确保能够正常接收短信。
              </Paragraph>
            </div>
          )}
        </div>
        
        <div className="steps-action">
          {twoFactorStep < 2 && (
            <Button type="primary" onClick={handleTwoFactorSetup}>
              {twoFactorStep === 1 && verificationCode ? '验证' : '下一步'}
            </Button>
          )}
          
          {twoFactorStep === 2 && (
            <Button type="primary" onClick={closeTwoFactorSetup}>
              完成
            </Button>
          )}
          
          {twoFactorStep > 0 && (
            <Button style={{ marginLeft: 8 }} onClick={() => setTwoFactorStep(twoFactorStep - 1)}>
              上一步
            </Button>
          )}
          
          <Button style={{ marginLeft: 8 }} onClick={closeTwoFactorSetup}>
            取消
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default AccountSecurityPage
