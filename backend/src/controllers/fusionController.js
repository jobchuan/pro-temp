// controllers/fusionController.js
const Fusion = require('../models/Fusion');
const Content = require('../models/Content');
const User = require('../models/User');
const ViewHistory = require('../models/ViewHistory');
const UserInteraction = require('../models/UserInteraction');
const mongoose = require('mongoose');

// 获取所有融合内容列表
const getFusionContents = async (req, res) => {
    try {
        const { page = 1, limit = 20, sort = '-createdAt', category, status } = req.query;
        
        // 构建查询条件
        const query = { creatorId: req.userId };
        if (category) query.category = category;
        if (status) query.status = status;
        
        // 执行查询
        const fusions = await Fusion.find(query)
            .populate('creatorId', 'username profile.displayName')
            .populate('contents.contentId', 'title thumbnailURL')
            .sort(sort)
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));
            
        const total = await Fusion.countDocuments(query);
        
        res.json({
            success: true,
            data: {
                fusions,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('获取融合内容列表失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 创建新的融合内容
const createFusionContent = async (req, res) => {
    try {
        const { title, description, category, contentIds = [], coverImage, settings = {} } = req.body;
        
        if (!title) {
            return res.status(400).json({
                success: false,
                error: '验证错误',
                message: '标题不能为空'
            });
        }
        
        // 验证内容ID是否有效且属于当前创作者
        if (contentIds.length > 0) {
            const contents = await Content.find({
                _id: { $in: contentIds },
                creatorId: req.userId
            });
            
            if (contents.length !== contentIds.length) {
                return res.status(400).json({
                    success: false,
                    error: '验证错误',
                    message: '部分内容ID无效或不属于您'
                });
            }
        }
        
        // 创建融合内容对象
        const fusion = new Fusion({
            title,
            description,
            category: category || 'other',
            creatorId: req.userId,
            coverImage,
            contents: contentIds.map((contentId, index) => ({
                contentId,
                order: index,
                settings: {} // 默认设置
            })),
            settings,
            status: 'draft'
        });
        
        await fusion.save();
        
        // 填充内容信息
        await fusion.populate('contents.contentId', 'title thumbnailURL');
        
        res.status(201).json({
            success: true,
            message: '融合内容创建成功',
            data: fusion
        });
    } catch (error) {
        console.error('创建融合内容失败:', error);
        res.status(400).json({
            success: false,
            error: '验证错误',
            message: error.message
        });
    }
};

// 获取单个融合内容详情
const getFusionContent = async (req, res) => {
    try {
        const { fusionId } = req.params;
        
        const fusion = await Fusion.findOne({
            _id: fusionId,
            creatorId: req.userId
        })
        .populate('creatorId', 'username profile.displayName')
        .populate('contents.contentId', 'title description thumbnailURL files');
        
        if (!fusion) {
            return res.status(404).json({
                success: false,
                error: '未找到',
                message: '融合内容不存在或您无权访问'
            });
        }
        
        // 获取观看统计
        const totalViews = await ViewHistory.countDocuments({
            fusionId: fusion._id
        });
        
        // 获取互动统计
        const likes = await UserInteraction.countDocuments({
            fusionId: fusion._id,
            type: 'like',
            isActive: true
        });
        
        const favorites = await UserInteraction.countDocuments({
            fusionId: fusion._id,
            type: 'favorite',
            isActive: true
        });
        
        res.json({
            success: true,
            data: {
                fusion,
                stats: {
                    views: totalViews,
                    likes,
                    favorites,
                    contentsCount: fusion.contents.length
                }
            }
        });
    } catch (error) {
        console.error('获取融合内容详情失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 更新融合内容
const updateFusionContent = async (req, res) => {
    try {
        const { fusionId } = req.params;
        const { title, description, category, coverImage, settings, status } = req.body;
        
        const fusion = await Fusion.findOne({
            _id: fusionId,
            creatorId: req.userId
        });
        
        if (!fusion) {
            return res.status(404).json({
                success: false,
                error: '未找到',
                message: '融合内容不存在或您无权编辑'
            });
        }
        
        // 更新基本信息
        if (title) fusion.title = title;
        if (description) fusion.description = description;
        if (category) fusion.category = category;
        if (coverImage) fusion.coverImage = coverImage;
        if (settings) fusion.settings = { ...fusion.settings, ...settings };
        if (status && ['draft', 'published', 'archived'].includes(status)) {
            fusion.status = status;
            if (status === 'published' && !fusion.publishedAt) {
                fusion.publishedAt = new Date();
            }
        }
        
        fusion.updatedAt = new Date();
        await fusion.save();
        
        res.json({
            success: true,
            message: '融合内容已更新',
            data: fusion
        });
    } catch (error) {
        console.error('更新融合内容失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 删除融合内容
const deleteFusionContent = async (req, res) => {
    try {
        const { fusionId } = req.params;
        
        const fusion = await Fusion.findOne({
            _id: fusionId,
            creatorId: req.userId
        });
        
        if (!fusion) {
            return res.status(404).json({
                success: false,
                error: '未找到',
                message: '融合内容不存在或您无权删除'
            });
        }
        
        // 软删除，将状态更改为已归档
        fusion.status = 'archived';
        fusion.updatedAt = new Date();
        await fusion.save();
        
        res.json({
            success: true,
            message: '融合内容已删除',
            data: { fusionId }
        });
    } catch (error) {
        console.error('删除融合内容失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 向融合内容添加新内容
const addContentToFusion = async (req, res) => {
    try {
        const { fusionId } = req.params;
        const { contentId, order, settings = {} } = req.body;
        
        if (!contentId) {
            return res.status(400).json({
                success: false,
                error: '验证错误',
                message: '内容ID不能为空'
            });
        }
        
        // 验证内容是否存在并属于当前创作者
        const content = await Content.findOne({
            _id: contentId,
            creatorId: req.userId
        });
        
        if (!content) {
            return res.status(404).json({
                success: false,
                error: '未找到',
                message: '内容不存在或不属于您'
            });
        }
        
        // 验证融合内容是否存在
        const fusion = await Fusion.findOne({
            _id: fusionId,
            creatorId: req.userId
        });
        
        if (!fusion) {
            return res.status(404).json({
                success: false,
                error: '未找到',
                message: '融合内容不存在或您无权编辑'
            });
        }
        
        // 检查内容是否已存在
        const contentExists = fusion.contents.some(item => 
            item.contentId.toString() === contentId
        );
        
        if (contentExists) {
            return res.status(400).json({
                success: false,
                error: '验证错误',
                message: '内容已存在于融合内容中'
            });
        }
        
        // 确定顺序
        const newOrder = order !== undefined ? order : fusion.contents.length;
        
        // 添加内容
        fusion.contents.push({
            contentId,
            order: newOrder,
            settings
        });
        
        // 重新排序内容（如果需要）
        if (order !== undefined) {
            fusion.contents.sort((a, b) => a.order - b.order);
        }
        
        fusion.updatedAt = new Date();
        await fusion.save();
        
        // 填充内容信息
        await fusion.populate('contents.contentId', 'title thumbnailURL');
        
        res.status(201).json({
            success: true,
            message: '内容已添加到融合内容',
            data: {
                fusion,
                addedContent: {
                    contentId,
                    order: newOrder
                }
            }
        });
    } catch (error) {
        console.error('添加内容到融合内容失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 从融合内容中移除内容
const removeContentFromFusion = async (req, res) => {
    try {
        const { fusionId, contentId } = req.params;
        
        // 验证融合内容是否存在
        const fusion = await Fusion.findOne({
            _id: fusionId,
            creatorId: req.userId
        });
        
        if (!fusion) {
            return res.status(404).json({
                success: false,
                error: '未找到',
                message: '融合内容不存在或您无权编辑'
            });
        }
        
        // 检查内容是否存在于融合内容中
        const contentIndex = fusion.contents.findIndex(item => 
            item.contentId.toString() === contentId
        );
        
        if (contentIndex === -1) {
            return res.status(404).json({
                success: false,
                error: '未找到',
                message: '内容不存在于融合内容中'
            });
        }
        
        // 移除内容
        fusion.contents.splice(contentIndex, 1);
        
        // 更新顺序
        fusion.contents.forEach((item, index) => {
            item.order = index;
        });
        
        fusion.updatedAt = new Date();
        await fusion.save();
        
        res.json({
            success: true,
            message: '内容已从融合内容中移除',
            data: {
                fusionId,
                removedContentId: contentId,
                remainingContentsCount: fusion.contents.length
            }
        });
    } catch (error) {
        console.error('从融合内容中移除内容失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 更新融合内容中的内容设置
const updateContentSettings = async (req, res) => {
    try {
        const { fusionId, contentId } = req.params;
        const { settings, order } = req.body;
        
        // 验证融合内容是否存在
        const fusion = await Fusion.findOne({
            _id: fusionId,
            creatorId: req.userId
        });
        
        if (!fusion) {
            return res.status(404).json({
                success: false,
                error: '未找到',
                message: '融合内容不存在或您无权编辑'
            });
        }
        
        // 查找内容
        const contentIndex = fusion.contents.findIndex(item => 
            item.contentId.toString() === contentId
        );
        
        if (contentIndex === -1) {
            return res.status(404).json({
                success: false,
                error: '未找到',
                message: '内容不存在于融合内容中'
            });
        }
        
        // 更新设置
        if (settings) {
            fusion.contents[contentIndex].settings = {
                ...fusion.contents[contentIndex].settings,
                ...settings
            };
        }
        
        // 更新顺序
        if (order !== undefined) {
            fusion.contents[contentIndex].order = order;
            // 重新排序
            fusion.contents.sort((a, b) => a.order - b.order);
        }
        
        fusion.updatedAt = new Date();
        await fusion.save();
        
        res.json({
            success: true,
            message: '内容设置已更新',
            data: {
                fusionId,
                contentId,
                settings: fusion.contents[contentIndex].settings,
                order: fusion.contents[contentIndex].order
            }
        });
    } catch (error) {
        console.error('更新内容设置失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};
// 批量重新排序内容
const reorderFusionContents = async (req, res) => {
    try {
        const { fusionId } = req.params;
        const { contentOrders } = req.body;
        
        if (!contentOrders || !Array.isArray(contentOrders)) {
            return res.status(400).json({
                success: false,
                error: '验证错误',
                message: '内容顺序不能为空'
            });
        }
        
        // 验证融合内容是否存在
        const fusion = await Fusion.findOne({
            _id: fusionId,
            creatorId: req.userId
        });
        
        if (!fusion) {
            return res.status(404).json({
                success: false,
                error: '未找到',
                message: '融合内容不存在或您无权编辑'
            });
        }
        
        // 更新每个内容的顺序
        for (const { contentId, order } of contentOrders) {
            const contentIndex = fusion.contents.findIndex(item => 
                item.contentId.toString() === contentId
            );
            
            if (contentIndex !== -1) {
                fusion.contents[contentIndex].order = order;
            }
        }
        
        // 重新排序
        fusion.contents.sort((a, b) => a.order - b.order);
        
        fusion.updatedAt = new Date();
        await fusion.save();
        
        res.json({
            success: true,
            message: '内容顺序已更新',
            data: {
                fusionId,
                contents: fusion.contents.map(item => ({
                    contentId: item.contentId,
                    order: item.order
                }))
            }
        });
    } catch (error) {
        console.error('重新排序内容失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};
// 获取融合内容分析数据
const getFusionAnalytics = async (req, res) => {
    try {
        const { fusionId } = req.params;
        const { period = '7days' } = req.query;
        
        // 验证融合内容是否存在
        const fusion = await Fusion.findOne({
            _id: fusionId,
            creatorId: req.userId
        }).populate('contents.contentId', 'title');
        
        if (!fusion) {
            return res.status(404).json({
                success: false,
                error: '未找到',
                message: '融合内容不存在或您无权访问'
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
                fusionId,
                createdAt: { $gte: dayStart, $lt: dayEnd }
            });
            
            viewsData.push({
                date: dayStart.toISOString().split('T')[0],
                count: viewsCount
            });
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // 获取每个内容的观看数据
        const contentViewsData = await Promise.all(
            fusion.contents.map(async (content) => {
                const viewsCount = await ViewHistory.countDocuments({
                    fusionId,
                    contentId: content.contentId._id
                });
                
                return {
                    contentId: content.contentId._id,
                    title: content.contentId.title,
                    views: viewsCount
                };
            })
        );
        
        // 获取互动数据
        const interactions = {
            likes: await UserInteraction.countDocuments({ 
                fusionId, 
                type: 'like',
                isActive: true
            }),
            favorites: await UserInteraction.countDocuments({ 
                fusionId, 
                type: 'favorite',
                isActive: true
            }),
            shares: fusion.stats?.shares || 0
        };
        
        res.json({
            success: true,
            data: {
                fusion: {
                    _id: fusion._id,
                    title: fusion.title,
                    status: fusion.status,
                    createdAt: fusion.createdAt,
                    publishedAt: fusion.publishedAt,
                    contentsCount: fusion.contents.length
                },
                period,
                stats: {
                    totalViews: fusion.stats?.views || 0,
                    ...interactions
                },
                viewsTrend: viewsData,
                contentPerformance: contentViewsData
            }
        });
    } catch (error) {
        console.error('获取融合内容分析数据失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

module.exports = {
    getFusionContents,
    createFusionContent,
    getFusionContent,
    updateFusionContent,
    deleteFusionContent,
    addContentToFusion,
    removeContentFromFusion,
    updateContentSettings,
    reorderFusionContents,
    getFusionAnalytics
};