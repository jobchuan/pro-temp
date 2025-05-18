// src/pages/settings/NotificationSettingsPage.jsx
import React, { useState } from 'react'
import {
  Card,
  Form,
  Switch,
  TimePicker,
  Button,
  Divider,
  Typography,
  Radio,
  Checkbox,
  message,
  Skeleton,
  Alert,
  Space
} from 'antd'
import {
  BellOutlined,
  MailOutlined,
  MobileOutlined,
  WechatOutlined,
  MoonOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useNotificationSettings, useUpdateNotificationSettings } from '@/hooks/useNotification'
import './SettingsPage.less'

const { Title, Text } = Typography

const NotificationSettingsPage = () => {
  const [form] = Form.useForm()
  const [doNotDisturbEnabled, setDoNotDisturbEnabled] = useState(false)
  
  // 获取通知设置
  const { data: settingsData, isLoading: isSettingsLoading } = useNotificationSettings()
  
  // 更新通知设置mutation
  const updateSettings = useUpdateNotificationSettings()
  
  // 当设置加载完成时，设置表单初始值
  React.useEffect(() => {
    if (settingsData?.success && settingsData?.data) {
      const settings = settingsData.data
      
      // 设置表单初始值
      form.setFieldsValue({
        email: settings.email,
        browser: settings.browser,
        sms: settings.sms,
        wechat: settings.wechat,
        doNotDisturb: {
          enabled: settings.doNotDisturb?.enabled || false,
          startTime: settings.doNotDisturb?.startTime ? dayjs(settings.doNotDisturb.startTime, 'HH:mm') : dayjs('22:00', 'HH:mm'),
          endTime: settings.doNotDisturb?.endTime ? dayjs(settings.doNotDisturb.endTime, 'HH:mm') : dayjs('08:00', 'HH:mm')
        },
        notifyTypes: settings.notifyTypes || ['comment', 'like', 'follow', 'collaboration', 'system', 'income']
      })
      
      // 更新勿扰模式状态
      setDoNotDisturbEnabled(settings.doNotDisturb?.enabled || false)
    }
  }, [settingsData, form])
  
  // 处理勿扰模式开关变化
  const handleDoNotDisturbChange = (checked) => {
    setDoNotDisturbEnabled(checked)
  }
  
  // 处理表单提交
  const handleSubmit = async (values) => {
    try {
      // 转换时间格式
      const formattedValues = {
        ...values,
        doNotDisturb: {
          enabled: values.doNotDisturb.enabled,
          startTime: values.doNotDisturb.startTime.format('HH:mm'),
          endTime: values.doNotDisturb.endTime.format('HH:mm')
        }
      }
      
      await updateSettings.mutateAsync(formattedValues)
    } catch (error) {
      console.error('更新设置失败:', error)
    }
  }
  
  // 通知类型选项
  const notifyTypeOptions = [
    { label: '评论通知', value: 'comment' },
    { label: '点赞通知', value: 'like' },
    { label: '关注通知', value: 'follow' },
    { label: '协作通知', value: 'collaboration' },
    { label: '系统通知', value: 'system' },
    { label: '收入通知', value: 'income' }
  ]
  
  return (
    <div className="settings-page notification-settings">
      <Title level={2}>通知设置</Title>
      
      {isSettingsLoading ? (
        <Card>
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      ) : (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            email: true,
            browser: true,
            sms: false,
            wechat: true,
            doNotDisturb: {
              enabled: false,
              startTime: dayjs('22:00', 'HH:mm'),
              endTime: dayjs('08:00', 'HH:mm')
            },
            notifyTypes: ['comment', 'like', 'follow', 'collaboration', 'system', 'income']
          }}
        >
          <Card title="通知方式" className="settings-card">
            <Form.Item
              name="email"
              label="电子邮件通知"
              valuePropName="checked"
            >
              <Switch checkedChildren="开" unCheckedChildren="关" />
            </Form.Item>
            
            <Form.Item
              name="browser"
              label="浏览器通知"
              valuePropName="checked"
              extra="在浏览器中显示通知提醒"
            >
              <Switch checkedChildren="开" unCheckedChildren="关" />
            </Form.Item>
            
            <Form.Item
              name="sms"
              label="短信通知"
              valuePropName="checked"
              extra="重要通知将通过短信发送（可能产生额外费用）"
            >
              <Switch checkedChildren="开" unCheckedChildren="关" />
            </Form.Item>
            
            <Form.Item
              name="wechat"
              label="微信通知"
              valuePropName="checked"
              extra="通过已绑定的微信账号接收通知"
            >
              <Switch checkedChildren="开" unCheckedChildren="关" />
            </Form.Item>
          </Card>
          
          <Card title="免打扰时间" className="settings-card">
            <Alert
              message="在免打扰时间内，您将不会收到任何通知提醒，但仍可以在通知中心查看"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Form.Item
              name={['doNotDisturb', 'enabled']}
              valuePropName="checked"
            >
              <Switch 
                checkedChildren="开启免打扰" 
                unCheckedChildren="关闭免打扰" 
                onChange={handleDoNotDisturbChange}
              />
            </Form.Item>
            
            {doNotDisturbEnabled && (
              <Space className="time-range-picker">
                <Form.Item
                  name={['doNotDisturb', 'startTime']}
                  label="开始时间"
                  rules={[{ required: true, message: '请选择开始时间' }]}
                >
                  <TimePicker
                    format="HH:mm"
                    minuteStep={15}
                    placeholder="开始时间"
                  />
                </Form.Item>
                
                <Text>至</Text>
                
                <Form.Item
                  name={['doNotDisturb', 'endTime']}
                  label="结束时间"
                  rules={[{ required: true, message: '请选择结束时间' }]}
                >
                  <TimePicker
                    format="HH:mm"
                    minuteStep={15}
                    placeholder="结束时间"
                  />
                </Form.Item>
              </Space>
            )}
          </Card>
          
          <Card title="通知类型设置" className="settings-card">
            <Alert
              message="选择您希望接收的通知类型"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Form.Item
              name="notifyTypes"
            >
              <Checkbox.Group options={notifyTypeOptions} />
            </Form.Item>
          </Card>
          
          <div className="form-actions">
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={updateSettings.isLoading}
              size="large"
            >
              保存设置
            </Button>
          </div>
        </Form>
      )}
    </div>
  )
}

export default NotificationSettingsPage
