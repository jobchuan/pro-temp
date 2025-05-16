// src/services/contentService.js
const Content = require('../models/Content');
const ViewHistory = require('../models/ViewHistory');
const UserInteraction = require('../models/UserInteraction');
const { AppError } = require('../utils/errorHandler');
const { getCache, setCache, deleteCache } = require('./cacheService');

class ContentService {
  /**
   * 获取内容列表
   */
  async getContents(query, options = {}) {
    const { 
      page = 1, 
      limit = 20, 
      sort = '-createdAt',
      cache = true,
      ttl = 3600 // 1小时缓存
    } = options;
    
    // 如果启用缓存且是简单查询，尝试从缓存获取
    if (cache && !query.creatorId) {
      const cacheKey = `contents:${JSON.stringify(query)}:${page}:${limit}:${sort}`;
      const cachedData = await getCache(cacheKey);
      
      if (cachedData) {
        return cachedData;
      }
      
      // 查询数据库
      const [contents, total] = await Promise.all([
        Content.find(query)
          .populate('creatorId', 'username profile.displayName')
          .sort(sort)
          .limit(parseInt(limit))
          .skip((parseInt(page) - 1) * parseInt(limit)),
        Content.countDocuments(query)
      ]);
      
      const result = {
        contents,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };
      
      // 缓存结果
      await setCache(cacheKey, result, ttl);
      return result;
    }
    
    // 不使用缓存或复杂查询
    const [contents, total] = await Promise.all([
      Content.find(query)
        .populate('creatorId', 'username profile.displayName')
        .sort(sort)
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit)),
      Content.countDocuments(query)
    ]);
    
    return {
      contents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
  
  /**
   * 获取内容详情
   */
  async getContent(contentId, userId) {
    // 先尝试从缓存获取
    const cacheKey = `content:${contentId}`;
    const cachedContent = await getCache(cacheKey);
    
    if (cachedContent) {
      // 记录查看记录（但不等待）
      if (userId) {
        this.incrementViewCount(contentId, userId).catch(err => 
          console.error('记录查看失败:', err)
        );
      }
      
      return cachedContent;
    }
    
    // 查询数据库
    const content = await Content.findById(contentId)
      .populate('creatorId', 'username profile.displayName');
      
    if (!content) {
      throw new AppError('内容不存在', 404, 'not_found');
    }
    
    // 记录查看记录（但不等待）
    if (userId) {
      this.incrementViewCount(contentId, userId).catch(err => 
        console.error('记录查看失败:', err)
      );
    }
    
    // 缓存内容
    await setCache(cacheKey, content, 3600);
    
    return content;
  }
  
  /**
   * 增加查看次数
   */
  async incrementViewCount(contentId, userId) {
    // 记录查看历史
    if (userId) {
      await ViewHistory.findOneAndUpdate(
        { userId, contentId },
        { 
          $setOnInsert: { userId, contentId },
          $inc: { viewCount: 1 },
          $set: { lastViewedAt: new Date() }
        },
        { 
          upsert: true,
          new: true
        }
      );
    }
    
    // 更新内容查看次数
    await Content.findByIdAndUpdate(
      contentId,
      { $inc: { 'stats.views': 1 } }
    );
    
    // 删除缓存，以便下次获取最新的查看次数
    await deleteCache(`content:${contentId}`);
  }
  
  /**
   * 创建内容
   */
  async createContent(contentData, userId) {
    // 确保 creatorId 存在
    contentData.creatorId = userId;
    
    // 创建内容
    const content = await Content.create(contentData);
    
    // 如果是协作内容，创建协作记录
    if (contentData.collaboration?.isCollaborative) {
      const Collaboration = require('../models/Collaboration');
      const collaboration = await Collaboration.create({
        contentId: content._id,
        ownerId: userId,
        history: [{
          action: 'created',
          userId,
          details: { contentType: content.contentType }
        }]
      });
      
      // 更新内容的协作ID
      content.collaboration.collaborationId = collaboration._id;
      await content.save();
    }
    
    return content;
  }
  
  /**
   * 更新内容
   */
  async updateContent(contentId, updates, userId) {
    // 查找内容并验证所有权
    const content = await Content.findOne({
      _id: contentId,
      creatorId: userId
    });
    
    if (!content) {
      throw new AppError('内容不存在或您无权编辑', 404, 'not_found');
    }
    
    // 保护某些字段不被直接更新
    const protectedFields = ['_id', 'creatorId', 'createdAt', 'stats'];
    for (const field of protectedFields) {
      delete updates[field];
    }
    
    // 应用更新
    Object.keys(updates).forEach(key => {
      if (key === 'files' || key === 'media') {
        // 对文件和媒体对象进行合并而不是完全替换
        content[key] = { ...content[key], ...updates[key] };
      } else {
        content[key] = updates[key];
      }
    });
    
    // 添加版本历史
    if (!content.version) {
      content.version = { current: 1, history: [] };
    }
    
    content.version.history.push({
      version: content.version.current,
      changedBy: userId,
      changedAt: new Date(),
      changes: updates
    });
    
    content.version.current += 1;
    content.updatedAt = new Date();
    
    await content.save();
    
    // 删除缓存
    await deleteCache(`content:${contentId}`);
    
    return content;
  }
  
  /**
   * 删除内容（软删除）
   */
  async deleteContent(contentId, userId) {
    // 查找内容并验证所有权
    const content = await Content.findOne({
      _id: contentId,
      creatorId: userId
    });
    
    if (!content) {
      throw new AppError('内容不存在或您无权删除', 404, 'not_found');
    }
    
    // 软删除（更改状态为已归档）
    content.status = 'archived';
    content.updatedAt = new Date();
    await content.save();
    
    // 删除缓存
    await deleteCache(`content:${contentId}`);
    
    return { contentId };
  }
}

module.exports = new ContentService();