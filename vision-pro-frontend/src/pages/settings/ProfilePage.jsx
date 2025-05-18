// src/pages/settings/ProfilePage.jsx
import React, { useState, useEffect } from 'react'
import {
  Card,
  Form,
  Input,
  Button,
  Upload,
  Avatar,
  Typography,
  Row,
  Col,
  Tabs,
  Divider,
  message,
  Skeleton,
  Alert
} from 'antd'
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  GlobalOutlined,
  UploadOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useCurrentUser, useUpdateProfile } from '@/hooks/useUser'
import './SettingsPage.less'

const { Title, Text } = Typography
const { TabPane } = Tabs
const { TextArea } = Input

const ProfilePage = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [avatarUrl, setAvatarUrl] = useState('')
  const [fileList, setFileList] = useState([])
  const [editMode, setEditMode] = useState(false)
  
  // 获取当前用户数据
  const { data: userData, isLoading: isUserLoading } = useCurrentUser()
  
  // 更新用户资料mutation
  const updateProfile = useUpdateProfile()
  
  // 用户数据加载完成后设置表单初始值
  useEffect(() => {
    if (userData?.profile) {
      const profile = userData.profile
      
      form.setFieldsValue({
        displayName: profile.displayName,
        bio: profile.bio,
        website: profile.website,
        phoneNumber: profile.phoneNumber,
        location: profile.location,
        company: profile.company,
        socialLinks: {
          wechat: profile.socialLinks?.wechat || '',
          weibo: profile.socialLinks?.weibo || '',
          twitter: profile.socialLinks?.twitter || '',
          instagram: profile.socialLinks?.instagram || ''
        }
      })
      
      if (profile.avatar) {
        setAvatarUrl(profile.avatar)
      }
    }
  }, [userData, form])
  
  // 处理头像上传前预览
  const beforeUpload = (file) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png'
    if (!isJpgOrPng) {
      message.error('只能上传JPG/PNG格式的图片!')
    }
    
    const isLt2M = file.size / 1024 / 1024 < 2
    if (!isLt2M) {
      message.error('图片大小不能超过2MB!')
    }
    
    if (isJpgOrPng && isLt2M) {
      // 预览图片
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        setAvatarUrl(reader.result)
      }
      setFileList([file])
    }
    
    // 阻止默认上传行为
    return false
  }
  
  // 处理表单提交
  const handleSubmit = async (values) => {
    try {
      // 构建表单数据
      const formData = new FormData()
      
      // 添加基本数据
      Object.keys(values).forEach(key => {
        if (key !== 'socialLinks' && values[key] !== undefined) {
          formData.append(key, values[key])
        }
      })
      
      // 添加社交链接
      if (values.socialLinks) {
        Object.keys(values.socialLinks).forEach(platform => {
          if (values.socialLinks[platform]) {
            formData.append(`socialLinks[${platform}]`, values.socialLinks[platform])
          }
        })
      }
      
      // 添加头像
      if (fileList.length > 0) {
        formData.append('avatar', fileList[0])
      }
      
      // 提交更新
      await updateProfile.mutateAsync(formData)
      
      // 退出编辑模式
      setEditMode(false)
      message.success('个人资料已更新')
    } catch (error) {
      console.error('更新资料失败:', error)
    }
  }
  
  // 取消编辑
  const handleCancel = () => {
    // 重置表单和头像
    form.resetFields()
    if (userData?.profile?.avatar) {
      setAvatarUrl(userData.profile.avatar)
    } else {
      setAvatarUrl('')
    }
    setFileList([])
    setEditMode(false)
  }
  
  // 渲染头像上传组件
  const renderAvatarUpload = () => {
    const uploadButton = (
      <div>
        <UploadOutlined />
        <div style={{ marginTop: 8 }}>上传头像</div>
      </div>
    )
    
    return (
      <Upload
        name="avatar"
        listType="picture-card"
        showUploadList={false}
        beforeUpload={beforeUpload}
        fileList={fileList}
        disabled={!editMode}
      >
        {avatarUrl ? (
          <Avatar
            src={avatarUrl}
            alt="用户头像"
            size={100}
            icon={<UserOutlined />}
          />
        ) : (
          uploadButton
        )}
      </Upload>
    )
  }
  
  return (
    <div className="settings-page profile-settings">
      <Title level={2}>个人资料</Title>
      
      <Card className="settings-card">
        {isUserLoading ? (
          <Skeleton avatar paragraph={{ rows: 6 }} active />
        ) : (
          <Row gutter={[24, 24]}>
            {/* 头像上传区域 */}
            <Col xs={24} sm={8} md={6}>
              <div className="avatar-container">
                {renderAvatarUpload()}
                {editMode ? (
                  <Text type="secondary">点击更换头像</Text>
                ) : (
                  <Button 
                    type="primary" 
                    icon={<EditOutlined />} 
                    onClick={() => setEditMode(true)}
                    style={{ marginTop: 16 }}
                  >
                    编辑资料
                  </Button>
                )}
              </div>
            </Col>
            
            {/* 资料表单区域 */}
            <Col xs={24} sm={16} md={18}>
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{
                  displayName: '',
                  bio: '',
                  website: '',
                  phoneNumber: '',
                  location: '',
                  company: '',
                  socialLinks: {
                    wechat: '',
                    weibo: '',
                    twitter: '',
                    instagram: ''
                  }
                }}
              >
                {/* 基本信息 */}
                <div className="profile-section">
                  <h3 className="section-title">基本信息</h3>
                  
                  <Form.Item
                    name="displayName"
                    label="显示名称"
                    rules={[
                      { required: true, message: '请输入显示名称' },
                      { max: 30, message: '显示名称不能超过30个字符' }
                    ]}
                  >
                    <Input 
                      prefix={<UserOutlined />} 
                      placeholder="您的显示名称" 
                      disabled={!editMode}
                    />
                  </Form.Item>
                  
                  <Form.Item
                    name="bio"
                    label="个人简介"
                    rules={[
                      { max: 200, message: '个人简介不能超过200个字符' }
                    ]}
                  >
                    <TextArea
                      placeholder="简单介绍一下自己"
                      autoSize={{ minRows: 3, maxRows: 6 }}
                      disabled={!editMode}
                    />
                  </Form.Item>
                  
                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="website"
                        label="个人网站"
                        rules={[
                          { type: 'url', message: '请输入有效的网址' }
                        ]}
                      >
                        <Input 
                          prefix={<GlobalOutlined />} 
                          placeholder="https://" 
                          disabled={!editMode}
                        />
                      </Form.Item>
                    </Col>
                    
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="phoneNumber"
                        label="手机号码"
                        rules={[
                          { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' }
                        ]}
                      >
                        <Input 
                          prefix={<PhoneOutlined />} 
                          placeholder="联系电话" 
                          disabled={!editMode}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  
                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="location"
                        label="所在地"
                      >
                        <Input 
                          placeholder="城市，地区" 
                          disabled={!editMode}
                        />
                      </Form.Item>
                    </Col>
                    
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="company"
                        label="公司/组织"
                      >
                        <Input 
                          placeholder="您的工作单位" 
                          disabled={!editMode}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
                
                <Divider />
                
                {/* 社交链接 */}
                <div className="profile-section">
                  <h3 className="section-title">社交链接</h3>
                  
                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name={['socialLinks', 'wechat']}
                        label="微信公众号"
                      >
                        <Input 
                          placeholder="微信公众号ID" 
                          disabled={!editMode}
                        />
                      </Form.Item>
                    </Col>
                    
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name={['socialLinks', 'weibo']}
                        label="微博"
                      >
                        <Input 
                          placeholder="微博用户名" 
                          disabled={!editMode}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  
                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name={['socialLinks', 'twitter']}
                        label="Twitter"
                      >
                        <Input 
                          placeholder="Twitter用户名" 
                          disabled={!editMode}
                        />
                      </Form.Item>
                    </Col>
                    
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name={['socialLinks', 'instagram']}
                        label="Instagram"
                      >
                        <Input 
                          placeholder="Instagram用户名" 
                          disabled={!editMode}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
                
                {/* 提交按钮 */}
                {editMode && (
                  <div className="form-actions">
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      icon={<SaveOutlined />}
                      loading={updateProfile.isLoading}
                    >
                      保存更改
                    </Button>
                    <Button 
                      onClick={handleCancel} 
                      icon={<CloseOutlined />}
                      style={{ marginLeft: 16 }}
                    >
                      取消
                    </Button>
                  </div>
                )}
              </Form>
            </Col>
          </Row>
        )}
      </Card>
      
      {/* 账户设置入口 */}
      <Card className="settings-card account-settings-card">
        <div className="settings-link">
          <div className="link-info">
            <Title level={4}>账户安全设置</Title>
            <Text type="secondary">修改密码、两步验证等安全设置</Text>
          </div>
          <Button 
            type="primary" 
            ghost
            onClick={() => navigate('/settings/security')}
          >
            前往设置
          </Button>
        </div>
        
        <Divider />
        
        <div className="settings-link">
          <div className="link-info">
            <Title level={4}>通知设置</Title>
            <Text type="secondary">管理邮件、浏览器和应用通知</Text>
          </div>
          <Button 
            type="primary" 
            ghost
            onClick={() => navigate('/settings/notifications')}
          >
            前往设置
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default ProfilePage
