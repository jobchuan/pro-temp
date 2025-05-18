// src/components/content/TagsEditModal.jsx
import React, { useState, useEffect } from 'react'
import { Modal, Select, Spin, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useQuery } from 'react-query'
import { tagsApiService } from '@/services/api/tagsService'

const { Option } = Select

const TagsEditModal = ({ visible, onCancel, onConfirm, loading, initialTags = [] }) => {
  const [selectedTags, setSelectedTags] = useState([])
  const [inputValue, setInputValue] = useState('')
  
  // 重置表单
  useEffect(() => {
    if (visible) {
      setSelectedTags(initialTags)
    }
  }, [visible, initialTags])
  
  // 获取常用标签
  const { data: tagsData, isLoading: isTagsLoading } = useQuery(
    'commonTags',
    () => tagsApiService.getCommonTags(),
    {
      enabled: visible,
      staleTime: 10 * 60 * 1000, // 10分钟内不重新获取
      cacheTime: 30 * 60 * 1000  // 缓存30分钟
    }
  )
  
  // 处理添加新标签
  const handleAddTag = (e) => {
    e.preventDefault()
    const tag = inputValue.trim()
    
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag])
      setInputValue('')
    }
  }
  
  // 处理标签选择变更
  const handleTagChange = (tags) => {
    setSelectedTags(tags)
  }
  
  // 处理确认
  const handleConfirm = () => {
    onConfirm(selectedTags)
  }
  
  // 渲染标签选项
  const renderTagOptions = () => {
    const commonTags = tagsData?.data || []
    
    return commonTags.map(tag => (
      <Option key={tag} value={tag}>
        {tag}
      </Option>
    ))
  }
  
  return (
    <Modal
      title="编辑标签"
      open={visible}
      onCancel={onCancel}
      onOk={handleConfirm}
      confirmLoading={loading}
      destroyOnClose
    >
      <div className="tags-form">
        <Select
          mode="tags"
          placeholder="添加标签"
          value={selectedTags}
          onChange={handleTagChange}
          style={{ width: '100%' }}
          maxTagCount={10}
          maxTagTextLength={20}
          loading={isTagsLoading}
          dropdownRender={menu => (
            <div>
              {menu}
              {isTagsLoading && (
                <div style={{ padding: '8px', textAlign: 'center' }}>
                  <Spin size="small" />
                </div>
              )}
            </div>
          )}
        >
          {renderTagOptions()}
        </Select>
        
        <div className="tips" style={{ marginTop: 12, color: '#999', fontSize: 12 }}>
          标签可以帮助组织和分类内容，提高内容的可发现性。
          <br />
          提示：输入后按Enter添加自定义标签。
        </div>
      </div>
    </Modal>
  )
}

export default TagsEditModal
