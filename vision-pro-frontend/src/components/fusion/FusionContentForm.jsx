// components/fusion/FusionContentForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Form, Input, Select, Button, Upload, Switch, 
  Tabs, Card, List, Empty, Spin, message, Modal, Tooltip 
} from '../ui/common';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { creatorApi } from '../../services/apiService';
import ContentSelector from './ContentSelector';

const { TabPane } = Tabs;

const FusionContentForm = () => {
  const { fusionId } = useParams();
  const navigate = useNavigate();
  const isEditing = !!fusionId;
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'entertainment',
    coverImage: null,
    contents: [],
    settings: {
      autoPlay: true,
      loop: false,
      shuffle: false,
      transitionDuration: 1000
    },
    status: 'draft'
  });
  
  const [availableContents, setAvailableContents] = useState([]);
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [contentSelectorVisible, setContentSelectorVisible] = useState(false);
  const [coverImageFileList, setCoverImageFileList] = useState([]);
  
  useEffect(() => {
    if (isEditing) {
      fetchFusionDetails();
    }
    fetchAvailableContents();
  }, [fusionId]);
  
  const fetchFusionDetails = async () => {
    try {
      const response = await creatorApi.getFusionDetails(fusionId);
      const fusion = response.data.data.fusion;
      
      setFormData({
        title: fusion.title,
        description: fusion.description || '',
        category: fusion.category,
        coverImage: fusion.coverImage,
        contents: fusion.contents || [],
        settings: fusion.settings,
        status: fusion.status
      });
      
      if (fusion.coverImage) {
        setCoverImageFileList([{
          uid: '-1',
          name: 'cover-image.jpg',
          status: 'done',
          url: fusion.coverImage.url
        }]);
      }
    } catch (error) {
      console.error('获取融合内容详情失败:', error);
      message.error('获取融合内容详情失败');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAvailableContents = async () => {
    try {
      // 获取已发布的内容
      const response = await creatorApi.getContents({
        status: 'published',
        limit: 100
      });
      setAvailableContents(response.data.data.contents);
    } catch (error) {
      console.error('获取可用内容失败:', error);
      message.error('获取可用内容失败');
    }
  };
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };
  
  const handleSettingsChange = (setting, value) => {
    setFormData({
      ...formData,
      settings: {
        ...formData.settings,
        [setting]: value
      }
    });
  };
  
  const handleContentAdd = (selectedContents) => {
    // 添加内容
    const newContents = [
      ...formData.contents,
      ...selectedContents.map((content, index) => ({
        contentId: content._id,
        content: content, // 保存完整内容对象以便显示
        order: formData.contents.length + index,
        settings: {
          autoPlay: true,
          loop: false,
          duration: content.files?.main?.duration || 0,
          transition: 'fade'
        }
      }))
    ];
    
    setFormData({
      ...formData,
      contents: newContents
    });
    
    setContentSelectorVisible(false);
  };
  
  const handleContentRemove = (index) => {
    const newContents = [...formData.contents];
    newContents.splice(index, 1);
    
    // 重新排序
    newContents.forEach((content, idx) => {
      content.order = idx;
    });
    
    setFormData({
      ...formData,
      contents: newContents
    });
  };
  
  const handleContentSettingChange = (index, setting, value) => {
    const newContents = [...formData.contents];
    newContents[index].settings = {
      ...newContents[index].settings,
      [setting]: value
    };
    
    setFormData({
      ...formData,
      contents: newContents
    });
  };
  
  const handleContentReorder = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(formData.contents);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // 更新顺序
    const reorderedContents = items.map((item, index) => ({
      ...item,
      order: index
    }));
    
    setFormData({
      ...formData,
      contents: reorderedContents
    });
  };
  
  const handleCoverImageChange = ({ fileList }) => {
    setCoverImageFileList(fileList);
    
    // 如果文件上传成功，更新表单数据
    if (fileList.length > 0 && fileList[0].status === 'done') {
      setFormData({
        ...formData,
        coverImage: {
          url: fileList[0].response?.data?.url || fileList[0].url,
          size: fileList[0].size
        }
      });
    } else if (fileList.length === 0) {
      setFormData({
        ...formData,
        coverImage: null
      });
    }
  };
  
  const handleSubmit = async () => {
    // 表单验证
    if (!formData.title.trim()) {
      message.error('请输入标题');
      return;
    }
    
    if (formData.contents.length === 0) {
      message.error('请至少添加一个内容');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const contentData = {
        ...formData,
        contents: formData.contents.map(({ contentId, order, settings }) => ({
          contentId,
          order,
          settings
        }))
      };
      
      if (isEditing) {
        await creatorApi.updateFusion(fusionId, contentData);
        message.success('融合内容已更新');
      } else {
        const response = await creatorApi.createFusion(contentData);
        message.success('融合内容已创建');
        navigate(`/creator/fusion/${response.data.data._id}`);
      }
    } catch (error) {
      console.error('保存融合内容失败:', error);
      message.error('保存融合内容失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setSubmitting(false);
    }
  };
  
  const handlePublish = async () => {
    if (formData.contents.length === 0) {
      message.error('请至少添加一个内容后再发布');
      return;
    }
    
    if (!formData.coverImage) {
      message.error('请添加封面图片后再发布');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const contentData = {
        ...formData,
        status: 'published',
        contents: formData.contents.map(({ contentId, order, settings }) => ({
          contentId,
          order,
          settings
        }))
      };
      
      if (isEditing) {
        await creatorApi.updateFusion(fusionId, contentData);
        message.success('融合内容已发布');
        fetchFusionDetails();
      } else {
        const response = await creatorApi.createFusion(contentData);
        message.success('融合内容已发布');
        navigate(`/creator/fusion/${response.data.data._id}`);
      }
    } catch (error) {
      console.error('发布融合内容失败:', error);
      message.error('发布融合内容失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="loading-spinner">
        <Spin size="large" tip="加载融合内容中..." />
      </div>
    );
  }
  
  return (
    <div className="fusion-form-container">
      <div className="form-header">
        <h1>{isEditing ? '编辑融合内容' : '创建融合内容'}</h1>
        <div className="form-actions">
          <Button onClick={() => navigate('/creator/fusions')}>
            取消
          </Button>
          <Button 
            type="primary" 
            onClick={handleSubmit}
            loading={submitting}
          >
            保存
          </Button>
          {formData.status !== 'published' && (
            <Button 
              type="primary" 
              ghost
              onClick={handlePublish}
              loading={submitting}
            >
              发布
            </Button>
          )}
        </div>
      </div>
      
      <Tabs activeKey={activeTab} onChange={setActiveTab} className="fusion-tabs">
        <TabPane tab="基本信息" key="basic">
          <Card>
            <Form layout="vertical">
              <Form.Item 
                label="标题" 
                required
                help="请为您的融合内容提供一个描述性标题"
              >
                <Input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="例如：欧洲之旅精选集"
                  maxLength={100}
                />
              </Form.Item>
              
              <Form.Item 
                label="描述"
                help="提供融合内容的详细描述，帮助用户了解内容"
              >
                <Input.TextArea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="描述这个融合内容包含哪些体验..."
                  rows={4}
                  maxLength={500}
                />
              </Form.Item>
              
              <Form.Item label="分类">
                <Select
                  name="category"
                  value={formData.category}
                  onChange={(value) => handleChange({ target: { name: 'category', value } })}
                >
                  <Select.Option value="travel">旅行</Select.Option>
                  <Select.Option value="education">教育</Select.Option>
                  <Select.Option value="entertainment">娱乐</Select.Option>
                  <Select.Option value="sports">运动</Select.Option>
                  <Select.Option value="news">新闻</Select.Option>
                  <Select.Option value="documentary">纪录片</Select.Option>
                  <Select.Option value="art">艺术</Select.Option>
                  <Select.Option value="other">其他</Select.Option>
                </Select>
              </Form.Item>
              
              <Form.Item 
                label="封面图片"
                help="推荐尺寸: 1920×1080 像素"
              >
                <Upload
                  name="coverImage"
                  listType="picture-card"
                  fileList={coverImageFileList}
                  onChange={handleCoverImageChange}
                  action="/api/upload/single"
                  maxCount={1}
                  accept="image/*"
                >
                  {coverImageFileList.length === 0 && (
                    <div>
                      <div className="ant-upload-text">上传封面</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>
        
        <TabPane tab="内容管理" key="contents">
          <Card
            title={
              <div className="content-tab-header">
                <span>融合内容列表</span>
                <Button 
                  type="primary" 
                  onClick={() => setContentSelectorVisible(true)}
                >
                  添加内容
                </Button>
              </div>
            }
          >
            {formData.contents.length > 0 ? (
              <DragDropContext onDragEnd={handleContentReorder}>
                <Droppable droppableId="fusion-contents">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="fusion-content-list"
                    >
                      {formData.contents.map((item, index) => (
                        <Draggable 
                          key={`${item.contentId}-${index}`} 
                          draggableId={`${item.contentId}-${index}`} 
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="fusion-content-item"
                            >
                              <div className="content-drag-handle" {...provided.dragHandleProps}>
                                :::
                              </div>
                              
                              <div className="content-thumbnail">
                                <img 
                                  src={item.content?.files?.thumbnail?.url || '/default-thumbnail.jpg'} 
                                  alt={item.content?.title?.['zh-CN']} 
                                />
                              </div>
                              
                              <div className="content-info">
                                <div className="content-title">
                                  {item.content?.title?.['zh-CN'] || item.content?.title?.['en-US'] || '无标题'}
                                </div>
                                <div className="content-meta">
                                  <span className="content-type">
                                    {getContentTypeText(item.content?.contentType)}
                                  </span>
                                  <span className="content-duration">
                                    {formatDuration(item.content?.files?.main?.duration || 0)}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="content-settings">
                                <div className="setting-item">
                                  <label>过渡效果:</label>
                                  <Select
                                    value={item.settings.transition}
                                    onChange={(value) => handleContentSettingChange(index, 'transition', value)}
                                    style={{ width: 100 }}
                                  >
                                    <Select.Option value="none">无</Select.Option>
                                    <Select.Option value="fade">淡入淡出</Select.Option>
                                    <Select.Option value="slide">滑动</Select.Option>
                                  </Select>
                                </div>
                                
                                <div className="setting-item">
                                  <label>自动播放:</label>
                                  <Switch
                                    checked={item.settings.autoPlay}
                                    onChange={(checked) => handleContentSettingChange(index, 'autoPlay', checked)}
                                  />
                                </div>
                                
                                <div className="setting-item">
                                  <label>循环:</label>
                                  <Switch
                                    checked={item.settings.loop}
                                    onChange={(checked) => handleContentSettingChange(index, 'loop', checked)}
                                  />
                                </div>
                              </div>
                              
                              <Button 
                                type="link" 
                                danger
                                onClick={() => handleContentRemove(index)}
                              >
                                移除
                              </Button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            ) : (
              <Empty description="请添加内容到融合体验中">
                <Button 
                  type="primary" 
                  onClick={() => setContentSelectorVisible(true)}
                >
                  添加内容
                </Button>
              </Empty>
            )}
          </Card>
        </TabPane>
        
        <TabPane tab="全局设置" key="settings">
          <Card>
            <div className="fusion-settings">
              <div className="setting-section">
                <h3>播放设置</h3>
                
                <div className="setting-row">
                  <div className="setting-label">
                    <label>自动播放:</label>
                    <div className="setting-desc">自动开始播放融合内容</div>
                  </div>
                  <div className="setting-control">
                    <Switch
                      checked={formData.settings.autoPlay}
                      onChange={(checked) => handleSettingsChange('autoPlay', checked)}
                    />
                  </div>
                </div>
                
                <div className="setting-row">
                  <div className="setting-label">
                    <label>循环播放:</label>
                    <div className="setting-desc">完成后从头开始重新播放</div>
                  </div>
                  <div className="setting-control">
                    <Switch
                      checked={formData.settings.loop}
                      onChange={(checked) => handleSettingsChange('loop', checked)}
                    />
                  </div>
                </div>
                
                <div className="setting-row">
                  <div className="setting-label">
                    <label>随机播放:</label>
                    <div className="setting-desc">随机顺序播放内容</div>
                  </div>
                  <div className="setting-control">
                    <Switch
                      checked={formData.settings.shuffle}
                      onChange={(checked) => handleSettingsChange('shuffle', checked)}
                    />
                  </div>
                </div>
                
                <div className="setting-row">
                  <div className="setting-label">
                    <label>过渡时长 (毫秒):</label>
                    <div className="setting-desc">内容之间的过渡动画持续时间</div>
                  </div>
                  <div className="setting-control">
                    <Select
                      value={formData.settings.transitionDuration}
                      onChange={(value) => handleSettingsChange('transitionDuration', value)}
                      style={{ width: 120 }}
                    >
                      <Select.Option value={0}>无过渡</Select.Option>
                      <Select.Option value={500}>0.5 秒</Select.Option>
                      <Select.Option value={1000}>1 秒</Select.Option>
                      <Select.Option value={1500}>1.5 秒</Select.Option>
                      <Select.Option value={2000}>2 秒</Select.Option>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabPane>
      </Tabs>
      
      <ContentSelector
        visible={contentSelectorVisible}
        onCancel={() => setContentSelectorVisible(false)}
        onSelect={handleContentAdd}
        availableContents={availableContents}
        selectedContentIds={formData.contents.map(item => item.contentId)}
      />
    </div>
  );
};

// 辅助函数
const getContentTypeText = (contentType) => {
  const typeMap = {
    '180_video': '180° 视频',
    '180_photo': '180° 照片',
    '360_video': '360° 视频',
    '360_photo': '360° 照片',
    'spatial_video': '空间视频',
    'spatial_photo': '空间照片'
  };
  return typeMap[contentType] || contentType;
};

const formatDuration = (seconds) => {
  if (!seconds) return '未知';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default FusionContentForm;