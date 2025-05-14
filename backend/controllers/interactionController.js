// controllers/interactionController.js
const UserInteraction = require('../models/UserInteraction');
const Comment = require('../models/Comment');
const ViewHistory = require('../models/ViewHistory');
const OfflineContent = require('../models/OfflineContent');
const Danmaku = require('../models/Danmaku');
const Content = require('../models/Content');

// 点赞/取消点赞
const toggleLike = async (req, res) => {
    try {
        const { contentId } = req.params;
        const userId = req.userId;
        
        const interaction = await UserInteraction.toggleInteraction(userId, contentId, 'like');
        
        res.json({
            success: true,
            data: {
                liked: interaction.isActive,
                contentId
            }
        });
    } catch (error) {
        console.error('点赞操作失败:', error);
        res.status(500).json({
            success: false,
            error: '操作失败',
            message: error.message
        });
    }
};

// 收藏/取消收藏
const toggleFavorite = async (req, res) => {
    try {
        const { contentId } = req.params;
        const userId = req.userId;
        
        const interaction = await UserInteraction.toggleInteraction(userId, contentId, 'favorite');
        
        res.json({
            success: true,
            data: {
                favorited: interaction.isActive,
                contentId
            }
        });
    } catch (error) {
        console.error('收藏操作失败:', error);
        res.status(500).json({
            success: false,
            error: '操作失败',
            message: error.message
        });
    }
};

// 获取用户的交互状态
const getInteractionStatus = async (req, res) => {
    try {
        const { contentId } = req.params;
        const userId = req.userId;
        
        const status = await UserInteraction.getUserInteractions(userId, contentId);
        
        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        console.error('获取交互状态失败:', error);
        res.status(500).json({
            success: false,
            error: '操作失败',
            message: error.message
        });
    }
};

// 添加评论
const addComment = async (req, res) => {
    try {
        const { contentId } = req.params;
        const { text, parentId, spatialAnchor } = req.body;
        const userId = req.userId;
        
        console.log(`添加评论: 用户ID=${userId}, 内容ID=${contentId}, 评论内容=${text}`);
        
        // 创建评论对象
        const comment = new Comment({
            contentId,
            userId,
            text,
            parentId,
            spatialAnchor
        });
        
        // 保存评论
        await comment.save();
        
        // 更新内容的评论统计
        await Content.findByIdAndUpdate(contentId, {
            $inc: { 'stats.comments': 1 }
        });
        
        // 填充用户信息
        await comment.populate('userId', 'username profile.displayName avatarURL');
        
        console.log(`评论添加成功: ID=${comment._id}`);
        
        res.status(201).json({
            success: true,
            data: comment
        });
    } catch (error) {
        console.error('添加评论失败:', error);
        res.status(500).json({
            success: false,
            error: '操作失败',
            message: error.message
        });
    }
};

// 获取评论列表
const getComments = async (req, res) => {
    try {
        const { contentId } = req.params;
        const { page = 1, limit = 20, sort = '-createdAt' } = req.query;
        
        console.log(`获取评论: 内容ID=${contentId}, 页码=${page}, 每页数量=${limit}`);
        
        // 查询评论
        const comments = await Comment.find({
            contentId,
            level: 0, // 只获取顶层评论
            status: { $ne: 'deleted' }
        })
        .sort(sort)
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .populate('userId', 'username profile.displayName avatarURL')
        .populate({
            path: 'replies',
            match: { status: { $ne: 'deleted' } },
            populate: {
                path: 'userId',
                select: 'username profile.displayName avatarURL'
            }
        })
        .lean();
        
        // 获取总数
        const total = await Comment.countDocuments({
            contentId,
            level: 0,
            status: { $ne: 'deleted' }
        });
        
        console.log(`找到 ${comments.length} 条评论, 总计 ${total} 条`);
        
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
        console.error('获取评论失败:', error);
        res.status(500).json({
            success: false,
            error: '操作失败',
            message: error.message
        });
    }
};

// 删除评论
const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.userId;
        
        const comment = await Comment.findById(commentId);
        
        if (!comment) {
            return res.status(404).json({
                success: false,
                error: '评论不存在'
            });
        }
        
        // 只有评论作者可以删除
        if (comment.userId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                error: '无权删除此评论'
            });
        }
        
        // 软删除评论
        comment.status = 'deleted';
        comment.text = '[评论已删除]';
        await comment.save();
        
        // 更新内容的评论统计
        await Content.findByIdAndUpdate(comment.contentId, {
            $inc: { 'stats.comments': -1 }
        });
        
        res.json({
            success: true,
            message: '评论已删除'
        });
    } catch (error) {
        console.error('删除评论失败:', error);
        res.status(500).json({
            success: false,
            error: '操作失败',
            message: error.message
        });
    }
};

// 记录观看历史
const recordViewHistory = async (req, res) => {
    try {
        const { contentId } = req.params;
        const { progress, duration } = req.body;
        const userId = req.userId;
        
        console.log(`记录观看历史: 用户ID=${userId}, 内容ID=${contentId}, 进度=${progress}/${duration}`);
        
        // 查找或创建历史记录
        let history = await ViewHistory.findOne({ userId, contentId });
        
        if (!history) {
            // 创建新记录
            history = new ViewHistory({
                userId,
                contentId,
                progress,
                duration,
                progressPercentage: duration > 0 ? (progress / duration) * 100 : 0,
                isCompleted: duration > 0 && progress / duration >= 0.95
            });
            
            // 更新内容的观看统计
            await Content.findByIdAndUpdate(contentId, {
                $inc: { 'stats.views': 1 }
            });
        } else {
            // 更新现有记录
            history.progress = progress;
            history.duration = duration;
            history.progressPercentage = duration > 0 ? (progress / duration) * 100 : 0;
            history.isCompleted = duration > 0 && progress / duration >= 0.95;
            history.viewCount += 1;
            history.lastViewedAt = new Date();
        }
        
        await history.save();
        
        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        console.error('记录观看历史失败:', error);
        res.status(500).json({
            success: false,
            error: '操作失败',
            message: error.message
        });
    }
};

// 获取观看历史
const getViewHistory = async (req, res) => {
    try {
        const userId = req.userId;
        const { page = 1, limit = 20 } = req.query;
        
        // 分页查询观看历史
        const history = await ViewHistory.find({ userId })
            .sort({ lastViewedAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .populate('contentId', 'title contentType files.thumbnail thumbnailURL stats')
            .lean();
        
        // 获取总数
        const total = await ViewHistory.countDocuments({ userId });
        
        res.json({
            success: true,
            data: {
                history,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('获取观看历史失败:', error);
        res.status(500).json({
            success: false,
            error: '操作失败',
            message: error.message
        });
    }
};

// 获取继续观看列表
const getContinueWatching = async (req, res) => {
    try {
        const userId = req.userId;
        const { limit = 10 } = req.query;
        
        // 查询进度在5-95%之间的未完成观看记录
        const history = await ViewHistory.find({
            userId,
            isCompleted: false,
            progressPercentage: { $gt: 5, $lt: 95 }
        })
        .sort({ lastViewedAt: -1 })
        .limit(parseInt(limit))
        .populate('contentId', 'title contentType files.thumbnail thumbnailURL')
        .lean();
        
        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        console.error('获取继续观看列表失败:', error);
        res.status(500).json({
            success: false,
            error: '操作失败',
            message: error.message
        });
    }
};

// 创建离线下载任务
const createOfflineDownload = async (req, res) => {
    try {
        const { contentId } = req.params;
        const { quality = 'high' } = req.body;
        const userId = req.userId;
        
        // 检查是否已有下载任务
        const existing = await OfflineContent.findOne({ userId, contentId });
        if (existing && existing.status !== 'failed') {
            return res.status(400).json({
                success: false,
                error: '已存在下载任务'
            });
        }
        
        // 获取内容信息
        const content = await Content.findById(contentId);
        if (!content) {
            return res.status(404).json({
                success: false,
                error: '内容不存在'
            });
        }
        
        // 创建下载任务
        const offlineContent = new OfflineContent({
            userId,
            contentId,
            quality,
            status: 'pending',
            files: {
                main: {
                    url: content.files.main.url,
                    size: content.files.main.size || 0
                },
                thumbnail: content.files.thumbnail,
                audio: content.media?.backgroundMusic
            },
            totalSize: content.files.main.size || 0,
            metadata: {
                title: content.title,
                description: content.description,
                duration: content.files.main.duration,
                contentType: content.contentType,
                thumbnailURL: content.thumbnailURL || content.files.thumbnail?.url
            }
        });
        
        await offlineContent.save();
        
        // TODO: 实际触发下载任务的代码
        // 由于这是一个示例，我们直接将状态改为下载中
        offlineContent.status = 'downloading';
        offlineContent.startedAt = new Date();
        await offlineContent.save();
        
        res.status(201).json({
            success: true,
            data: offlineContent
        });
    } catch (error) {
        console.error('创建离线下载失败:', error);
        res.status(500).json({
            success: false,
            error: '操作失败',
            message: error.message
        });
    }
};

// 获取离线内容列表
const getOfflineContent = async (req, res) => {
    try {
        const userId = req.userId;
        const { page = 1, limit = 20, status } = req.query;
        
        // 构建查询条件
        const query = { userId };
        if (status) {
            query.status = status;
        }
        
        // 分页查询
        const content = await OfflineContent.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .populate('contentId', 'title contentType files.thumbnail thumbnailURL')
            .lean();
        
        // 获取总数
        const total = await OfflineContent.countDocuments(query);
        
        res.json({
            success: true,
            data: {
                content,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('获取离线内容失败:', error);
        res.status(500).json({
            success: false,
            error: '操作失败',
            message: error.message
        });
    }
};

// 发送弹幕
const sendDanmaku = async (req, res) => {
    try {
        const { contentId } = req.params;
        const { text, timestamp, type = 'scroll', style, spatialPosition } = req.body;
        const userId = req.userId;
        
        // 创建弹幕
        const danmaku = new Danmaku({
            contentId,
            userId,
            text,
            timestamp,
            type,
            style,
            spatialPosition,
            speed: 1,
            status: 'active'
        });
        
        await danmaku.save();
        
        // 更新内容的弹幕统计
        await Content.findByIdAndUpdate(contentId, {
            $inc: { 'stats.danmakus': 1 }
        });
        
        res.status(201).json({
            success: true,
            data: danmaku
        });
    } catch (error) {
        console.error('发送弹幕失败:', error);
        res.status(500).json({
            success: false,
            error: '操作失败',
            message: error.message
        });
    }
};

// 获取弹幕列表
const getDanmakuList = async (req, res) => {
    try {
        const { contentId } = req.params;
        const { startTime = 0, endTime, limit = 1000 } = req.query;
        
        // 构建查询条件
        const query = {
            contentId,
            status: 'active'
        };
        
        // 添加时间范围
        query.timestamp = { $gte: parseFloat(startTime) };
        if (endTime) {
            query.timestamp.$lte = parseFloat(endTime);
        }
        
        // 查询弹幕
        const danmakus = await Danmaku.find(query)
            .sort('timestamp')
            .limit(parseInt(limit))
            .populate('userId', 'username')
            .lean();
        
        res.json({
            success: true,
            data: danmakus
        });
    } catch (error) {
        console.error('获取弹幕失败:', error);
        res.status(500).json({
            success: false,
            error: '操作失败',
            message: error.message
        });
    }
};

// 获取弹幕密度分布
const getDanmakuDensity = async (req, res) => {
    try {
        const { contentId } = req.params;
        const { interval = 10 } = req.query;
        
        // 使用聚合管道计算密度
        const result = await Danmaku.aggregate([
            { $match: { 
                contentId: mongoose.Types.ObjectId(contentId), 
                status: 'active' 
            } },
            { $group: {
                _id: { $floor: { $divide: ['$timestamp', parseInt(interval)] } },
                count: { $sum: 1 },
                timestamp: { $first: { $multiply: [{ $floor: { $divide: ['$timestamp', parseInt(interval)] } }, parseInt(interval)] } }
            } },
            { $sort: { timestamp: 1 } }
        ]);
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('获取弹幕密度失败:', error);
        res.status(500).json({
            success: false,
            error: '操作失败',
            message: error.message
        });
    }
};

module.exports = {
    toggleLike,
    toggleFavorite,
    getInteractionStatus,
    addComment,
    getComments,
    deleteComment,
    recordViewHistory,
    getViewHistory,
    getContinueWatching,
    createOfflineDownload,
    getOfflineContent,
    sendDanmaku,
    getDanmakuList,
    getDanmakuDensity
};