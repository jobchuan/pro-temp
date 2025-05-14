// controllers/contentController.js - Improved version with better response handling
const Content = require('../models/Content');
const Collaboration = require('../models/Collaboration');
const User = require('../models/User');

// 获取公开内容列表
const getContents = async (req, res) => {
    try {
        const { page = 1, limit = 20, status = 'published', contentType, category } = req.query;
        
        // 构建查询条件
        const query = { status };
        
        if (contentType) query.contentType = contentType;
        if (category) query.category = category;

        console.log('查询条件:', query);
        
        const contents = await Content.find(query)
            .populate('creatorId', 'username profile')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .exec();

        const total = await Content.countDocuments(query);
        
        console.log(`找到 ${contents.length} 个内容，总共 ${total} 个`);

        res.json({
            success: true,
            data: contents,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('获取内容列表错误:', error);
        res.status(500).json({
            success: false,
            error: req.__('error.server_error'),
            message: error.message
        });
    }
};

// 创建内容
const createContent = async (req, res) => {
    try {
        const {
            title,
            description,
            contentType,
            files,
            media,
            location,
            tags,
            category,
            pricing,
            isCollaborative
        } = req.body;

        // 确保 creatorId 存在
        if (!req.userId) {
            return res.status(401).json({
                success: false,
                error: req.__('error.unauthorized'),
                message: '未找到用户身份信息'
            });
        }

        console.log('创建内容:', { 
            userId: req.userId,
            contentType,
            title
        });

        // 创建内容
        const content = new Content({
            title,
            description,
            contentType,
            files,
            media,
            location,
            creatorId: req.userId,
            tags: tags || [],
            category: category || 'other',
            pricing: pricing || { isFree: true },
            status: 'published',
            collaboration: {
                isCollaborative: isCollaborative || false
            }
        });

        await content.save();

        console.log('内容已保存，ID:', content._id);

        // 如果是协作内容，创建协作记录
        if (isCollaborative) {
            const collaboration = new Collaboration({
                contentId: content._id,
                ownerId: req.userId,
                history: [{
                    action: 'created',
                    userId: req.userId,
                    details: { contentType }
                }]
            });

            await collaboration.save();

            // 更新内容的协作ID
            content.collaboration.collaborationId = collaboration._id;
            await content.save();
        }

        // 重要：populate创作者信息
        await content.populate('creatorId', 'username email profile');

        res.status(201).json({
            success: true,
            message: req.__('success.saved'),
            data: content
        });
    } catch (error) {
        console.error('创建内容错误:', error);
        res.status(400).json({
            success: false,
            error: req.__('error.validation_error'),
            message: error.message
        });
    }
};

// 获取内容详情
const getContent = async (req, res) => {
    try {
        const { contentId } = req.params;
        
        const content = await Content.findById(contentId)
            .populate('creatorId', 'username profile');

        if (!content) {
            return res.status(404).json({
                success: false,
                error: req.__('error.not_found'),
                message: '内容不存在'
            });
        }

        // 检查访问权限
        let hasAccess = false;
        
        // 内容创建者
        if (req.userId && content.creatorId._id.toString() === req.userId) {
            hasAccess = true;
        }
        
        // 协作者
        if (req.userId && content.collaboration.isCollaborative && content.collaboration.collaborationId) {
            const collaboration = await Collaboration.findById(content.collaboration.collaborationId);
            
            if (collaboration) {
                const isCollaborator = collaboration.collaborators.some(
                    c => c.userId.toString() === req.userId && c.status === 'accepted'
                );
                
                if (isCollaborator || collaboration.settings.allowPublicView) {
                    hasAccess = true;
                }
            }
        }
        
        // 已发布的内容
        if (content.status === 'published') {
            hasAccess = true;
        }

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                error: req.__('error.unauthorized'),
                message: '没有权限访问此内容'
            });
        }

        // 增加查看次数
        content.stats.views += 1;
        await content.save();

        res.json({
            success: true,
            data: content
        });
    } catch (error) {
        console.error('获取内容错误:', error);
        res.status(500).json({
            success: false,
            error: req.__('error.server_error'),
            message: error.message
        });
    }
};

// 更新内容
const updateContent = async (req, res) => {
    try {
        const { contentId } = req.params;
        const updates = req.body;

        const content = await Content.findById(contentId);

        if (!content) {
            return res.status(404).json({
                success: false,
                error: req.__('error.not_found'),
                message: '内容不存在'
            });
        }

        // 检查编辑权限
        let canEdit = false;
        
        if (content.creatorId.toString() === req.userId) {
            canEdit = true;
        } else if (content.collaboration.isCollaborative && content.collaboration.collaborationId) {
            const collaboration = await Collaboration.findById(content.collaboration.collaborationId);
            
            if (collaboration && collaboration.checkPermission(req.userId, 'canEdit')) {
                canEdit = true;
                
                // 尝试锁定编辑
                try {
                    await collaboration.lockForEditing(req.userId);
                } catch (lockError) {
                    return res.status(423).json({
                        success: false,
                        error: '内容被锁定',
                        message: lockError.message
                    });
                }
            }
        }

        if (!canEdit) {
            return res.status(403).json({
                success: false,
                error: req.__('error.unauthorized'),
                message: '没有权限编辑此内容'
            });
        }

        // 记录变更历史
        const changes = {};
        Object.keys(updates).forEach(key => {
            if (JSON.stringify(content[key]) !== JSON.stringify(updates[key])) {
                changes[key] = {
                    old: content[key],
                    new: updates[key]
                };
                content[key] = updates[key];
            }
        });

        // 更新版本
        if (Object.keys(changes).length > 0) {
            await content.addVersionHistory(req.userId, changes);
        }

        content.updatedAt = new Date();
        await content.save();

        // 解锁编辑（如果是协作内容）
        if (content.collaboration.isCollaborative && content.collaboration.collaborationId) {
            const collaboration = await Collaboration.findById(content.collaboration.collaborationId);
            if (collaboration) {
                await collaboration.unlockEditing(req.userId);
            }
        }

        res.json({
            success: true,
            message: req.__('success.saved'),
            data: content
        });
    } catch (error) {
        console.error('更新内容错误:', error);
        res.status(400).json({
            success: false,
            error: req.__('error.validation_error'),
            message: error.message
        });
    }
};

// 获取用户的内容列表
const getUserContents = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, contentType, category } = req.query;
        
        // 构建查询条件
        const query = { creatorId: req.userId };
        
        if (status) query.status = status;
        if (contentType) query.contentType = contentType;
        if (category) query.category = category;

        const contents = await Content.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .exec();

        const total = await Content.countDocuments(query);

        res.json({
            success: true,
            data: contents,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('获取内容列表错误:', error);
        res.status(500).json({
            success: false,
            error: req.__('error.server_error'),
            message: error.message
        });
    }
};

// 删除内容
const deleteContent = async (req, res) => {
    try {
        const { contentId } = req.params;
        
        const content = await Content.findById(contentId);

        if (!content) {
            return res.status(404).json({
                success: false,
                error: req.__('error.not_found'),
                message: '内容不存在'
            });
        }

        // 检查删除权限
        let canDelete = false;
        
        if (content.creatorId.toString() === req.userId) {
            canDelete = true;
        } else if (content.collaboration.isCollaborative && content.collaboration.collaborationId) {
            const collaboration = await Collaboration.findById(content.collaboration.collaborationId);
            
            if (collaboration && collaboration.checkPermission(req.userId, 'canDelete')) {
                canDelete = true;
            }
        }

        if (!canDelete) {
            return res.status(403).json({
                success: false,
                error: req.__('error.unauthorized'),
                message: '没有权限删除此内容'
            });
        }

        // 软删除：更改状态为archived
        content.status = 'archived';
        await content.save();

        res.json({
            success: true,
            message: req.__('success.deleted'),
            data: { contentId }
        });
    } catch (error) {
        console.error('删除内容错误:', error);
        res.status(500).json({
            success: false,
            error: req.__('error.server_error'),
            message: error.message
        });
    }
};

module.exports = {
    getContents,
    createContent,
    getContent,
    updateContent,
    getUserContents,
    deleteContent
};