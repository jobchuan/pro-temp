// controllers/recommendationController.js
const RecommendationService = require('../services/recommendationService');
const FeaturedContent = require('../models/FeaturedContent');
const UserPreference = require('../models/UserPreference');
const Recommendation = require('../models/Recommendation');

// 获取首页推荐内容
const getHomeRecommendations = async (req, res) => {
    try {
        const userId = req.userId;
        const { language = 'zh-CN' } = req.query;
        
        // 获取编辑精选内容
        const featuredContents = await RecommendationService.getEditorialRecommendations({
            featureType: 'homepage',
            language
        });
        
        // 获取个性化推荐
        const personalizedContents = await RecommendationService.getUserRecommendations(userId, {
            limit: 10,
            includeTypes: ['personalized']
        });
        
        // 获取热门内容
        const trendingContents = await RecommendationService.getTrendingRecommendations();
        
        // 获取继续观看列表
        const ViewHistory = require('../models/ViewHistory');
        const continueWatching = await ViewHistory.getContinueWatching(userId, 5);
        
        res.json({
            success: true,
            data: {
                featured: featuredContents,
                personalized: personalizedContents,
                trending: trendingContents,
                continueWatching: continueWatching
            }
        });
    } catch (error) {
        console.error('获取首页推荐失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 获取内容详情页推荐
const getContentRecommendations = async (req, res) => {
    try {
        const { contentId } = req.params;
        const userId = req.userId;
        
        // 获取类似内容推荐
        const similarContents = await RecommendationService.getSimilarRecommendations(contentId, {
            limit: 12,
            userId
        });
        
        // 获取相同创作者的其他内容
        const Content = require('../models/Content');
        const content = await Content.findById(contentId);
        
        let creatorContents = [];
        if (content) {
            creatorContents = await Content.find({
                creatorId: content.creatorId,
                _id: { $ne: contentId },
                status: 'published'
            })
            .limit(6)
            .sort('-publishedAt');
        }
        
        res.json({
            success: true,
            data: {
                similar: similarContents,
                fromSameCreator: creatorContents
            }
        });
    } catch (error) {
        console.error('获取内容推荐失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 记录内容互动并更新推荐
const recordInteractionAndUpdateRecommendations = async (req, res) => {
    try {
        const { contentId, interactionType } = req.body;
        const userId = req.userId;
        
        // 记录互动
        let success = false;
        
        if (interactionType === 'view') {
            const ViewHistory = require('../models/ViewHistory');
            await ViewHistory.recordView(userId, contentId);
            success = true;
        } else if (['like', 'favorite'].includes(interactionType)) {
            const UserInteraction = require('../models/UserInteraction');
            const interaction = await UserInteraction.toggleInteraction(userId, contentId, interactionType);
            success = interaction.isActive;
        }
        
        // 查找是否有相关推荐
        const recommendation = await Recommendation.findOne({
            userId,
            contentId,
            status: { $in: ['active', 'clicked'] }
        });
        
        // 如果有，记录推荐转化
        if (recommendation) {
            await RecommendationService.recordRecommendationInteraction(
                recommendation._id,
                interactionType
            );
        }
        
        // 触发推荐更新 (异步)
        RecommendationService.updateUserRecommendations(userId).catch(err => 
            console.error('更新用户推荐失败:', err)
        );
        
        res.json({
            success: true,
            message: '互动已记录',
            data: { success }
        });
    } catch (error) {
        console.error('记录互动失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 获取分类内容推荐
const getCategoryRecommendations = async (req, res) => {
    try {
        const { category } = req.params;
        const userId = req.userId;
        const { language = 'zh-CN' } = req.query;
        
        // 获取分类的精选内容
        const featuredContents = await RecommendationService.getEditorialRecommendations({
            featureType: 'category',
            category,
            language
        });
        
        // 获取分类的个性化推荐
        const personalizedContents = await RecommendationService.getUserRecommendations(userId, {
            limit: 10,
            includeTypes: ['personalized'],
            contentType: null,
            category
        });
        
        // 获取分类的热门内容
        const trendingContents = await RecommendationService.getTrendingRecommendations({
            limit: 10,
            category
        });
        
        res.json({
            success: true,
            data: {
                featured: featuredContents,
                personalized: personalizedContents,
                trending: trendingContents
            }
        });
    } catch (error) {
        console.error('获取分类推荐失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 获取用户偏好设置
const getUserPreferences = async (req, res) => {
    try {
        const userId = req.userId;
        
        // 获取用户偏好
        let userPreference = await UserPreference.findOne({ userId });
        
        // 如果不存在，创建默认偏好
        if (!userPreference) {
            userPreference = new UserPreference({ userId });
            await userPreference.save();
        }
        
        res.json({
            success: true,
            data: userPreference
        });
    } catch (error) {
        console.error('获取用户偏好失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 更新用户偏好设置
const updateUserPreferences = async (req, res) => {
    try {
        const userId = req.userId;
        const { enablePersonalization, categoryPreferences, interactionWeights } = req.body;
        
        // 获取用户偏好
        let userPreference = await UserPreference.findOne({ userId });
        
        // 如果不存在，创建默认偏好
        if (!userPreference) {
            userPreference = new UserPreference({ userId });
        }
        
        // 更新设置
        if (enablePersonalization !== undefined) {
            userPreference.enablePersonalization = enablePersonalization;
        }
        
        if (categoryPreferences) {
            Object.keys(categoryPreferences).forEach(category => {
                if (userPreference.categoryPreferences[category] !== undefined) {
                    userPreference.categoryPreferences[category] = categoryPreferences[category];
                }
            });
        }
        
        if (interactionWeights) {
            Object.keys(interactionWeights).forEach(interaction => {
                if (userPreference.interactionWeights[interaction] !== undefined) {
                    userPreference.interactionWeights[interaction] = interactionWeights[interaction];
                }
            });
        }
        
        userPreference.lastUpdated = new Date();
        await userPreference.save();
        
        // 触发推荐更新
        RecommendationService.updateUserRecommendations(userId).catch(err => 
            console.error('更新用户推荐失败:', err)
        );
        
        res.json({
            success: true,
            message: '偏好设置已更新',
            data: userPreference
        });
    } catch (error) {
        console.error('更新用户偏好失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 管理员控制器

// 创建精选内容
const createFeaturedContent = async (req, res) => {
    try {
        const {
            contentId,
            featureType,
            category,
            headline,
            description,
            priority,
            startDate,
            endDate,
            targetUserGroups,
            customThumbnail
        } = req.body;
        
        // 验证内容是否存在
        const Content = require('../models/Content');
        const content = await Content.findById(contentId);
        
        if (!content) {
            return res.status(404).json({
                success: false,
                error: '未找到',
                message: '内容不存在'
            });
        }
        
        // 创建精选内容记录
        const featuredContent = new FeaturedContent({
            contentId,
            featureType,
            category,
            headline,
            description,
            priority: priority || 0,
            addedBy: req.userId,
            startDate: startDate ? new Date(startDate) : new Date(),
            endDate: endDate ? new Date(endDate) : null,
            targetUserGroups: targetUserGroups || ['all'],
            customThumbnail
        });
        
        await featuredContent.save();
        
        res.status(201).json({
            success: true,
            message: '精选内容创建成功',
            data: featuredContent
        });
    } catch (error) {
        console.error('创建精选内容失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 获取所有精选内容
const getFeaturedContents = async (req, res) => {
    try {
        const { featureType, status = 'active', page = 1, limit = 20 } = req.query;
        
        // 构建查询条件
        const query = {};
        if (featureType) query.featureType = featureType;
        if (status) query.status = status;
        
        // 执行查询
        const featuredContents = await FeaturedContent.find(query)
            .populate('contentId', 'title thumbnailURL status')
            .populate('addedBy', 'username')
            .sort('-createdAt')
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));
            
        const total = await FeaturedContent.countDocuments(query);
        
        res.json({
            success: true,
            data: {
                featuredContents,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('获取精选内容失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 更新精选内容
const updateFeaturedContent = async (req, res) => {
    try {
        const { featuredId } = req.params;
        const updates = req.body;
        
        // 获取精选内容
        const featuredContent = await FeaturedContent.findById(featuredId);
        
        if (!featuredContent) {
            return res.status(404).json({
                success: false,
                error: '未找到',
                message: '精选内容不存在'
            });
        }
        
        // 应用更新
        const allowedUpdates = [
            'featureType', 'category', 'headline', 'description',
            'priority', 'status', 'startDate', 'endDate',
            'targetUserGroups', 'customThumbnail'
        ];
        
        allowedUpdates.forEach(field => {
            if (updates[field] !== undefined) {
                if (field === 'startDate' || field === 'endDate') {
                    featuredContent[field] = updates[field] ? new Date(updates[field]) : null;
                } else {
                    featuredContent[field] = updates[field];
                }
            }
        });
        
        await featuredContent.save();
        
        res.json({
            success: true,
            message: '精选内容已更新',
            data: featuredContent
        });
    } catch (error) {
        console.error('更新精选内容失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 删除精选内容
const deleteFeaturedContent = async (req, res) => {
    try {
        const { featuredId } = req.params;
        
        // 查找并删除精选内容
        const featuredContent = await FeaturedContent.findByIdAndDelete(featuredId);
        
        if (!featuredContent) {
            return res.status(404).json({
                success: false,
                error: '未找到',
                message: '精选内容不存在'
            });
        }
        
        res.json({
            success: true,
            message: '精选内容已删除',
            data: { featuredId }
        });
    } catch (error) {
        console.error('删除精选内容失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

module.exports = {
    getHomeRecommendations,
    getContentRecommendations,
    recordInteractionAndUpdateRecommendations,
    getCategoryRecommendations,
    getUserPreferences,
    updateUserPreferences,
    
    // 管理员功能
    createFeaturedContent,
    getFeaturedContents,
    updateFeaturedContent,
    deleteFeaturedContent
};