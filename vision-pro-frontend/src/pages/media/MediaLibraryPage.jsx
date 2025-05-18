// src/pages/media/MediaLibraryPage.jsx
import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  Input, 
  Select, 
  Tag, 
  Dropdown, 
  Menu, 
  Spin, 
  Empty,
  message,
  Modal,
  Pagination,
  Radio,
  Space,
  Tabs,
  Upload,
  Progress,
  Tooltip,
  Checkbox,
  Divider
} from 'antd'
import { 
  UploadOutlined, 
  SearchOutlined, 
  FilterOutlined, 
  MoreOutlined,
  DeleteOutlined,
  DownloadOutlined,
  CopyOutlined,
  EditOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  FileImageOutlined,
  VideoCameraOutlined,
  FileOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  FolderOutlined,
  PlusOutlined
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { mediaApiService } from '@/services/api/mediaService'
import MediaUploader from '@/components/upload/MediaUploader'
import './MediaLibraryPage.less'

const { Option } = Select
const { TabPane } = Tabs

const MediaLibraryPage = () => {
  const queryClient = useQueryClient()
  const [viewMode, setViewMode] = useState('grid')
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [currentFolder, setCurrentFolder] = useState('root')
  const [folderPath, setFolderPath] = useState([{ id: 'root', name: '根目录' }])
  const [searchKeyword, setSearchKeyword] = useState('')
  const [filters, setFilters] = useState({
    mediaType: undefined,
    dateRange: undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    limit: 20
  })
  const [uploadModalVisible, setUploadModalVisible] = useState(false)
  const [previewModalVisible, setPreviewModalVisible] = useState(false)
  const [previewItem, setPreviewItem] = useState(null)
  const [createFolderModalVisible, setCreateFolderModalVisible] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [renameModalVisible, setRenameModalVisible] = useState(false)
  const [itemToRename, setItemToRename] = useState(null)
  const [newName, setNewName] = useState('')
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [itemsToDelete, setItemsToDelete] = useState([])
  const [activeTab, setActiveTab] = useState('all')
  
  // 获取媒体资源列表
  const { 
    data: mediaData, 
    isLoading, 
    error,
    refetch 
  } = useQuery(
    ['mediaList', currentFolder, filters, searchKeyword],
    () => mediaApiService.getMediaList({
      folderId: currentFolder === 'root' ? undefined : currentFolder,
      mediaType: filters.mediaType || (activeTab !== 'all' ? activeTab : undefined),
      keyword: searchKeyword,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      page: filters.page,
      limit: filters.limit
    }),
    {
      keepPreviousData: true,
      refetchOnWindowFocus: false
    }
  )
  
  // 创建文件夹mutation
  const createFolderMutation = useMutation(
    (name) => mediaApiService.createFolder({ name, parentId: currentFolder === 'root' ? undefined : currentFolder }),
    {
      onSuccess: () => {
        message.success('文件夹创建成功')
        setCreateFolderModalVisible(false)
        setNewFolderName('')
        queryClient.invalidateQueries(['mediaList', currentFolder])
      },
      onError: (error) => {
        message.error('创建文件夹失败: ' + error.message)
      }
    }
  )
  
  // 重命名媒体资源mutation
  const renameMutation = useMutation(
    ({ id, name, type }) => {
      if (type === 'folder') {
        return mediaApiService.renameFolder(id, { name })
      } else {
        return mediaApiService.renameMedia(id, { name })
      }
    },
    {
      onSuccess: () => {
        message.success('重命名成功')
        setRenameModalVisible(false)
        setItemToRename(null)
        setNewName('')
        queryClient.invalidateQueries(['mediaList', currentFolder])
      },
      onError: (error) => {
        message.error('重命名失败: ' + error.message)
      }
    }
  )
  
  // 删除媒体资源mutation
  const deleteMutation = useMutation(
    (items) => mediaApiService.deleteItems(items),
    {
      onSuccess: () => {
        message.success('删除成功')
        setDeleteModalVisible(false)
        setItemsToDelete([])
        setSelectedRowKeys([])
        queryClient.invalidateQueries(['mediaList', currentFolder])
      },
      onError: (error) => {
        message.error('删除失败: ' + error.message)
      }
    }
  )
  
  // 处理文件夹导航
  const handleFolderClick = (folder) => {
    setCurrentFolder(folder.id)
    
    // 更新文件夹路径
    const pathIndex = folderPath.findIndex(item => item.id === folder.id)
    if (pathIndex !== -1) {
      setFolderPath(folderPath.slice(0, pathIndex + 1))
    } else {
      setFolderPath([...folderPath, { id: folder.id, name: folder.name }])
    }
    
    // 重置分页
    setFilters(prev => ({
      ...prev,
      page: 1
    }))
  }
  
  // 处理路径导航
  const handlePathClick = (folder, index) => {
    setCurrentFolder(folder.id)
    setFolderPath(folderPath.slice(0, index + 1))
    
    // 重置分页
    setFilters(prev => ({
      ...prev,
      page: 1
    }))
  }
  
  // 处理查询变更
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value : 1 // 如果不是切换页码，则重置为第一页
    }))
  }
  
  // 处理搜索
  const handleSearch = (value) => {
    setSearchKeyword(value)
    setFilters(prev => ({
      ...prev,
      page: 1
    }))
  }
  
  // 处理选择行
  const handleSelectItems = (selectedItems) => {
    setSelectedRowKeys(selectedItems)
  }
  
  // 处理预览
  const handlePreview = (item) => {
    setPreviewItem(item)
    setPreviewModalVisible(true)
  }
  
  // 处理重命名
  const handleRename = (item) => {
    setItemToRename(item)
    setNewName(item.name)
    setRenameModalVisible(true)
  }
  
  // 处理删除
  const handleDelete = (items) => {
    setItemsToDelete(Array.isArray(items) ? items : [items])
    setDeleteModalVisible(true)
  }
  
  // 确认删除
  const confirmDelete = () => {
    deleteMutation.mutate(itemsToDelete.map(item => ({ id: item.id, type: item.type })))
  }
  
  // 处理创建文件夹
  const handleCreateFolder = () => {
    setCreateFolderModalVisible(true)
  }
  
  // 确认创建文件夹
  const confirmCreateFolder = () => {
    if (!newFolderName.trim()) {
      message.warning('请输入文件夹名称')
      return
    }
    
    createFolderMutation.mutate(newFolderName.trim())
  }
  
  // 确认重命名
  const confirmRename = () => {
    if (!newName.trim()) {
      message.warning('请输入名称')
      return
    }
    
    renameMutation.mutate({
      id: itemToRename.id,
      name: newName.trim(),
      type: itemToRename.type
    })
  }
  
  // 处理上传成功
  const handleUploadSuccess = () => {
    message.success('上传成功')
    queryClient.invalidateQueries(['mediaList', currentFolder])
    setUploadModalVisible(false)
  }
  
  // 渲染文件图标
  const renderFileIcon = (mediaType) => {
    switch (mediaType) {
      case 'image':
        return <FileImageOutlined style={{ fontSize: '32px', color: '#1677ff' }} />
      case 'video':
        return <VideoCameraOutlined style={{ fontSize: '32px', color: '#52c41a' }} />
      case '360_photo':
      case '180_photo':
        return <FileImageOutlined style={{ fontSize: '32px', color: '#722ed1' }} />
      case '360_video':
      case '180_video':
      case 'spatial_video':
        return <VideoCameraOutlined style={{ fontSize: '32px', color: '#eb2f96' }} />
      default:
        return <FileOutlined style={{ fontSize: '32px', color: '#faad14' }} />
    }
  }
  
  // 获取媒体类型标签
  const getMediaTypeTag = (mediaType) => {
    const types = {
      'image': { color: 'blue', text: '图片' },
      'video': { color: 'green', text: '视频' },
      '360_photo': { color: 'purple', text: '360° 照片' },
      '180_photo': { color: 'purple', text: '180° 照片' },
      '360_video': { color: 'magenta', text: '360° 视频' },
      '180_video': { color: 'magenta', text: '180° 视频' },
      'spatial_video': { color: 'magenta', text: '空间视频' },
    }
    
    const typeInfo = types[mediaType] || { color: 'default', text: mediaType }
    return <Tag color={typeInfo.color}>{typeInfo.text}</Tag>
  }
  
  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B'
    
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]
  }
  
  // 格式化时间
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }
  
  // 渲染列表视图
  const renderListView = () => {
    const columns = [
      {
        title: '名称',
        dataIndex: 'name',
        key: 'name',
        render: (text, record) => (
          <div className="media-name-cell">
            {record.type === 'folder' ? (
              <FolderOutlined className="media-icon folder" />
            ) : (
              <div className="media-icon">
                {record.thumbnail ? (
                  <img src={record.thumbnail} alt={text} />
                ) : (
                  renderFileIcon(record.mediaType)
                )}
              </div>
            )}
            <div className="media-name">
              {record.type === 'folder' ? (
                <a onClick={() => handleFolderClick(record)}>{text}</a>
              ) : (
                <span>{text}</span>
              )}
            </div>
          </div>
        )
      },
      {
        title: '类型',
        dataIndex: 'mediaType',
        key: 'mediaType',
        width: 120,
        render: (text, record) => (
          record.type === 'folder' ? (
            <Tag color="default">文件夹</Tag>
          ) : (
            getMediaTypeTag(text)
          )
        )
      },
      {
        title: '大小',
        dataIndex: 'size',
        key: 'size',
        width: 120,
        render: (text, record) => (
          record.type === 'folder' ? '-' : formatFileSize(text)
        )
      },
      {
        title: '上传时间',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 120,
        render: (text) => formatDate(text)
      },
      {
        title: '操作',
        key: 'action',
        width: 120,
        render: (_, record) => (
          <Space>
            {record.type !== 'folder' && (
              <Tooltip title="预览">
                <Button 
                  type="text" 
                  icon={<EyeOutlined />} 
                  onClick={() => handlePreview(record)} 
                />
              </Tooltip>
            )}
            <Tooltip title="重命名">
              <Button 
                type="text" 
                icon={<EditOutlined />} 
                onClick={() => handleRename(record)} 
              />
            </Tooltip>
            <Dropdown
              overlay={
                <Menu>
                  {record.type !== 'folder' && (
                    <Menu.Item key="download" icon={<DownloadOutlined />}>
                      下载
                    </Menu.Item>
                  )}
                  <Menu.Item key="rename" icon={<EditOutlined />} onClick={() => handleRename(record)}>
                    重命名
                  </Menu.Item>
                  {record.type !== 'folder' && (
                    <Menu.Item key="copy" icon={<CopyOutlined />}>
                      复制
                    </Menu.Item>
                  )}
                  <Menu.Item key="delete" icon={<DeleteOutlined />} danger onClick={() => handleDelete(record)}>
                    删除
                  </Menu.Item>
                </Menu>
              }
              trigger={['click']}
            >
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        )
      }
    ]
    
    const data = mediaData?.data?.items || []
    
    return (
      <div className="list-container">
        <div className="list-header">
          <Checkbox
            indeterminate={selectedRowKeys.length > 0 && selectedRowKeys.length < data.length}
            checked={selectedRowKeys.length > 0 && selectedRowKeys.length === data.length}
            onChange={(e) => {
              if (e.target.checked) {
                handleSelectItems(data.map(item => item.id))
              } else {
                handleSelectItems([])
              }
            }}
          />
          <div className="header-name">名称</div>
          <div className="header-type">类型</div>
          <div className="header-size">大小</div>
          <div className="header-date">上传时间</div>
          <div className="header-action">操作</div>
        </div>
        
        {data.length === 0 ? (
          <Empty description="暂无数据" />
        ) : (
          <div className="list-body">
            {data.map(item => (
              <div 
                key={item.id} 
                className={`list-item ${selectedRowKeys.includes(item.id) ? 'selected' : ''}`}
                onClick={() => {
                  if (selectedRowKeys.includes(item.id)) {
                    handleSelectItems(selectedRowKeys.filter(key => key !== item.id))
                  } else {
                    handleSelectItems([...selectedRowKeys, item.id])
                  }
                }}
              >
                <div className="item-checkbox">
                  <Checkbox checked={selectedRowKeys.includes(item.id)} />
                </div>
                <div className="item-name">
                  {item.type === 'folder' ? (
                    <FolderOutlined className="media-icon folder" />
                  ) : (
                    <div className="media-icon">
                      {item.thumbnail ? (
                        <img src={item.thumbnail} alt={item.name} />
                      ) : (
                        renderFileIcon(item.mediaType)
                      )}
                    </div>
                  )}
                  <div className="media-name">
                    {item.type === 'folder' ? (
                      <a onClick={(e) => {
                        e.stopPropagation()
                        handleFolderClick(item)
                      }}>{item.name}</a>
                    ) : (
                      <span>{item.name}</span>
                    )}
                  </div>
                </div>
                <div className="item-type">
                  {item.type === 'folder' ? (
                    <Tag color="default">文件夹</Tag>
                  ) : (
                    getMediaTypeTag(item.mediaType)
                  )}
                </div>
                <div className="item-size">
                  {item.type === 'folder' ? '-' : formatFileSize(item.size)}
                </div>
                <div className="item-date">
                  {formatDate(item.createdAt)}
                </div>
                <div className="item-action">
                  <Space onClick={(e) => e.stopPropagation()}>
                    {item.type !== 'folder' && (
                      <Tooltip title="预览">
                        <Button 
                          type="text" 
                          icon={<EyeOutlined />} 
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePreview(item)
                          }} 
                        />
                      </Tooltip>
                    )}
                    <Tooltip title="重命名">
                      <Button 
                        type="text" 
                        icon={<EditOutlined />} 
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRename(item)
                        }} 
                      />
                    </Tooltip>
                    <Dropdown
                      overlay={
                        <Menu>
                          {item.type !== 'folder' && (
                            <Menu.Item key="download" icon={<DownloadOutlined />}>
                              下载
                            </Menu.Item>
                          )}
                          <Menu.Item key="rename" icon={<EditOutlined />} onClick={() => handleRename(item)}>
                            重命名
                          </Menu.Item>
                          {item.type !== 'folder' && (
                            <Menu.Item key="copy" icon={<CopyOutlined />}>
                              复制
                            </Menu.Item>
                          )}
                          <Menu.Item key="delete" icon={<DeleteOutlined />} danger onClick={() => handleDelete(item)}>
                            删除
                          </Menu.Item>
                        </Menu>
                      }
                      trigger={['click']}
                    >
                      <Button 
                        type="text" 
                        icon={<MoreOutlined />} 
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Dropdown>
                  </Space>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
  
  // 渲染网格视图
  const renderGridView = () => {
    const data = mediaData?.data?.items || []
    
    return (
      <div className="grid-container">
        {data.length === 0 ? (
          <Empty description="暂无数据" />
        ) : (
          <Row gutter={[16, 16]}>
            {data.map(item => (
              <Col xs={12} sm={8} md={6} lg={4} xl={4} key={item.id}>
                <div 
                  className={`grid-item ${selectedRowKeys.includes(item.id) ? 'selected' : ''}`}
                  onClick={() => {
                    if (selectedRowKeys.includes(item.id)) {
                      handleSelectItems(selectedRowKeys.filter(key => key !== item.id))
                    } else {
                      handleSelectItems([...selectedRowKeys, item.id])
                    }
                  }}
                >
                  <div className="item-checkbox">
                    <Checkbox checked={selectedRowKeys.includes(item.id)} />
                  </div>
                  
                  <div className="item-content">
                    {item.type === 'folder' ? (
                      <div className="folder-icon">
                        <FolderOutlined />
                      </div>
                    ) : (
                      <div className="media-thumbnail">
                        {item.thumbnail ? (
                          <img src={item.thumbnail} alt={item.name} />
                        ) : (
                          renderFileIcon(item.mediaType)
                        )}
                      </div>
                    )}
                    
                    <div className="item-name" title={item.name}>
                      {item.type === 'folder' ? (
                        <a onClick={(e) => {
                          e.stopPropagation()
                          handleFolderClick(item)
                        }}>{item.name}</a>
                      ) : (
                        <span>{item.name}</span>
                      )}
                    </div>
                    
                    <div className="item-info">
                      {item.type === 'folder' ? (
                        <Tag color="default">文件夹</Tag>
                      ) : (
                        <>
                          {getMediaTypeTag(item.mediaType)}
                          <span className="item-size">{formatFileSize(item.size)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="item-actions" onClick={(e) => e.stopPropagation()}>
                    {item.type !== 'folder' && (
                      <Tooltip title="预览">
                        <Button 
                          type="text" 
                          icon={<EyeOutlined />} 
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePreview(item)
                          }} 
                        />
                      </Tooltip>
                    )}
                    <Dropdown
                      overlay={
                        <Menu>
                          {item.type !== 'folder' && (
                            <Menu.Item key="preview" icon={<EyeOutlined />} onClick={() => handlePreview(item)}>
                              预览
                            </Menu.Item>
                          )}
                          {item.type !== 'folder' && (
                            <Menu.Item key="download" icon={<DownloadOutlined />}>
                              下载
                            </Menu.Item>
                          )}
                          <Menu.Item key="rename" icon={<EditOutlined />} onClick={() => handleRename(item)}>
                            重命名
                          </Menu.Item>
                          {item.type !== 'folder' && (
                            <Menu.Item key="copy" icon={<CopyOutlined />}>
                              复制
                            </Menu.Item>
                          )}
                          <Menu.Item key="delete" icon={<DeleteOutlined />} danger onClick={() => handleDelete(item)}>
                            删除
                          </Menu.Item>
                        </Menu>
                      }
                      trigger={['click']}
                    >
                      <Button type="text" icon={<MoreOutlined />} />
                    </Dropdown>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        )}
      </div>
    )
  }
  
  return (
    <div className="media-library-page">
      <div className="page-header">
        <h1>媒体库</h1>
        <div className="header-actions">
          <Input.Search
            placeholder="搜索媒体资源"
            allowClear
            onSearch={handleSearch}
            style={{ width: 250, marginRight: 16 }}
          />
          <Button 
            type="primary" 
            icon={<UploadOutlined />} 
            onClick={() => setUploadModalVisible(true)}
          >
            上传文件
          </Button>
        </div>
      </div>
      
      <Card>
        <div className="media-toolbar">
          <div className="left-actions">
            <Button 
              icon={<FolderOutlined />} 
              onClick={handleCreateFolder}
            >
              新建文件夹
            </Button>
            
            {selectedRowKeys.length > 0 && (
              <>
                <Button 
                  icon={<DeleteOutlined />} 
                  danger 
                  onClick={() => {
                    const selectedItems = (mediaData?.data?.items || [])
                      .filter(item => selectedRowKeys.includes(item.id))
                    handleDelete(selectedItems)
                  }}
                >
                  删除
                </Button>
                <Button 
                  icon={<DownloadOutlined />} 
                  disabled={selectedRowKeys.some(key => {
                    const item = (mediaData?.data?.items || []).find(item => item.id === key)
                    return item && item.type === 'folder'
                  })}
                >
                  下载
                </Button>
              </>
            )}
          </div>
          
          <div className="right-actions">
            <div className="view-mode-toggle">
              <Radio.Group 
                value={viewMode} 
                onChange={(e) => setViewMode(e.target.value)}
                buttonStyle="solid"
              >
                <Radio.Button value="grid"><AppstoreOutlined /></Radio.Button>
                <Radio.Button value="list"><UnorderedListOutlined /></Radio.Button>
              </Radio.Group>
            </div>
            <Dropdown
              overlay={
                <Menu>
                  <Menu.Item 
                    key="createTime_desc" 
                    onClick={() => {
                      handleFilterChange('sortBy', 'createdAt')
                      handleFilterChange('sortOrder', 'desc')
                    }}
                  >
                    按创建时间（降序）
                  </Menu.Item>
                  <Menu.Item 
                    key="createTime_asc" 
                    onClick={() => {
                      handleFilterChange('sortBy', 'createdAt')
                      handleFilterChange('sortOrder', 'asc')
                    }}
                  >
                    按创建时间（升序）
                  </Menu.Item>
                  <Menu.Item 
                    key="name_asc" 
                    onClick={() => {
                      handleFilterChange('sortBy', 'name')
                      handleFilterChange('sortOrder', 'asc')
                    }}
                  >
                    按名称（A-Z）
                  </Menu.Item>
                  <Menu.Item 
                    key="name_desc" 
                    onClick={() => {
                      handleFilterChange('sortBy', 'name')
                      handleFilterChange('sortOrder', 'desc')
                    }}
                  >
                    按名称（Z-A）
                  </Menu.Item>
                  <Menu.Item 
                    key="size_desc" 
                    onClick={() => {
                      handleFilterChange('sortBy', 'size')
                      handleFilterChange('sortOrder', 'desc')
                    }}
                  >
                    按大小（降序）
                  </Menu.Item>
                  <Menu.Item 
                    key="size_asc" 
                    onClick={() => {
                      handleFilterChange('sortBy', 'size')
                      handleFilterChange('sortOrder', 'asc')
                    }}
                  >
                    按大小（升序）
                  </Menu.Item>
                </Menu>
              }
            >
              <Button icon={<FilterOutlined />}>
                排序 <DownloadOutlined style={{ transform: 'rotate(90deg)' }} />
              </Button>
            </Dropdown>
          </div>
        </div>
        
        <div className="folder-navigation">
          <div className="folder-path">
            {folderPath.map((folder, index) => (
              <span key={folder.id}>
                {index > 0 && <span className="path-separator">/</span>}
                <a 
                  className={index === folderPath.length - 1 ? 'current-folder' : ''}
                  onClick={() => handlePathClick(folder, index)}
                >
                  {folder.name}
                </a>
              </span>
            ))}
          </div>
        </div>
        
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          className="media-tabs"
        >
          <TabPane tab="全部" key="all" />
          <TabPane tab="图片" key="image" />
          <TabPane tab="视频" key="video" />
          <TabPane tab="360° 媒体" key="360_media" />
        </Tabs>
        
        {isLoading ? (
          <div className="loading-container">
            <Spin size="large" />
          </div>
        ) : error ? (
          <div className="error-container">
            <Empty 
              image={Empty.PRESENTED_IMAGE_SIMPLE} 
              description="加载失败，请重试"
            />
            <Button onClick={refetch} type="primary" style={{ marginTop: 16 }}>
              重新加载
            </Button>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? renderGridView() : renderListView()}
            
            <div className="pagination-container">
              <Pagination
                current={filters.page}
                pageSize={filters.limit}
                total={mediaData?.data?.pagination?.total || 0}
                showSizeChanger
                showQuickJumper
                showTotal={(total) => `共 ${total} 项`}
                onChange={(page) => handleFilterChange('page', page)}
                onShowSizeChange={(_, size) => handleFilterChange('limit', size)}
              />
            </div>
          </>
        )}
      </Card>
      
      {/* 上传文件模态框 */}
      <Modal
        title="上传文件"
        open={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={null}
        width={600}
      >
        <div className="upload-modal-content">
          <Tabs defaultActiveKey="normal">
            <TabPane tab="普通文件" key="normal">
              <Upload.Dragger
                multiple
                beforeUpload={() => false} // 阻止自动上传
                fileList={[]}
              >
                <p className="ant-upload-drag-icon">
                  <UploadOutlined />
                </p>
                <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
                <p className="ant-upload-hint">
                  支持单个或批量上传，单个文件最大20MB
                </p>
              </Upload.Dragger>
            </TabPane>
            <TabPane tab="VR媒体" key="vr">
              <MediaUploader
                accept="image/*,video/*"
                maxSize={1024 * 1024 * 1024} // 1GB
                label="上传VR媒体文件"
                onSuccess={handleUploadSuccess}
              />
              <div className="vr-upload-tips">
                <p>支持的VR媒体类型：</p>
                <ul>
                  <li>360° 全景照片（.jpg, .png, 建议分辨率 8192x4096）</li>
                  <li>180° 半球照片（.jpg, .png, 建议分辨率 8192x4096）</li>
                  <li>360° 全景视频（.mp4, 建议分辨率 4096x2048）</li>
                  <li>180° 半球视频（.mp4, 建议分辨率 4096x2048）</li>
                  <li>空间视频（.mp4, 建议分辨率 4096x4096）</li>
                </ul>
              </div>
            </TabPane>
          </Tabs>
        </div>
      </Modal>
      
      {/* 预览模态框 */}
      <Modal
        title="媒体预览"
        open={previewModalVisible}
        onCancel={() => {
          setPreviewModalVisible(false)
          setPreviewItem(null)
        }}
        footer={null}
        width={800}
        centered
      >
        {previewItem && (
          <div className="preview-container">
            {previewItem.mediaType.includes('image') ? (
              <img 
                src={previewItem.url} 
                alt={previewItem.name} 
                className="preview-image" 
              />
            ) : previewItem.mediaType.includes('video') ? (
              <video 
                src={previewItem.url} 
                controls 
                className="preview-video" 
              >
                您的浏览器不支持视频播放
              </video>
            ) : (
              <div className="preview-placeholder">
                <FileOutlined style={{ fontSize: '64px', color: '#d9d9d9' }} />
                <p>无法预览此文件类型</p>
              </div>
            )}
            <div className="preview-info">
              <h3>{previewItem.name}</h3>
              <p>
                <span>{getMediaTypeTag(previewItem.mediaType)}</span>
                <span>{formatFileSize(previewItem.size)}</span>
                <span>上传时间：{formatDate(previewItem.createdAt)}</span>
              </p>
              <div className="preview-actions">
                <Button icon={<DownloadOutlined />}>下载</Button>
                <Button icon={<EditOutlined />} onClick={() => {
                  setPreviewModalVisible(false)
                  handleRename(previewItem)
                }}>重命名</Button>
                <Button icon={<DeleteOutlined />} danger onClick={() => {
                  setPreviewModalVisible(false)
                  handleDelete(previewItem)
                }}>删除</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
      
      {/* 创建文件夹模态框 */}
      <Modal
        title="新建文件夹"
        open={createFolderModalVisible}
        onOk={confirmCreateFolder}
        onCancel={() => {
          setCreateFolderModalVisible(false)
          setNewFolderName('')
        }}
        confirmLoading={createFolderMutation.isLoading}
      >
        <div className="create-folder-content">
          <Input
            placeholder="请输入文件夹名称"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            autoFocus
          />
        </div>
      </Modal>
      
      {/* 重命名模态框 */}
      <Modal
        title="重命名"
        open={renameModalVisible}
        onOk={confirmRename}
        onCancel={() => {
          setRenameModalVisible(false)
          setItemToRename(null)
          setNewName('')
        }}
        confirmLoading={renameMutation.isLoading}
      >
        <div className="rename-content">
          <Input
            placeholder="请输入新名称"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
          />
        </div>
      </Modal>
      
      {/* 删除确认模态框 */}
      <Modal
        title="确认删除"
        open={deleteModalVisible}
        onOk={confirmDelete}
        onCancel={() => {
          setDeleteModalVisible(false)
          setItemsToDelete([])
        }}
        confirmLoading={deleteMutation.isLoading}
      >
        <div className="delete-content">
          <p>
            确定要删除以下{itemsToDelete.length > 1 ? `${itemsToDelete.length}个` : ''}资源吗？此操作不可恢复。
          </p>
          {itemsToDelete.length > 0 && (
            <ul className="delete-items-list">
              {itemsToDelete.map(item => (
                <li key={item.id}>
                  {item.type === 'folder' ? <FolderOutlined /> : renderFileIcon(item.mediaType)}
                  <span>{item.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default MediaLibraryPage