// components/fusion/FusionContentCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Tag, Tooltip, Dropdown, Menu, Button } from '../ui/common';
import { formatDate } from '../../utils/formatter';

const FusionContentCard = ({ fusion, onAction }) => {
  const getStatusInfo = (status) => {
    switch (status) {
      case 'published':
        return { text: '已发布', className: 'status-published', color: 'green' };
      case 'draft':
        return { text: '草稿', className: 'status-draft', color: 'gray' };
      case 'archived':
        return { text: '已归档', className: 'status-archived', color: 'orange' };
      default:
        return { text: status, className: '', color: 'default' };
    }
  };
  
  const handleMenuClick = ({ key }) => {
    onAction(key, fusion._id);
  };
  
  const menu = (
    <Menu onClick={handleMenuClick}>
      <Menu.Item key="edit">编辑</Menu.Item>
      <Menu.Item key="preview">预览</Menu.Item>
      <Menu.Divider />
      {fusion.status !== 'published' && <Menu.Item key="publish">发布</Menu.Item>}
      {fusion.status === 'published' && <Menu.Item key="unpublish">取消发布</Menu.Item>}
      <Menu.Divider />
      <Menu.Item key="delete" danger>删除</Menu.Item>
    </Menu>
  );
  
  const statusInfo = getStatusInfo(fusion.status);
  
  return (
    <Card 
      className="fusion-card"
      cover={
        <div className="fusion-card-cover">
          <img 
            alt={fusion.title}
            src={fusion.coverImage?.url || '/default-fusion-cover.jpg'}
          />
          <div className="fusion-content-count">
            <Tooltip title="包含的内容数量">
              <span>{fusion.contents?.length || 0} 个内容</span>
            </Tooltip>
          </div>
          <Tag className="status-tag" color={statusInfo.color}>
            {statusInfo.text}
          </Tag>
        </div>
      }
      actions={[
        <Button type="link" onClick={() => onAction('edit', fusion._id)}>编辑</Button>,
        <Button type="link" onClick={() => onAction('preview', fusion._id)}>预览</Button>,
        <Dropdown overlay={menu} trigger={['click']}>
          <Button type="link">更多</Button>
        </Dropdown>
      ]}
    >
      <Card.Meta
        title={fusion.title}
        description={
          <div className="fusion-card-info">
            <div className="fusion-meta">
              <span className="fusion-date">{formatDate(fusion.createdAt, 'YYYY-MM-DD')}</span>
              <span className="fusion-views">
                <i className="icon-eye"></i> {fusion.stats?.views || 0}
              </span>
            </div>
            {fusion.category && (
              <div className="fusion-category">
                <Tag>{getCategoryText(fusion.category)}</Tag>
              </div>
            )}
            <div className="fusion-description">
              {fusion.description?.length > 60 
                ? fusion.description.substring(0, 60) + '...' 
                : fusion.description}
            </div>
          </div>
        }
      />
    </Card>
  );
};

const getCategoryText = (category) => {
  const categoryMap = {
    'travel': '旅行',
    'education': '教育',
    'entertainment': '娱乐',
    'sports': '运动',
    'news': '新闻',
    'documentary': '纪录片',
    'art': '艺术',
    'other': '其他'
  };
  return categoryMap[category] || category;
};

export default FusionContentCard;