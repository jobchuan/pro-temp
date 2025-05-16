// controllers/creatorController.js
const Content = require('../models/Content');
const Comment = require('../models/Comment');
const User = require('../models/User');
const CreatorIncome = require('../models/CreatorIncome');
const Order = require('../models/Order');
const UserInteraction = require('../models/UserInteraction');
const ViewHistory = require('../models/ViewHistory');
const mongoose = require('mongoose');

// ===== 内容管理功能 =====

// 获取创作者内容列表
const getCreatorContents = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            status, 
            contentType, 
            search, 
            sort = '-createdAt',
            category,
            tag,
            dateFrom,
            dateTo,
            pricingModel,
            publishStatus
        } = req.query;
        
        // 构建查询条件
        const query = { creatorId: req.userId };
        
        // 基本过滤条件
        if (status) query.status = status;
        if (contentType) query.contentType = contentType;
        if (category) query.category = category;
        
        // 标签过滤
        if (tag) query.tags = { $in: [tag] };
        
        // 日期范围过滤
        if (dateFrom || dateTo) {
            query.createdAt = {};
            if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
            if (dateTo) query.createdAt.$lte = new Date(dateTo);
        }
        
        // 价格模式过滤
        if (pricingModel) {
            query['pricing.isFree'] = pricingModel === 'free';
        }
        
        // 发布状态过滤
        if (publishStatus) {
            if (publishStatus === 'published') {
                query.publishedAt = { $exists: true, $ne: null };
            } else if (publishStatus === 'unpublished') {
                query.publishedAt = { $exists: false };
            }
        }
        
        // 搜索过滤
        if (search) {
            query.$or = [
                { "title.zh-CN": { $regex: search, $options: 'i' } },
                { "title.en-US": { $regex: search, $options: 'i' } },
                { tags: { $in: [search] } }
            ];
        }
        
        // 执行查询
        const contents = await Content.find(query)
            .sort(sort)
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));
            
        const total = await Content.countDocuments(query);
        
        // 获取每个内容的基本分析数据
        const contentsWithStats = await Promise.all(contents.map(async (content) => {
            const contentObj = content.toObject();
            
            // 获取最近7天的观看数据
            const last7DaysViews = await ViewHistory.countDocuments({
                contentId: content._id,
                createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            });
            
            // 获取评论数
            const commentCount = await Comment.countDocuments({
                contentId: content._id,
                status: 'active'
            });
            
            // 获取内容收入
            const incomeStats = await CreatorIncome.aggregate([
                { $match: { contentId: mongoose.Types.ObjectId(content._id) } },
                { $group: {
                    _id: null,
                    totalAmount: { $sum: '$totalAmount' },
                    netAmount: { $sum: '$netAmount' }
                }}
            ]);
            
            return {
                ...contentObj,
                recentStats: {
                    last7DaysViews,
                    commentCount,
                    income: incomeStats.length > 0 ? incomeStats[0].netAmount : 0
                }
            };
        }));
        
        // 返回分类和标签统计
        const categoryCounts = await Content.aggregate([
            { $match: { creatorId: mongoose.Types.ObjectId(req.userId) } },
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        
        // 获取所有标签和计数
        const allContents = await Content.find({ creatorId: req.userId });
        const tagCounts = {};
        
        allContents.forEach(content => {
            if (content.tags && Array.isArray(content.tags)) {
                content.tags.forEach(tag => {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
            }
        });
        
        const tagStats = Object.entries(tagCounts)
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 20); // 取前20个常用标签
        
        res.json({
            success: true,
            data: {
                contents: contentsWithStats,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                },
                filters: {
                    categories: categoryCounts,
                    topTags: tagStats
                }
            }
        });
    } catch (error) {
        console.error('获取创作者内容列表失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 获取单个内容详情
const getContentDetails = async (req, res) => {
    try {
        const { contentId } = req.params;
        
        const content = await Content.findOne({
            _id: contentId,
            creatorId: req.userId
        });
        
        if (!content) {
            return res.status(404).json({
                success: false,
                error: '未找到',
                message: '内容不存在或您无权访问'
            });
        }
        
        // 获取详细统计数据
        const viewsCount = await ViewHistory.countDocuments({ contentId });
        const uniqueViewers = await ViewHistory.distinct('userId', { contentId }).length;
        
        // 计算完成率
        const histories = await ViewHistory.find({ contentId });
        let completedCount = 0;
        histories.forEach(history => {
            if (history.isCompleted) {
                completedCount++;
            }
        });
        const completionRate = histories.length > 0 ? (completedCount / histories.length) * 100 : 0;
        
        // 计算平均观看时长
        let totalWatchTime = 0;
        histories.forEach(history => {
            totalWatchTime += history.progress;
        });
        const avgWatchTime = histories.length > 0 ? totalWatchTime / histories.length : 0;
        
        // 获取互动数据
        const likesCount = await UserInteraction.countDocuments({ 
            contentId, 
            type: 'like',
            isActive: true
        });
        
        const favoritesCount = await UserInteraction.countDocuments({ 
            contentId, 
            type: 'favorite',
            isActive: true
        });
        
        const commentsCount = await Comment.countDocuments({ 
            contentId,
            status: 'active'
        });
        
        // 获取收入数据
        const incomeStats = await CreatorIncome.aggregate([
            { $match: { contentId: mongoose.Types.ObjectId(contentId) } },
            { $group: {
                _id: null,
                totalAmount: { $sum: '$totalAmount' },
                platformFee: { $sum: '$platformFee' },
                netAmount: { $sum: '$netAmount' },
                count: { $sum: 1 }
            }}
        ]);
        
        res.json({
            success: true,
            data: {
                content,
                statistics: {
                    views: viewsCount,
                    uniqueViewers,
                    completionRate,
                    avgWatchTime,
                    likes: likesCount,
                    favorites: favoritesCount,
                    comments: commentsCount
                },
                income: incomeStats.length > 0 ? {
                    totalAmount: incomeStats[0].totalAmount,
                    platformFee: incomeStats[0].platformFee,
                    netAmount: incomeStats[0].netAmount,
                    transactions: incomeStats[0].count
                } : {
                    totalAmount: 0,
                    platformFee: 0,
                    netAmount: 0,
                    transactions: 0
                }
            }
        });
    } catch (error) {
        console.error('获取内容详情失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 创建新内容
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

        // 验证必要的字段
        if (!title || !title['zh-CN']) {
            return res.status(400).json({
                success: false,
                error: '验证错误',
                message: '标题不能为空'
            });
        }

        if (!contentType) {
            return res.status(400).json({
                success: false,
                error: '验证错误',
                message: '内容类型不能为空'
            });
        }

        if (!files || !files.main || !files.main.url) {
            return res.status(400).json({
                success: false,
                error: '验证错误',
                message: '主文件URL不能为空'
            });
        }

        console.log('创建内容:', { 
            userId: req.userId,
            contentType,
            title: title['zh-CN']
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
            status: 'draft', // 初始状态为草稿
            collaboration: {
                isCollaborative: isCollaborative || false
            }
        });

        await content.save();
        console.log('内容已保存，ID:', content._id);

        // 如果是协作内容，创建协作记录
        if (isCollaborative) {
            const Collaboration = require('../models/Collaboration');
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

        // 填充创作者信息
        await content.populate('creatorId', 'username email profile');

        res.status(201).json({
            success: true,
            message: '内容创建成功',
            data: content
        });
    } catch (error) {
        console.error('创建内容错误:', error);
        res.status(400).json({
            success: false,
            error: '验证错误',
            message: error.message
        });
    }
};

// 更新内容
const updateContent = async (req, res) => {
    try {
        const { contentId } = req.params;
        const updates = req.body;
        
        // 查找内容并验证所有权
        const content = await Content.findOne({
            _id: contentId,
            creatorId: req.userId
        });
        
        if (!content) {
            return res.status(404).json({
                success: false,
                error: '未找到',
                message: '内容不存在或您无权编辑'
            });
        }
        
        // 保护某些字段不被直接更新
        const protectedFields = ['_id', 'creatorId', 'status', 'createdAt', 'stats'];
        for (const field of protectedFields) {
            delete updates[field];
        }
        
        // 检查是否更新价格设置
        if (updates.pricing && content.pricing.isFree !== updates.pricing.isFree) {
            // 如果从免费变为付费，或从付费变为免费，记录这一变更
            console.log(`内容 ${contentId} 价格模式变更: ${content.pricing.isFree ? '免费->付费' : '付费->免费'}`);
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
        
        // 更新时间戳
        content.updatedAt = new Date();
        
        // 添加版本历史
        if (!content.version) {
            content.version = { current: 1, history: [] };
        }
        
        content.version.history.push({
            version: content.version.current,
            changedBy: req.userId,
            changedAt: new Date(),
            changes: updates
        });
        
        content.version.current += 1;
        
        await content.save();
        
        res.json({
            success: true,
            message: '内容已更新',
            data: content
        });
    } catch (error) {
        console.error('更新内容错误:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 删除内容
const deleteContent = async (req, res) => {
    try {
        const { contentId } = req.params;
        
        // 查找内容并验证所有权
        const content = await Content.findOne({
            _id: contentId,
            creatorId: req.userId
        });
        
        if (!content) {
            return res.status(404).json({
                success: false,
                error: '未找到',
                message: '内容不存在或您无权删除'
            });
        }
        
        // 软删除（更改状态为已归档）
        content.status = 'archived';
        content.updatedAt = new Date();
        await content.save();
        
        res.json({
            success: true,
            message: '内容已归档',
            data: { contentId }
        });
    } catch (error) {
        console.error('删除内容错误:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 更新内容状态
const updateContentStatus = async (req, res) => {
    try {
        const { contentId } = req.params;
        const { status } = req.body;
        
        // 验证状态值
        const validStatuses = ['draft', 'pending_review', 'published', 'archived'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: '无效请求',
                message: '无效的状态值'
            });
        }
        
        // 查找内容并验证所有权
        const content = await Content.findOne({
            _id: contentId,
            creatorId: req.userId
        });
        
        if (!content) {
            return res.status(404).json({
                success: false,
                error: '未找到',
                message: '内容不存在或您无权更新'
            });
        }
        
        // 更新状态
        content.status = status;
        
        // 如果是发布状态，设置发布时间
        if (status === 'published' && !content.publishedAt) {
            content.publishedAt = new Date();
        }
        
        content.updatedAt = new Date();
        await content.save();
        
        res.json({
            success: true,
            message: `内容状态已更新为 ${status}`,
            data: content
        });
    } catch (error) {
        console.error('更新内容状态错误:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};
// 内容批量管理
const batchUpdateContentsStatus = async (req, res) => {
    try {
        const { contentIds, status } = req.body;
        
        if (!contentIds || !Array.isArray(contentIds) || contentIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: '无效请求',
                message: '内容ID列表不能为空'
            });
        }
        
        if (!['draft', 'pending_review', 'published', 'archived'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: '无效请求',
                message: '无效的状态值'
            });
        }
        
        // 查询确认这些内容都属于当前创作者
        const contentsCount = await Content.countDocuments({
            _id: { $in: contentIds },
            creatorId: req.userId
        });
        
        if (contentsCount !== contentIds.length) {
            return res.status(403).json({
                success: false,
                error: '权限错误',
                message: '您无权更新某些内容'
            });
        }
        
        // 更新内容状态
        const updateData = { 
            status,
            updatedAt: new Date()
        };
        
        // 如果状态是"已发布"，且之前未发布过，则设置发布时间
        if (status === 'published') {
            const contents = await Content.find({
                _id: { $in: contentIds },
                publishedAt: { $exists: false }
            });
            
            const unpublishedIds = contents.map(content => content._id);
            
            if (unpublishedIds.length > 0) {
                await Content.updateMany(
                    { _id: { $in: unpublishedIds } },
                    { $set: { ...updateData, publishedAt: new Date() } }
                );
            }
            
            const publishedIds = contentIds.filter(id => 
                !unpublishedIds.some(unpubId => unpubId.toString() === id.toString())
            );
            
            if (publishedIds.length > 0) {
                await Content.updateMany(
                    { _id: { $in: publishedIds } },
                    { $set: updateData }
                );
            }
        } else {
            // 不是发布状态，直接更新所有内容
            await Content.updateMany(
                { _id: { $in: contentIds } },
                { $set: updateData }
            );
        }
        
        res.json({
            success: true,
            message: `已成功更新 ${contentIds.length} 个内容的状态为 ${status}`,
            data: { updatedCount: contentIds.length }
        });
    } catch (error) {
        console.error('批量更新内容状态失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 批量添加标签
const batchAddTags = async (req, res) => {
    try {
        const { contentIds, tags } = req.body;
        
        if (!contentIds || !Array.isArray(contentIds) || contentIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: '无效请求',
                message: '内容ID列表不能为空'
            });
        }
        
        if (!tags || !Array.isArray(tags) || tags.length === 0) {
            return res.status(400).json({
                success: false,
                error: '无效请求',
                message: '标签列表不能为空'
            });
        }
        
        // 确认内容所有权
        const contentsCount = await Content.countDocuments({
            _id: { $in: contentIds },
            creatorId: req.userId
        });
        
        if (contentsCount !== contentIds.length) {
            return res.status(403).json({
                success: false,
                error: '权限错误',
                message: '您无权更新某些内容'
            });
        }
        
        // 添加标签（避免重复）
        const result = await Content.updateMany(
            { _id: { $in: contentIds } },
            { 
                $addToSet: { tags: { $each: tags } },
                $set: { updatedAt: new Date() }
            }
        );
        
        res.json({
            success: true,
            message: `已成功为 ${contentIds.length} 个内容添加标签`,
            data: { 
                updatedCount: contentIds.length,
                addedTags: tags
            }
        });
    } catch (error) {
        console.error('批量添加标签失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 批量移除标签
const batchRemoveTags = async (req, res) => {
    try {
        const { contentIds, tags } = req.body;
        
        if (!contentIds || !Array.isArray(contentIds) || contentIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: '无效请求',
                message: '内容ID列表不能为空'
            });
        }
        
        if (!tags || !Array.isArray(tags) || tags.length === 0) {
            return res.status(400).json({
                success: false,
                error: '无效请求',
                message: '标签列表不能为空'
            });
        }
        
        // 确认内容所有权
        const contentsCount = await Content.countDocuments({
            _id: { $in: contentIds },
            creatorId: req.userId
        });
        
        if (contentsCount !== contentIds.length) {
            return res.status(403).json({
                success: false,
                error: '权限错误',
                message: '您无权更新某些内容'
            });
        }
        
        // 移除标签
        const result = await Content.updateMany(
            { _id: { $in: contentIds } },
            { 
                $pullAll: { tags: tags },
                $set: { updatedAt: new Date() }
            }
        );
        
        res.json({
            success: true,
            message: `已成功从 ${contentIds.length} 个内容中移除标签`,
            data: { 
                updatedCount: contentIds.length,
                removedTags: tags
            }
        });
    } catch (error) {
        console.error('批量移除标签失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 批量更新分类
const batchUpdateCategory = async (req, res) => {
    try {
        const { contentIds, category } = req.body;
        
        if (!contentIds || !Array.isArray(contentIds) || contentIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: '无效请求',
                message: '内容ID列表不能为空'
            });
        }
        
        if (!category) {
            return res.status(400).json({
                success: false,
                error: '无效请求',
                message: '分类不能为空'
            });
        }
        
        // 确认分类有效性
        const validCategories = ['travel', 'education', 'entertainment', 'sports', 'news', 'documentary', 'art', 'other'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({
                success: false,
                error: '无效请求',
                message: '无效的分类值'
            });
        }
        
        // 确认内容所有权
        const contentsCount = await Content.countDocuments({
            _id: { $in: contentIds },
            creatorId: req.userId
        });
        
        if (contentsCount !== contentIds.length) {
            return res.status(403).json({
                success: false,
                error: '权限错误',
                message: '您无权更新某些内容'
            });
        }
        
        // 更新分类
        const result = await Content.updateMany(
            { _id: { $in: contentIds } },
            { 
                $set: { 
                    category,
                    updatedAt: new Date() 
                }
            }
        );
        
        res.json({
            success: true,
            message: `已成功更新 ${contentIds.length} 个内容的分类为 ${category}`,
            data: { 
                updatedCount: contentIds.length,
                category
            }
        });
    } catch (error) {
        console.error('批量更新分类失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 批量删除内容（软删除）
const batchDeleteContents = async (req, res) => {
    try {
        const { contentIds } = req.body;
        
        if (!contentIds || !Array.isArray(contentIds) || contentIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: '无效请求',
                message: '内容ID列表不能为空'
            });
        }
        
        // 确认内容所有权
        const contentsCount = await Content.countDocuments({
            _id: { $in: contentIds },
            creatorId: req.userId
        });
        
        if (contentsCount !== contentIds.length) {
            return res.status(403).json({
                success: false,
                error: '权限错误',
                message: '您无权删除某些内容'
            });
        }
        
        // 软删除内容（将状态改为archived）
        const result = await Content.updateMany(
            { _id: { $in: contentIds } },
            { 
                $set: { 
                    status: 'archived',
                    updatedAt: new Date() 
                }
            }
        );
        
        res.json({
            success: true,
            message: `已成功归档 ${contentIds.length} 个内容`,
            data: { 
                archivedCount: contentIds.length
            }
        });
    } catch (error) {
        console.error('批量删除内容失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};
// 内容导出功能
const exportContentData = async (req, res) => {
    try {
        const { contentId, format = 'json' } = req.params;
        
        // 验证内容所有权
        const content = await Content.findOne({
            _id: contentId,
            creatorId: req.userId
        });
        
        if (!content) {
            return res.status(404).json({
                success: false,
                error: '未找到',
                message: '内容不存在或您无权访问'
            });
        }
        
        // 获取相关数据
        const views = await ViewHistory.countDocuments({ contentId });
        const uniqueViewers = await ViewHistory.distinct('userId', { contentId }).length;
        
        const likes = await UserInteraction.countDocuments({ 
            contentId, 
            type: 'like',
            isActive: true 
        });
        
        const favorites = await UserInteraction.countDocuments({ 
            contentId, 
            type: 'favorite',
            isActive: true 
        });
        
        const comments = await Comment.find({ contentId })
            .populate('userId', 'username')
            .sort('-createdAt')
            .limit(100);
        
        // 获取收入数据
        const incomeStats = await CreatorIncome.aggregate([
            { $match: { contentId: mongoose.Types.ObjectId(contentId) } },
            { $group: {
                _id: null,
                totalAmount: { $sum: '$totalAmount' },
                platformFee: { $sum: '$platformFee' },
                netAmount: { $sum: '$netAmount' },
                count: { $sum: 1 }
            }}
        ]);
        
        const income = incomeStats.length > 0 ? {
            totalAmount: incomeStats[0].totalAmount,
            platformFee: incomeStats[0].platformFee,
            netAmount: incomeStats[0].netAmount,
            transactions: incomeStats[0].count
        } : {
            totalAmount: 0,
            platformFee: 0,
            netAmount: 0,
            transactions: 0
        };
        
        // 准备导出数据
        const exportData = {
            content: {
                id: content._id,
                title: content.title,
                description: content.description,
                contentType: content.contentType,
                category: content.category,
                tags: content.tags,
                status: content.status,
                pricing: content.pricing,
                createdAt: content.createdAt,
                publishedAt: content.publishedAt,
                updatedAt: content.updatedAt
            },
            statistics: {
                views,
                uniqueViewers,
                likes,
                favorites,
                commentsCount: await Comment.countDocuments({ contentId })
            },
            income,
            comments: comments.map(comment => ({
                id: comment._id,
                text: comment.text,
                user: comment.userId ? comment.userId.username : 'Unknown',
                createdAt: comment.createdAt,
                isPinned: comment.isPinned,
                status: comment.status,
                level: comment.level,
                replyCount: comment.replyCount
            }))
        };
        
        // 设置响应格式
        if (format === 'csv') {
            // 生成CSV格式
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="content-${contentId}.csv"`);
            
            // 简单CSV生成逻辑 - 在实际应用中使用CSV库
            let csv = 'Content ID,Title,Content Type,Category,Status,Views,Likes,Comments,Income\n';
            csv += `${content._id},"${content.title['zh-CN'] || ''}",${content.contentType},${content.category},`;
            csv += `${content.status},${views},${likes},${comments.length},${income.netAmount}\n`;
            
            res.send(csv);
        } else {
            // JSON格式
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="content-${contentId}.json"`);
            res.json(exportData);
        }
    } catch (error) {
        console.error('导出内容数据失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};
// ===== 分析功能 =====

// 获取分析概览
const getAnalyticsOverview = async (req, res) => {
    try {
        const creatorId = req.userId;
        
        // 获取创作者所有内容
        const contents = await Content.find({ creatorId });
        const contentIds = contents.map(content => content._id);
        
        // 如果没有内容，返回空数据
        if (contentIds.length === 0) {
            return res.json({
                success: true,
                data: {
                    totalStats: {
                        views: 0,
                        uniqueViewers: 0,
                        likes: 0,
                        favorites: 0,
                        comments: 0,
                        contentsCount: 0
                    },
                    recentTrend: [],
                    topContents: []
                }
            });
        }
        
        // 获取总体统计数据
        const totalViews = await ViewHistory.countDocuments({ 
            contentId: { $in: contentIds } 
        });
        
        const uniqueViewers = await ViewHistory.distinct('userId', { 
            contentId: { $in: contentIds } 
        });
        
        const totalLikes = await UserInteraction.countDocuments({ 
            contentId: { $in: contentIds },
            type: 'like',
            isActive: true
        });
        
        const totalFavorites = await UserInteraction.countDocuments({ 
            contentId: { $in: contentIds },
            type: 'favorite',
            isActive: true
        });
        
        const totalComments = await Comment.countDocuments({ 
            contentId: { $in: contentIds },
            status: 'active'
        });
        
        // 获取最近7天的统计趋势
        const last7DaysTrend = [];
        const now = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            
            const nextDay = new Date(date);
            nextDay.setDate(date.getDate() + 1);
            
            const dailyViews = await ViewHistory.countDocuments({
                contentId: { $in: contentIds },
                createdAt: { $gte: date, $lt: nextDay }
            });
            
            last7DaysTrend.push({
                date: date.toISOString().split('T')[0],
                views: dailyViews
            });
        }
        
        // 获取表现最佳的内容
        const viewsByContent = await ViewHistory.aggregate([
            { $match: { contentId: { $in: contentIds.map(id => mongoose.Types.ObjectId(id)) } } },
            { $group: { _id: '$contentId', views: { $sum: 1 } } },
            { $sort: { views: -1 } },
            { $limit: 5 }
        ]);
        
        const topContents = await Promise.all(viewsByContent.map(async (item) => {
            const content = await Content.findById(item._id);
            return {
                _id: content._id,
                title: content.title,
                views: item.views,
                thumbnailURL: content.files.thumbnail?.url || ''
            };
        }));
        
        res.json({
            success: true,
            data: {
                totalStats: {
                    views: totalViews,
                    uniqueViewers: uniqueViewers.length,
                    likes: totalLikes,
                    favorites: totalFavorites,
                    comments: totalComments,
                    contentsCount: contents.length
                },
                recentTrend: last7DaysTrend,
                topContents
            }
        });
    } catch (error) {
        console.error('获取分析概览失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 获取内容分析
const getContentAnalytics = async (req, res) => {
    try {
        const { contentId } = req.params;
        const { period = '7days' } = req.query;
        
        // 验证内容所有权
        const content = await Content.findOne({
            _id: contentId,
            creatorId: req.userId
        });
        
        if (!content) {
            return res.status(404).json({
                success: false,
                error: '未找到',
                message: '内容不存在或您无权访问'
            });
        }
        
        // 计算日期范围
        const endDate = new Date();
        let startDate;
        
        if (period === '7days') {
            startDate = new Date(endDate);
            startDate.setDate(endDate.getDate() - 7);
        } else if (period === '30days') {
            startDate = new Date(endDate);
            startDate.setDate(endDate.getDate() - 30);
        } else if (period === '90days') {
            startDate = new Date(endDate);
            startDate.setDate(endDate.getDate() - 90);
        } else {
            startDate = new Date(0); // 从1970年开始
        }
        
        // 获取观看数据
        const viewsData = [];
        let currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
            const dayStart = new Date(currentDate);
            const dayEnd = new Date(currentDate);
            dayEnd.setDate(dayEnd.getDate() + 1);
            
            const viewsCount = await ViewHistory.countDocuments({
                contentId,
                createdAt: { $gte: dayStart, $lt: dayEnd }
            });
            
            viewsData.push({
                date: dayStart.toISOString().split('T')[0],
                count: viewsCount
            });
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // 获取评论数据
        const commentsData = await Comment.find({
            contentId,
            status: 'active'
        })
        .sort('-createdAt')
        .limit(10)
        .populate('userId', 'username profile.displayName');
        
        // 获取用户交互数据
        const interactions = {
            likes: await UserInteraction.countDocuments({ 
                contentId, 
                type: 'like',
                isActive: true
            }),
            favorites: await UserInteraction.countDocuments({ 
                contentId, 
                type: 'favorite',
                isActive: true
            }),
            comments: await Comment.countDocuments({
                contentId,
                status: 'active'
            }),
            shares: content.stats.shares || 0
        };
        
        res.json({
            success: true,
            data: {
                content: {
                    _id: content._id,
                    title: content.title,
                    status: content.status,
                    createdAt: content.createdAt,
                    publishedAt: content.publishedAt,
                    thumbnailURL: content.files.thumbnail?.url || ''
                },
                period,
                stats: {
                    totalViews: content.stats.views || 0,
                    ...interactions
                },
                viewsTrend: viewsData,
                recentComments: commentsData.map(comment => ({
                    _id: comment._id,
                    text: comment.text,
                    createdAt: comment.createdAt,
                    user: {
                        _id: comment.userId._id,
                        username: comment.userId.username,
                        displayName: comment.userId.profile?.displayName || comment.userId.username
                    }
                }))
            }
        });
    } catch (error) {
        console.error('获取内容分析数据失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 获取分析趋势
const getAnalyticsTrends = async (req, res) => {
    try {
        const { period = 'month', metric = 'views' } = req.query;
        const creatorId = req.userId;
        
        // 获取创作者所有内容
        const contents = await Content.find({ creatorId });
        const contentIds = contents.map(content => content._id);
        
        // 如果没有内容，返回空数据
        if (contentIds.length === 0) {
            return res.json({
                success: true,
                data: {
                    period,
                    metric,
                    trends: []
                }
            });
        }
        
        // 确定日期范围
        const endDate = new Date();
        let startDate;
        let groupByFormat;
        
        if (period === 'week') {
            startDate = new Date(endDate);
            startDate.setDate(endDate.getDate() - 7);
            groupByFormat = '%Y-%m-%d'; // 按天分组
        } else if (period === 'month') {
            startDate = new Date(endDate);
            startDate.setMonth(endDate.getMonth() - 1);
            groupByFormat = '%Y-%m-%d'; // 按天分组
        } else if (period === 'year') {
            startDate = new Date(endDate);
            startDate.setFullYear(endDate.getFullYear() - 1);
            groupByFormat = '%Y-%m'; // 按月分组
        } else {
            startDate = new Date(endDate);
            startDate.setDate(endDate.getDate() - 30); // 默认30天
            groupByFormat = '%Y-%m-%d';
        }
        
        // 构建聚合管道
        let collection, matchField, groupField;
        
        if (metric === 'views') {
            collection = ViewHistory;
            matchField = 'contentId';
            groupField = 'createdAt';
        } else if (metric === 'likes') {
            collection = UserInteraction;
            matchField = 'contentId';
            groupField = 'createdAt';
        } else if (metric === 'comments') {
            collection = Comment;
            matchField = 'contentId';
            groupField = 'createdAt';
        } else {
            return res.status(400).json({
                success: false,
                error: '无效请求',
                message: '不支持的指标类型'
            });
        }
        
        // 根据不同的集合构建不同的匹配条件
        const matchCondition = { [matchField]: { $in: contentIds } };
        
        if (metric === 'likes') {
            matchCondition.type = 'like';
            matchCondition.isActive = true;
        }
        
        const trends = await collection.aggregate([
            { $match: {
                ...matchCondition,
                [groupField]: { $gte: startDate, $lte: endDate }
            }},
            { $group: {
                _id: { $dateToString: { format: groupByFormat, date: `$${groupField}` } },
                count: { $sum: 1 }
            }},
            { $sort: { '_id': 1 } }
        ]);
        
        res.json({
            success: true,
            data: {
                period,
                metric,
                trends: trends.map(item => ({
                    date: item._id,
                    value: item.count
                }))
            }
        });
    } catch (error) {
        console.error('获取分析趋势失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 获取受众分析
const getAudienceAnalytics = async (req, res) => {
    try {
        const creatorId = req.userId;
        
        // 获取创作者所有内容
        const contents = await Content.find({ creatorId });
        const contentIds = contents.map(content => content._id);
        
        // 如果没有内容，返回空数据
        if (contentIds.length === 0) {
            return res.json({
                success: true,
                data: {
                    uniqueViewers: 0,
                    returningViewers: 0,
                    deviceDistribution: [],
                    geographicDistribution: []
                }
            });
        }
        
        // 获取所有观看记录
        const viewHistories = await ViewHistory.find({
            contentId: { $in: contentIds }
        });
        
        // 获取唯一观众数量
        const uniqueViewerIds = [...new Set(viewHistories.map(h => h.userId.toString()))];
        
        // 获取回访观众数量（观看了2个以上的内容）
        const viewerContentCounts = {};
        viewHistories.forEach(history => {
            const userId = history.userId.toString();
            const contentId = history.contentId.toString();
            
            if (!viewerContentCounts[userId]) {
                viewerContentCounts[userId] = new Set();
            }
            
            viewerContentCounts[userId].add(contentId);
        });
        
        const returningViewers = Object.values(viewerContentCounts)
            .filter(contentSet => contentSet.size >= 2)
            .length;
        
        // 获取设备分布
        const deviceCounts = {};
        viewHistories.forEach(history => {
            if (history.deviceInfo && history.deviceInfo.platform) {
                const platform = history.deviceInfo.platform;
                deviceCounts[platform] = (deviceCounts[platform] || 0) + 1;
            }
        });
        
        const deviceDistribution = Object.entries(deviceCounts).map(([device, count]) => ({
            device,
            count,
            percentage: (count / viewHistories.length) * 100
        }));
        
        // 如果有地理位置数据，获取地理分布
        const geographicDistribution = [];
        
        res.json({
            success: true,
            data: {
                uniqueViewers: uniqueViewerIds.length,
                returningViewers,
                deviceDistribution,
                geographicDistribution
            }
        });
    } catch (error) {
        console.error('获取受众分析失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// ===== 评论管理功能 =====

// 获取创作者评论
const getCreatorComments = async (req, res) => {
    try {
        const { page = 1, limit = 20, sort = '-createdAt', status } = req.query;
        
        // 获取创作者的所有内容
        const contents = await Content.find({ creatorId: req.userId });
        const contentIds = contents.map(content => content._id);
        
        // 构建查询条件
        const query = { contentId: { $in: contentIds } };
        if (status) query.status = status;
        
        // 执行查询
        const comments = await Comment.find(query)
            .populate('userId', 'username profile.displayName avatarURL')
            .populate('contentId', 'title')
            .sort(sort)
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));
            
        const total = await Comment.countDocuments(query);
        
        res.json({
            success: true,
            data: {
                comments,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('获取创作者评论失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 获取内容评论
const getContentComments = async (req, res) => {
    try {
        const { contentId } = req.params;
        const { page = 1, limit = 20, sort = '-createdAt' } = req.query;
        
        // 验证内容所有权
        const content = await Content.findOne({
            _id: contentId,
            creatorId: req.userId
        });
        
        if (!content) {
            return res.status(404).json({
                success: false,
                error: '未找到',
                message: '内容不存在或您无权访问'
            });
        }
        
        // 查询评论
        const comments = await Comment.find({
            contentId,
            level: 0 // 仅顶层评论
        })
        .populate('userId', 'username profile.displayName avatarURL')
        .populate({
            path: 'replies',
            populate: {
                path: 'userId',
                select: 'username profile.displayName avatarURL'
            }
        })
        .sort(sort)
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));
        
        const total = await Comment.countDocuments({ contentId, level: 0 });
        
        res.json({
            success: true,
            data: {
                comments,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('获取内容评论失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 回复评论
const replyToComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { text } = req.body;
        
        if (!text) {
            return res.status(400).json({
                success: false,
                error: '无效请求',
                message: '回复内容不能为空'
            });
        }
        
        // 获取原始评论
        const originalComment = await Comment.findById(commentId)
            .populate('contentId');
            
        if (!originalComment) {
            return res.status(404).json({
                success: false,
                error: '未找到',
                message: '评论不存在'
            });
        }
        
        // 验证内容所有权
        if (originalComment.contentId.creatorId.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                error: '未授权',
                message: '您无权回复此评论'
            });
        }
        
        // 创建回复评论
        const reply = new Comment({
            contentId: originalComment.contentId._id,
            userId: req.userId,
            text,
            parentId: commentId,
            isCreatorComment: true,
            level: originalComment.level + 1
        });
        
        await reply.save();
        
        // 更新原始评论的回复计数
        originalComment.replyCount += 1;
        await originalComment.save();
        
        await reply.populate('userId', 'username profile.displayName avatarURL');
        
        res.status(201).json({
            success: true,
            message: '回复已发布',
            data: { comment: reply }
        });
    } catch (error) {
        console.error('回复评论失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 置顶评论
const pinComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { isPinned } = req.body;
        
        // 获取评论
        const comment = await Comment.findById(commentId)
            .populate('contentId');
            
        if (!comment) {
            return res.status(404).json({
                success: false,
                error: '未找到',
                message: '评论不存在'
            });
        }
        
        // 验证内容所有权
        if (comment.contentId.creatorId.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                error: '未授权',
                message: '您无权管理此评论'
            });
        }
        
        // 更新置顶状态
        comment.isPinned = !!isPinned;
        await comment.save();
        
        res.json({
            success: true,
            message: isPinned ? '评论已置顶' : '评论已取消置顶',
            data: { comment }
        });
    } catch (error) {
        console.error('置顶评论失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 更新评论状态
const updateCommentStatus = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { status } = req.body;
        
        if (!['active', 'hidden', 'deleted'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: '无效请求',
                message: '状态无效'
            });
        }
        
        // 获取评论
        const comment = await Comment.findById(commentId)
            .populate('contentId');
            
        if (!comment) {
            return res.status(404).json({
                success: false,
                error: '未找到',
                message: '评论不存在'
            });
        }
        
        // 验证内容所有权
        if (comment.contentId.creatorId.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                error: '未授权',
                message: '您无权管理此评论'
            });
        }
        
        // 更新状态
        comment.status = status;
        
        // 如果删除，更新文本
        if (status === 'deleted') {
            comment.text = '[评论已被创作者删除]';
            
            // 更新内容评论计数
            await Content.findByIdAndUpdate(comment.contentId, {
                $inc: { 'stats.comments': -1 }
            });
        }
        
        await comment.save();
        
        res.json({
            success: true,
            message: `评论状态已更新为 ${status}`,
            data: { comment }
        });
    } catch (error) {
        console.error('更新评论状态失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// ===== 收入管理功能 =====

// 获取收入概览
const getIncomeOverview = async (req, res) => {
    try {
        const creatorId = req.userId;
        
        // 获取总收入
        const totalIncome = await CreatorIncome.aggregate([
            { $match: { creatorId: mongoose.Types.ObjectId(creatorId) } },
            { $group: {
                _id: null,
                totalAmount: { $sum: '$totalAmount' },
                platformFee: { $sum: '$platformFee' },
                netAmount: { $sum: '$netAmount' },
                count: { $sum: 1 }
            }}
        ]);
        
        // 获取本月收入
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthlyIncome = await CreatorIncome.aggregate([
            { 
                $match: { 
                    creatorId: mongoose.Types.ObjectId(creatorId),
                    createdAt: { $gte: firstDayOfMonth }
                } 
            },
            { $group: {
                _id: null,
                totalAmount: { $sum: '$totalAmount' },
                platformFee: { $sum: '$platformFee' },
                netAmount: { $sum: '$netAmount' },
                count: { $sum: 1 }
            }}
        ]);
        
        // 获取待结算收入
        const pendingIncome = await CreatorIncome.aggregate([
            { 
                $match: { 
                    creatorId: mongoose.Types.ObjectId(creatorId),
                    withdrawStatus: { $in: ['pending', 'withdrawable'] }
                } 
            },
            { $group: {
                _id: null,
                totalAmount: { $sum: '$totalAmount' },
                platformFee: { $sum: '$platformFee' },
                netAmount: { $sum: '$netAmount' },
                count: { $sum: 1 }
            }}
        ]);
        
        // 获取按收入来源的统计
        const incomeBySource = await CreatorIncome.aggregate([
            { $match: { creatorId: mongoose.Types.ObjectId(creatorId) } },
            { $group: {
                _id: '$source',
                totalAmount: { $sum: '$totalAmount' },
                netAmount: { $sum: '$netAmount' },
                count: { $sum: 1 }
            }}
        ]);
        
        // 获取收入趋势（按月）
        const incomeTrends = [];
        for (let i = 5; i >= 0; i--) {
            const monthDate = new Date();
            monthDate.setMonth(monthDate.getMonth() - i);
            
            const year = monthDate.getFullYear();
            const month = monthDate.getMonth();
            
            const startDate = new Date(year, month, 1);
            const endDate = new Date(year, month + 1, 0, 23, 59, 59);
            
            const monthIncome = await CreatorIncome.aggregate([
                { 
                    $match: { 
                        creatorId: mongoose.Types.ObjectId(creatorId),
                        createdAt: { $gte: startDate, $lte: endDate }
                    } 
                },
                { $group: {
                    _id: null,
                    netAmount: { $sum: '$netAmount' }
                }}
            ]);
            
            incomeTrends.push({
                month: `${year}-${String(month + 1).padStart(2, '0')}`,
                income: monthIncome.length > 0 ? monthIncome[0].netAmount : 0
            });
        }
        
        res.json({
            success: true,
            data: {
                overview: {
                    totalLifetime: totalIncome.length > 0 ? totalIncome[0].netAmount : 0,
                    thisMonth: monthlyIncome.length > 0 ? monthlyIncome[0].netAmount : 0,
                    pending: pendingIncome.length > 0 ? pendingIncome[0].netAmount : 0,
                    totalTransactions: totalIncome.length > 0 ? totalIncome[0].count : 0
                },
                bySource: incomeBySource,
                trends: incomeTrends
            }
        });
    } catch (error) {
        console.error('获取收入概览失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 获取收入明细
const getIncomeDetails = async (req, res) => {
    try {
        const { page = 1, limit = 20, sort = '-createdAt', source, startDate, endDate } = req.query;
        const creatorId = req.userId;
        
        // 构建查询条件
        const query = { creatorId };
        if (source) query.source = source;
        
        // 处理日期筛选
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }
        
        // 执行查询
        const incomes = await CreatorIncome.find(query)
            .populate({
                path: 'contentId',
                select: 'title'
            })
            .sort(sort)
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));
            
        const total = await CreatorIncome.countDocuments(query);
        
        res.json({
            success: true,
            data: {
                incomes,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('获取收入明细失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 获取收入趋势
const getIncomeTrends = async (req, res) => {
    try {
        const { period = 'month', source } = req.query;
        const creatorId = req.userId;
        
        // 确定日期范围和分组方式
        const now = new Date();
        let startDate, groupByFormat;
        
        if (period === 'week') {
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
            groupByFormat = '%Y-%m-%d'; // 按天分组
        } else if (period === 'month') {
            startDate = new Date(now);
            startDate.setMonth(now.getMonth() - 1);
            groupByFormat = '%Y-%m-%d'; // 按天分组
        } else if (period === 'year') {
            startDate = new Date(now);
            startDate.setFullYear(now.getFullYear() - 1);
            groupByFormat = '%Y-%m'; // 按月分组
        } else {
            startDate = new Date(now);
            startDate.setMonth(now.getMonth() - 6); // 默认半年
            groupByFormat = '%Y-%m';
        }
        
        // 构建查询条件
        const matchCondition = { 
            creatorId: mongoose.Types.ObjectId(creatorId),
            createdAt: { $gte: startDate, $lte: now }
        };
        
        if (source) {
            matchCondition.source = source;
        }
        
        // 执行聚合查询
        const incomeTrends = await CreatorIncome.aggregate([
            { $match: matchCondition },
            { $group: {
                _id: { $dateToString: { format: groupByFormat, date: '$createdAt' } },
                totalAmount: { $sum: '$totalAmount' },
                platformFee: { $sum: '$platformFee' },
                netAmount: { $sum: '$netAmount' }
            }},
            { $sort: { '_id': 1 } }
        ]);
        
        res.json({
            success: true,
            data: {
                period,
                source: source || 'all',
                trends: incomeTrends.map(item => ({
                    date: item._id,
                    totalAmount: item.totalAmount,
                    platformFee: item.platformFee,
                    netAmount: item.netAmount
                }))
            }
        });
    } catch (error) {
        console.error('获取收入趋势失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 请求提现
const requestWithdrawal = async (req, res) => {
    try {
        const { amount, method, account } = req.body;
        const creatorId = req.userId;
        
        // 验证提现信息
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: '无效请求',
                message: '提现金额必须大于0'
            });
        }
        
        if (!method || !account) {
            return res.status(400).json({
                success: false,
                error: '无效请求',
                message: '支付方式和账户信息不能为空'
            });
        }
        
        // 检查最低提现金额
        const RevenueSharing = require('../config/payment').RevenueSharing;
        const minWithdrawal = RevenueSharing.MINIMUM_WITHDRAWAL || 100;
        
        if (amount < minWithdrawal) {
            return res.status(400).json({
                success: false,
                error: '提现金额过低',
                message: `最低提现金额为 ${minWithdrawal}`
            });
        }
        
        // 获取可提现余额
        const withdrawableIncome = await CreatorIncome.aggregate([
            { 
                $match: { 
                    creatorId: mongoose.Types.ObjectId(creatorId),
                    withdrawStatus: 'withdrawable'
                } 
            },
            { $group: {
                _id: null,
                totalAmount: { $sum: '$netAmount' }
            }}
        ]);
        
        const availableBalance = withdrawableIncome.length > 0 ? withdrawableIncome[0].totalAmount : 0;
        
        if (amount > availableBalance) {
            return res.status(400).json({
                success: false,
                error: '余额不足',
                message: `可提现余额 ${availableBalance} 小于请求的金额 ${amount}`
            });
        }
        
        // 获取可提现的收入记录
        const withdrawableIncomes = await CreatorIncome.find({
            creatorId,
            withdrawStatus: 'withdrawable'
        }).sort('createdAt');
        
        // 处理提现申请
        let remainingAmount = amount;
        const processedIncomes = [];
        
        for (const income of withdrawableIncomes) {
            if (remainingAmount <= 0) break;
            
            if (income.netAmount <= remainingAmount) {
                // 全部提现
                income.withdrawStatus = 'processing';
                income.withdrawal = {
                    requestedAt: new Date(),
                    method,
                    account,
                    status: 'processing'
                };
                
                remainingAmount -= income.netAmount;
                processedIncomes.push(income);
                await income.save();
            } else {
                // 部分提现 - 实际实现可能需要更复杂的逻辑
                break;
            }
        }
        
        res.json({
            success: true,
            message: '提现申请已提交',
            data: {
                requestedAmount: amount,
                processedAmount: amount - remainingAmount,
                method,
                status: 'processing',
                requestDate: new Date()
            }
        });
    } catch (error) {
        console.error('申请提现失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 获取提现历史
const getWithdrawalHistory = async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const creatorId = req.userId;
        
        // 构建查询条件
        const query = { 
            creatorId,
            'withdrawal.requestedAt': { $exists: true }
        };
        
        if (status) {
            query.withdrawStatus = status;
        }
        
        // 执行查询
        const withdrawals = await CreatorIncome.find(query)
            .sort('-withdrawal.requestedAt')
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));
            
        const total = await CreatorIncome.countDocuments(query);
        
        // 分组处理提现记录
        const groupedWithdrawals = {};
        
        withdrawals.forEach(income => {
            const requestDate = income.withdrawal.requestedAt.toISOString().split('T')[0];
            
            if (!groupedWithdrawals[requestDate]) {
                groupedWithdrawals[requestDate] = {
                    date: requestDate,
                    method: income.withdrawal.method,
                    status: income.withdrawStatus,
                    items: [],
                    totalAmount: 0
                };
            }
            
            groupedWithdrawals[requestDate].items.push({
                _id: income._id,
                amount: income.netAmount,
                source: income.source,
                status: income.withdrawStatus,
                requestedAt: income.withdrawal.requestedAt,
                processedAt: income.withdrawal.processedAt
            });
            
            groupedWithdrawals[requestDate].totalAmount += income.netAmount;
        });
        
        res.json({
            success: true,
            data: {
                withdrawals: Object.values(groupedWithdrawals),
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('获取提现历史失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};
// 详细的收入分析
const getIncomeAnalytics = async (req, res) => {
    try {
        const creatorId = req.userId;
        
        // 获取内容收入排名
        const contentIncomeRanking = await CreatorIncome.aggregate([
            { 
                $match: { 
                    creatorId: mongoose.Types.ObjectId(creatorId),
                    contentId: { $exists: true, $ne: null }
                } 
            },
            { 
                $group: {
                    _id: '$contentId',
                    totalAmount: { $sum: '$totalAmount' },
                    netAmount: { $sum: '$netAmount' },
                    count: { $sum: 1 }
                } 
            },
            { $sort: { netAmount: -1 } },
            { $limit: 10 },
            { 
                $lookup: {
                    from: 'contents',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'contentDetails'
                } 
            },
            { $unwind: '$contentDetails' }
        ]);
        
        // 统计每月收入
        const monthlyIncome = await CreatorIncome.aggregate([
            { $match: { creatorId: mongoose.Types.ObjectId(creatorId) } },
            { 
                $group: {
                    _id: { 
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    totalAmount: { $sum: '$totalAmount' },
                    netAmount: { $sum: '$netAmount' },
                    count: { $sum: 1 }
                } 
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } }
        ]);
        
        // 收入来源分布
        const incomeSourceDistribution = await CreatorIncome.aggregate([
            { $match: { creatorId: mongoose.Types.ObjectId(creatorId) } },
            { 
                $group: {
                    _id: '$source',
                    totalAmount: { $sum: '$totalAmount' },
                    netAmount: { $sum: '$netAmount' },
                    count: { $sum: 1 }
                } 
            },
            { $sort: { netAmount: -1 } }
        ]);
        
        res.json({
            success: true,
            data: {
                topContents: contentIncomeRanking.map(item => ({
                    contentId: item._id,
                    title: item.contentDetails.title,
                    netAmount: item.netAmount,
                    transactions: item.count
                })),
                monthlyIncome: monthlyIncome.map(item => ({
                    year: item._id.year,
                    month: item._id.month,
                    netAmount: item.netAmount,
                    transactions: item.count
                })),
                sourceDistribution: incomeSourceDistribution.map(item => ({
                    source: item._id,
                    netAmount: item.netAmount,
                    percentage: 0 // 在前端计算百分比
                }))
            }
        });
    } catch (error) {
        console.error('获取收入分析失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};
// ===== 创作者设置功能 =====

// 获取创作者资料
const getCreatorProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: '未找到',
                message: '用户不存在'
            });
        }
        
        // 获取创作者统计数据
        const contentsCount = await Content.countDocuments({ creatorId: req.userId });
        const publishedContentsCount = await Content.countDocuments({ 
            creatorId: req.userId,
            status: 'published'
        });
        
        // 获取粉丝数（如果有关注系统）
        const followersCount = user.creatorInfo ? user.creatorInfo.totalFollowers : 0;
        
        // 获取总观看次数
        const contents = await Content.find({ creatorId: req.userId });
        const contentIds = contents.map(content => content._id);
        const totalViews = await ViewHistory.countDocuments({
            contentId: { $in: contentIds }
        });
        
        // 获取创作者总收入
        const incomeStats = await CreatorIncome.aggregate([
            { $match: { creatorId: mongoose.Types.ObjectId(req.userId) } },
            { $group: {
                _id: null,
                totalEarnings: { $sum: '$netAmount' }
            }}
        ]);
        
        res.json({
            success: true,
            data: {
                profile: {
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    displayName: user.profile.displayName,
                    bio: user.profile.bio,
                    preferredLanguage: user.preferredLanguage,
                    creatorInfo: user.creatorInfo
                },
                stats: {
                    contentsCount,
                    publishedContentsCount,
                    followersCount,
                    totalViews,
                    totalEarnings: incomeStats.length > 0 ? incomeStats[0].totalEarnings : 0
                }
            }
        });
    } catch (error) {
        console.error('获取创作者资料失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 更新创作者资料
const updateCreatorProfile = async (req, res) => {
    try {
        const { 
            displayName, 
            bio, 
            preferredLanguage 
        } = req.body;
        
        const user = await User.findById(req.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: '未找到',
                message: '用户不存在'
            });
        }
        
        // 更新显示名称（多语言）
        if (displayName) {
            Object.keys(displayName).forEach(lang => {
                if (user.profile.displayName[lang] !== undefined) {
                    user.profile.displayName[lang] = displayName[lang];
                }
            });
        }
        
        // 更新简介（多语言）
        if (bio) {
            Object.keys(bio).forEach(lang => {
                if (user.profile.bio[lang] !== undefined) {
                    user.profile.bio[lang] = bio[lang];
                }
            });
        }
        
        // 更新首选语言
        if (preferredLanguage) {
            user.preferredLanguage = preferredLanguage;
        }
        
        user.updatedAt = new Date();
        await user.save();
        
        res.json({
            success: true,
            message: '资料已更新',
            data: { 
                profile: {
                    displayName: user.profile.displayName,
                    bio: user.profile.bio,
                    preferredLanguage: user.preferredLanguage
                }
            }
        });
    } catch (error) {
        console.error('更新创作者资料失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 更新支付信息
const updatePaymentInfo = async (req, res) => {
    try {
        const { paymentMethod, accountInfo } = req.body;
        
        if (!paymentMethod || !accountInfo) {
            return res.status(400).json({
                success: false,
                error: '无效请求',
                message: '支付方式和账户信息不能为空'
            });
        }
        
        const user = await User.findById(req.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: '未找到',
                message: '用户不存在'
            });
        }
        
        // 确保creatorInfo存在
        if (!user.creatorInfo) {
            user.creatorInfo = {};
        }
        
        // 更新支付信息
        user.creatorInfo.paymentInfo = {
            method: paymentMethod,
            account: accountInfo,
            updatedAt: new Date()
        };
        
        await user.save();
        
        res.json({
            success: true,
            message: '支付信息已更新',
            data: {
                paymentInfo: {
                    method: paymentMethod,
                    updatedAt: user.creatorInfo.paymentInfo.updatedAt
                }
            }
        });
    } catch (error) {
        console.error('更新支付信息失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 更新通知设置
const updateNotificationSettings = async (req, res) => {
    try {
        const { settings } = req.body;
        
        if (!settings || typeof settings !== 'object') {
            return res.status(400).json({
                success: false,
                error: '无效请求',
                message: '通知设置不能为空'
            });
        }
        
        const user = await User.findById(req.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: '未找到',
                message: '用户不存在'
            });
        }
        
        // 确保notificationSettings存在
        if (!user.notificationSettings) {
            user.notificationSettings = {};
        }
        
        // 更新通知设置
        user.notificationSettings = {
            ...user.notificationSettings,
            ...settings
        };
        
        await user.save();
        
        res.json({
            success: true,
            message: '通知设置已更新',
            data: { 
                notificationSettings: user.notificationSettings
            }
        });
    } catch (error) {
        console.error('更新通知设置失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};
// 通知
const getNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 20, isRead } = req.query;
        
        // 构建查询条件
        const query = { userId: req.userId };
        if (isRead !== undefined) {
            query.isRead = isRead === 'true';
        }
        
        // 查询通知
        const notifications = await Notification.find(query)
            .sort('-createdAt')
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));
            
        const total = await Notification.countDocuments(query);
        
        // 未读通知计数
        const unreadCount = await Notification.countDocuments({ 
            userId: req.userId, 
            isRead: false 
        });
        
        res.json({
            success: true,
            data: {
                notifications,
                unreadCount,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('获取通知失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

const markNotificationsAsRead = async (req, res) => {
    try {
        const { notificationIds } = req.body;
        
        // 标记指定通知为已读
        if (notificationIds && notificationIds.length > 0) {
            await Notification.updateMany(
                { 
                    _id: { $in: notificationIds },
                    userId: req.userId 
                },
                { $set: { isRead: true } }
            );
        } else {
            // 标记所有通知为已读
            await Notification.updateMany(
                { userId: req.userId, isRead: false },
                { $set: { isRead: true } }
            );
        }
        
        res.json({
            success: true,
            message: '通知已标记为已读'
        });
    } catch (error) {
        console.error('标记通知为已读失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};
// 导出所有控制器函数
module.exports = {
    // 内容管理
    getCreatorContents,
    getContentDetails,
    createContent,
    updateContent,
    deleteContent,
    updateContentStatus,
    exportContentData,
    
    // 分析功能
    getAnalyticsOverview,
    getContentAnalytics,
    getAnalyticsTrends,
    getAudienceAnalytics,
    getIncomeAnalytics,
    
    // 评论管理
    getCreatorComments,
    getContentComments,
    replyToComment,
    pinComment,
    updateCommentStatus,
    
    // 收入管理
    getIncomeOverview,
    getIncomeDetails,
    getIncomeTrends,
    requestWithdrawal,
    getWithdrawalHistory,
    
    // 创作者设置
    getCreatorProfile,
    updateCreatorProfile,
    updatePaymentInfo,
    updateNotificationSettings,
    //通知管理
    getNotifications,
    markNotificationsAsRead,
        // 批量管理功能
    batchUpdateContentsStatus,
    batchAddTags,
    batchRemoveTags,
    batchUpdateCategory,
    batchDeleteContents
};