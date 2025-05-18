// src/pages/fusion/FusionEditPage.jsx
import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Select, 
  Row, 
  Col, 
  Tabs, 
  Switch, 
  Spin, 
  Upload,
  Divider,
  Alert,
  Tag,
  Table,
  Radio,
  Menu,
  Dropdown,
  Space,
  Empty,
  message,
  Modal,
  List,
  Typography,
  Tooltip
} from 'antd'
import { 
  SaveOutlined, 
  LinkOutlined, 
  UploadOutlined, 
  PlusOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  EditOutlined,
  EyeOutlined,
  DownOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  SettingOutlined,
  DragOutlined,
  ImportOutlined,
  FileSearchOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { fusionApiService } from '@/services/api/fusionService'
import { contentApiService } from '@/services/api/contentService'
import MediaUploader from '@/components/upload/MediaUploader'
import './FusionEditPage.less'

const { Option } = Select
const { TabPane } = Tabs
const { TextArea } = Input
const { Title, Text, Paragraph } = Typography

const FusionEditPage = () => {
  const { fusionId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form] = Form.useForm()
  const [activeTab, setActiveTab] = useState('basic')
  const [selectedSourceType, setSelectedSourceType] = useState('content')
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false)
  const [selectContentModalVisible, setSelectContentModalVisible] = useState(false)
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false)
  const [sourceToDelete, setSourceToDelete] = useState(null)
  const [selectedContents, setSelectedContents] = useState([])
  const [contentFilters, setContentFilters] = useState({
    keyword: '',
    contentType: undefined,
    page: 1,
    limit: 10
  })
  
  // 判断是否是创建模式
  const isCreateMode = !fusionId
  
  // 获取融合内容详情
  const { 
    data: fusionData, 
    isLoading: isFusionLoading, 
    error: fusionError 
  } = useQuery(
    ['fusionDetail', fusionId],
    () => fusionApiService.getFusionDetail(fusionId),
    {
      enabled: !isCreateMode,
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        if (data?.data) {
          // 初始化表单数据
          form.setFieldsValue({
            title: data.data.title,
            description: data.data.description,
            fusionType: data.data.fusionType,
            settings: data.data.settings || {},
            isPublic: data.data.isPublic
          })
        }
      }
    }
  )
  
  // 获取融合内容源列表
  const { 
    data: sourcesData, 
    isLoading: isSourcesLoading 
  } = useQuery(
    ['fusionSources', fusionId],
    () => fusionApiService.getFusionSources(fusionId),
    {
      enabled: !isCreateMode && !!fusionId,
      refetchOnWindowFocus: false
    }
  )
  
  // 获取内容列表（用于选择内容）
  const { 
    data: contentsData, 
    isLoading: isContentsLoading 
  } = useQuery(
    ['contentsList', contentFilters],
    () => contentApiService.getUserContentList(contentFilters),
    {
      enabled: selectContentModalVisible,
      keepPreviousData: true,
      refetchOnWindowFocus: false
    }
  )
  
  // 创建融合内容mutation
  const createFusionMutation = useMutation(
    (data) => fusionApiService.createFusion(data),
    {
      onSuccess: (response) => {
        message.success('融合内容创建成功')
        
        // 创建成功后跳转到编辑页
        const newFusionId = response.data?.id
        if (newFusionId) {
          navigate(`/fusion/edit/${newFusionId}`)
        } else {
          navigate('/fusion')
        }
      },
      onError: (error) => {
        message.error('创建失败: ' + error.message)
        setIsSaving(false)
        setIsPublishing(false)
      }
    }
  )
  
  // 更新融合内容mutation
  const updateFusionMutation = useMutation(
    ({ id, data }) => fusionApiService.updateFusion(id, data),
    {
      onSuccess: () => {
        message.success('保存成功')
        queryClient.invalidateQueries(['fusionDetail', fusionId])
        setIsSaving(false)
        setIsPublishing(false)
      },
      onError: (error) => {
        message.error('保存失败: ' + error.message)
        setIsSaving(false)
        setIsPublishing(false)
      }
    }
  )
  
  // 添加融合源mutation
  const addSourceMutation = useMutation(
    (data) => fusionApiService.addFusionSource(fusionId, data),
    {
      onSuccess: () => {
        message.success('源内容添加成功')
        setSelectContentModalVisible(false)
        setSelectedContents([])
        queryClient.invalidateQueries(['fusionSources', fusionId])
      },
      onError: (error) => {
        message.error('添加失败: ' + error.message)
      }
    }
  )
  
  // 删除融合源mutation
  const deleteSourceMutation = useMutation(
    (sourceId) => fusionApiService.deleteFusionSource(fusionId, sourceId),
    {
      onSuccess: () => {
        message.success('源内容已移除')
        setConfirmDeleteVisible(false)
        setSourceToDelete(null)
        queryClient.invalidateQueries(['fusionSources', fusionId])
      },
      onError: (error) => {
        message.error('移除失败: ' + error.message)
      }
    }
  )
  
  // 更新融合源顺序mutation
  const updateSourceOrderMutation = useMutation(
    (data) => fusionApiService.updateFusionSourceOrder(fusionId, data),
    {
      onSuccess: () => {
        message.success('顺序已更新')
        queryClient.invalidateQueries(['fusionSources', fusionId])
      },
      onError: (error) => {
        message.error('更新失败: ' + error.message)
      }
    }
  )
  
  // 处理表单提交
  const handleSubmit = (values, isPublish = false) => {
    if (isCreateMode) {
      // 创建模式
      if (isPublish) {
        setIsPublishing(true)
      } else {
        setIsSaving(true)
      }
      
      createFusionMutation.mutate({
        ...values,
        status: isPublish ? 'published' : 'draft'
      })
    } else {
      // 编辑模式
      if (isPublish) {
        setIsPublishing(true)
      } else {
        setIsSaving(true)
      }
      
      updateFusionMutation.mutate({
        id: fusionId,
        data: {
          ...values,
          status: isPublish ? 'published' : 'draft'
        }
      })
    }
  }
  
  // 处理保存草稿
  const handleSaveDraft = () => {
    form.validateFields()
      .then(values => {
        handleSubmit(values, false)
      })
      .catch(err => {
        const firstField = err.errorFields[0]
        message.error(`${firstField.name.join(' ')} ${firstField.errors.join(', ')}`)
      })
  }
  
  // 处理发布
  const handlePublish = () => {
    form.validateFields()
      .then(values => {
        handleSubmit(values, true)
      })
      .catch(err => {
        const firstField = err.errorFields[0]
        message.error(`${firstField.name.join(' ')} ${firstField.errors.join(', ')}`)
      })
  }
  
  // 处理取消
  const handleCancel = () => {
    navigate('/fusion')
  }
  
  // 处理添加源内容
  const handleAddSource = () => {
    if (selectedSourceType === 'content') {
      setSelectContentModalVisible(true)
    } else {
      // 处理其他类型的源内容
      message.info('暂不支持添加自定义源内容')
    }
  }
  
  // 处理选择内容查询变更
  const handleContentFilterChange = (key, value) => {
    setContentFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value : 1 // 如果不是切换页码，则重置为第一页
    }))
  }
  
  // 处理选择内容变更
  const handleContentSelectionChange = (selectedRowKeys) => {
    setSelectedContents(selectedRowKeys)
  }
  
  // 确认添加选中内容
  const confirmAddSelectedContents = () => {
    if (selectedContents.length === 0) {
      message.warning('请选择至少一个内容')
      return
    }
    
    addSourceMutation.mutate({
      sourceType: 'content',
      sourceIds: selectedContents
    })
  }
  
  // 处理删除源内容
  const handleDeleteSource = (source) => {
    setSourceToDelete(source)
    setConfirmDeleteVisible(true)
  }
  
  // 确认删除源内容
  const confirmDeleteSource = () => {
    deleteSourceMutation.mutate(sourceToDelete.id)
  }
  
  // 处理源内容排序
  const handleSourceOrderChange = (sourceId, direction) => {
    const sources = sourcesData?.data || []
    const sourceIndex = sources.findIndex(s => s.id === sourceId)
    
    if (direction === 'up' && sourceIndex > 0) {
      const newSources = [...sources]
      const temp = newSources[sourceIndex]
      newSources[sourceIndex] = newSources[sourceIndex - 1]
      newSources[sourceIndex - 1] = temp
      
      updateSourceOrderMutation.mutate(newSources.map((s, index) => ({
        id: s.id,
        order: index
      })))
    } else if (direction === 'down' && sourceIndex < sources.length - 1) {
      const newSources = [...sources]
      const temp = newSources[sourceIndex]
      newSources[sourceIndex] = newSources[sourceIndex + 1]
      newSources[sourceIndex + 1] = temp
      
      updateSourceOrderMutation.mutate(newSources.map((s, index) => ({
        id: s.id,
        order: index
      })))
    }
  }
  
  // 获取源内容类型标签
  const getSourceTypeTag = (sourceType) => {
    switch (sourceType) {
      case 'content':
        return <Tag color="blue">内容</Tag>
      case 'external':
        return <Tag color="green">外部资源</Tag>
      case 'custom':
        return <Tag color="orange">自定义</Tag>
      default:
        return <Tag>{sourceType}</Tag>
    }
  }
  
  // 获取内容类型标签
  const getContentTypeTag = (contentType) => {
    const types = {
      '180_video': { color: 'magenta', text: '180° 视频' },
      '360_video': { color: 'magenta', text: '360° 视频' },
      '180_photo': { color: 'purple', text: '180° 照片' },
      '360_photo': { color: 'purple', text: '360° 照片' },
      'spatial_video': { color: 'magenta', text: '空间视频' },
      'spatial_photo': { color: 'purple', text: '空间照片' }
    }
    
    const typeInfo = types[contentType] || { color: 'default', text: contentType }
    return <Tag color={typeInfo.color}>{typeInfo.text}</Tag>
  }
  
  // 渲染基本信息表单
  const renderBasicForm = () => {
    return (
      <Card className="form-card">
        <Form.Item
          name="title"
          label="标题"
          rules={[{ required: true, message: '请输入标题' }]}
        >
          <Input placeholder="请输入融合内容标题" />
        </Form.Item>
        
        <Form.Item
          name="description"
          label="描述"
          rules={[{ required: true, message: '请输入描述' }]}
        >
          <TextArea 
            placeholder="请输入融合内容描述" 
            rows={4} 
          />
        </Form.Item>
        
        <Form.Item
          name="fusionType"
          label="融合类型"
          rules={[{ required: true, message: '请选择融合类型' }]}
          initialValue="multi_view"
        >
          <Select placeholder="请选择融合类型">
            <Option value="multi_view">多视角</Option>
            <Option value="interactive">交互式</Option>
            <Option value="ar_overlay">AR覆盖</Option>
            <Option value="spatial_audio">空间音频</Option>
            <Option value="custom">自定义</Option>
          </Select>
        </Form.Item>
        
        <Form.Item
          name="thumbnail"
          label="缩略图"
        >
          <Upload
            name="thumbnail"
            listType="picture-card"
            className="thumbnail-uploader"
            showUploadList={false}
            beforeUpload={() => false}
          >
            {fusionData?.data?.thumbnail ? (
              <img 
                src={fusionData.data.thumbnail} 
                alt="缩略图" 
                style={{ width: '100%' }} 
              />
            ) : (
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>上传</div>
              </div>
            )}
          </Upload>
        </Form.Item>
        
        <Form.Item
          name="isPublic"
          label="公开访问"
          valuePropName="checked"
          initialValue={true}
        >
          <Switch />
        </Form.Item>
      </Card>
    )
  }
  
  // 渲染源内容表单
  const renderSourcesForm = () => {
    if (isCreateMode) {
      return (
        <Alert
          message="请先保存基本信息"
          description="创建融合内容后才能添加源内容"
          type="info"
          showIcon
        />
      )
    }
    
    if (isSourcesLoading) {
      return (
        <div className="loading-container">
          <Spin size="large" />
        </div>
      )
    }
    
    const sources = sourcesData?.data || []
    
    return (
      <div className="sources-container">
        <div className="sources-header">
          <div className="source-type-selector">
            <Radio.Group 
              value={selectedSourceType} 
              onChange={e => setSelectedSourceType(e.target.value)}
              buttonStyle="solid"
            >
              <Radio.Button value="content">内容</Radio.Button>
              <Radio.Button value="external">外部资源</Radio.Button>
              <Radio.Button value="custom">自定义</Radio.Button>
            </Radio.Group>
          </div>
          
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAddSource}
          >
            添加源内容
          </Button>
        </div>
        
        {sources.length === 0 ? (
          <Empty description="暂无源内容" />
        ) : (
          <List
            dataSource={sources}
            renderItem={(source, index) => (
              <List.Item
                key={source.id}
                className="source-item"
                actions={[
                  <Tooltip title="上移" key="up">
                    <Button 
                      type="text" 
                      icon={<ArrowLeftOutlined style={{ transform: 'rotate(90deg)' }} />} 
                      disabled={index === 0}
                      onClick={() => handleSourceOrderChange(source.id, 'up')}
                    />
                  </Tooltip>,
                  <Tooltip title="下移" key="down">
                    <Button 
                      type="text" 
                      icon={<ArrowLeftOutlined style={{ transform: 'rotate(-90deg)' }} />} 
                      disabled={index === sources.length - 1}
                      onClick={() => handleSourceOrderChange(source.id, 'down')}
                    />
                  </Tooltip>,
                  <Tooltip title="设置" key="setting">
                    <Button type="text" icon={<SettingOutlined />} />
                  </Tooltip>,
                  <Tooltip title="删除" key="delete">
                    <Button 
                      type="text" 
                      danger 
                      icon={<DeleteOutlined />} 
                      onClick={() => handleDeleteSource(source)}
                    />
                  </Tooltip>
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <div className="source-index">{index + 1}</div>
                  }
                  title={
                    <div className="source-title">
                      <div className="source-name">{source.title}</div>
                      <Space>
                        {getSourceTypeTag(source.sourceType)}
                        {source.sourceType === 'content' && source.contentType && (
                          getContentTypeTag(source.contentType)
                        )}
                      </Space>
                    </div>
                  }
                  description={
                    <div className="source-description">
                      {source.description || '暂无描述'}
                    </div>
                  }
                />
                {source.thumbnail && (
                  <div className="source-thumbnail">
                    <img src={source.thumbnail} alt={source.title} />
                  </div>
                )}
              </List.Item>
            )}
          />
        )}
      </div>
    )
  }
  
  // 渲染高级设置表单
  const renderSettingsForm = () => {
    return (
      <Card className="form-card">
        <Form.Item
          name={['settings', 'autoPlay']}
          label="自动播放"
          valuePropName="checked"
          initialValue={true}
        >
          <Switch />
        </Form.Item>
        
        <Form.Item
          name={['settings', 'loop']}
          label="循环播放"
          valuePropName="checked"
          initialValue={false}
        >
          <Switch />
        </Form.Item>
        
        <Form.Item
          name={['settings', 'transition']}
          label="过渡效果"
          initialValue="fade"
        >
          <Select placeholder="请选择过渡效果">
            <Option value="none">无</Option>
            <Option value="fade">淡入淡出</Option>
            <Option value="slide">滑动</Option>
            <Option value="zoom">缩放</Option>
          </Select>
        </Form.Item>
        
        <Form.Item
          name={['settings', 'transitionDuration']}
          label="过渡时长(秒)"
          initialValue={1}
        >
          <Select>
            <Option value={0.5}>0.5</Option>
            <Option value={1}>1</Option>
            <Option value={1.5}>1.5</Option>
            <Option value={2}>2</Option>
            <Option value={3}>3</Option>
          </Select>
        </Form.Item>
        
        <Form.Item
          name={['settings', 'controls']}
          label="显示控制器"
          valuePropName="checked"
          initialValue={true}
        >
          <Switch />
        </Form.Item>
        
        <Form.Item
          name={['settings', 'muted']}
          label="默认静音"
          valuePropName="checked"
          initialValue={false}
        >
          <Switch />
        </Form.Item>
      </Card>
    )
  }
  
  // 生成内容选择表格列
  const contentSelectionColumns = [
    {
      title: '内容标题',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div className="content-cell">
          <img 
            src={record.thumbnail || '/placeholder-image.png'} 
            alt={text} 
            className="content-thumbnail" 
          />
          <span className="content-title">{text}</span>
        </div>
      )
    },
    {
      title: '类型',
      dataIndex: 'contentType',
      key: 'contentType',
      width: 120,
      render: (type) => getContentTypeTag(type)
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date) => new Date(date).toLocaleDateString()
    }
  ]
  
  return (
    <div className="fusion-edit-page">
      <div className="page-header">
        <div className="header-left">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={handleCancel}
          >
            返回
          </Button>
          <h1>{isCreateMode ? '创建融合内容' : '编辑融合内容'}</h1>
        </div>
        
        <div className="header-actions">
          {!isCreateMode && fusionData?.data?.status === 'published' && (
            <Button 
              icon={<EyeOutlined />} 
              onClick={() => setIsPreviewModalVisible(true)}
              style={{ marginRight: 8 }}
            >
              预览
            </Button>
          )}
          <Button 
            onClick={handleSaveDraft}
            loading={isSaving}
            style={{ marginRight: 8 }}
          >
            保存草稿
          </Button>
          <Button 
            type="primary" 
            icon={<SaveOutlined />} 
            onClick={handlePublish}
            loading={isPublishing}
          >
            发布
          </Button>
        </div>
      </div>
      
      {isFusionLoading && !isCreateMode ? (
        <div className="loading-container">
          <Spin size="large" />
        </div>
      ) : fusionError && !isCreateMode ? (
        <div className="error-container">
          <Empty 
            image={Empty.PRESENTED_IMAGE_SIMPLE} 
            description="加载失败，融合内容可能不存在或已被删除"
          />
          <Button type="primary" onClick={handleCancel}>
            返回列表
          </Button>
        </div>
      ) : (
        <div className="form-container">
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              title: '',
              description: '',
              fusionType: 'multi_view',
              settings: {
                autoPlay: true,
                loop: false,
                transition: 'fade',
                transitionDuration: 1,
                controls: true,
                muted: false
              },
              isPublic: true
            }}
          >
            <Tabs 
              activeKey={activeTab} 
              onChange={setActiveTab}
              className="form-tabs"
            >
              <TabPane tab="基本信息" key="basic">
                {renderBasicForm()}
              </TabPane>
              <TabPane tab="源内容" key="sources">
                {renderSourcesForm()}
              </TabPane>
              <TabPane tab="高级设置" key="settings">
                {renderSettingsForm()}
              </TabPane>
            </Tabs>
          </Form>
        </div>
      )}
      
      {/* 选择内容模态框 */}
      <Modal
        title="选择内容"
        open={selectContentModalVisible}
        onCancel={() => {
          setSelectContentModalVisible(false)
          setSelectedContents([])
        }}
        width={800}
        footer={[
          <Button 
            key="cancel" 
            onClick={() => {
              setSelectContentModalVisible(false)
              setSelectedContents([])
            }}
          >
            取消
          </Button>,
          <Button 
            key="confirm" 
            type="primary" 
            onClick={confirmAddSelectedContents}
            disabled={selectedContents.length === 0}
            loading={addSourceMutation.isLoading}
          >
            添加 ({selectedContents.length})
          </Button>
        ]}
      >
        <div className="content-selection-container">
          <div className="filter-toolbar">
            <Input.Search
              placeholder="搜索内容"
              allowClear
              onSearch={(value) => handleContentFilterChange('keyword', value)}
              style={{ width: 250, marginBottom: 16 }}
            />
            
            <Select
              placeholder="内容类型"
              allowClear
              style={{ width: 150, marginBottom: 16, marginLeft: 8 }}
              onChange={(value) => handleContentFilterChange('contentType', value)}
            >
              <Option value="180_video">180° 视频</Option>
              <Option value="360_video">360° 视频</Option>
              <Option value="180_photo">180° 照片</Option>
              <Option value="360_photo">360° 照片</Option>
              <Option value="spatial_video">空间视频</Option>
              <Option value="spatial_photo">空间照片</Option>
            </Select>
          </div>
          
          {isContentsLoading ? (
            <div className="loading-container">
              <Spin size="large" />
            </div>
          ) : (
            <Table
              columns={contentSelectionColumns}
              dataSource={contentsData?.data?.data || []}
              rowKey="id"
              rowSelection={{
                selectedRowKeys: selectedContents,
                onChange: handleContentSelectionChange
              }}
              pagination={{
                current: contentFilters.page,
                pageSize: contentFilters.limit,
                total: contentsData?.data?.pagination?.total || 0,
                onChange: (page) => handleContentFilterChange('page', page),
                onShowSizeChange: (_, size) => handleContentFilterChange('limit', size)
              }}
            />
          )}
        </div>
      </Modal>
      
      {/* 预览模态框 */}
      <Modal
        title="融合内容预览"
        open={isPreviewModalVisible}
        onCancel={() => setIsPreviewModalVisible(false)}
        width={800}
        footer={null}
        centered
      >
        <div className="preview-container">
          <div className="preview-frame">
            <iframe 
              src={`/fusion/view/${fusionId}?preview=true`} 
              title="融合内容预览" 
              width="100%" 
              height="400" 
              frameBorder="0"
            />
          </div>
          <div className="preview-actions">
            <Button 
              type="primary" 
              onClick={() => window.open(`/fusion/view/${fusionId}`, '_blank')}
            >
              新窗口打开
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* 删除确认对话框 */}
      <Modal
        title="确认删除"
        open={confirmDeleteVisible}
        onOk={confirmDeleteSource}
        onCancel={() => {
          setConfirmDeleteVisible(false)
          setSourceToDelete(null)
        }}
        okText="确认删除"
        cancelText="取消"
        okButtonProps={{ danger: true, loading: deleteSourceMutation.isLoading }}
      >
        <div className="delete-confirmation">
          <ExclamationCircleOutlined className="warning-icon" />
          <p>确定要移除源内容 "{sourceToDelete?.title}" 吗？</p>
          <p className="warning-text">此操作不会删除原始内容。</p>
        </div>
      </Modal>
    </div>
  )
}

export default FusionEditPage