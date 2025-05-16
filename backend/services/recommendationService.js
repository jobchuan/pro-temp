// services/recommendationService.js
const Recommendation = require('../models/Recommendation');
const UserPreference = require('../models/UserPreference');
const FeaturedContent = require('../models/FeaturedContent');
const Content = require('../models/Content');
const ViewHistory = require('../models/ViewHistory');
const UserInteraction = require('../models/UserInteraction');
const mongoose = require('mongoose');

class RecommendationService {
    // 获取用户推荐列表
    static async getUserRecommendations(userId, options = {}) {
        const {
            limit = 20,
            offset = 0,
            includeTypes = ['editorial', 'personalized', 'trending', 'similar'],
            excludeViewed = true,
            contentType,
            category
        } = options;
        
        // 构建查询条件
        const query = {
            userId: mongoose.Types.ObjectId(userId),
            status: 'active',
            type: { $in: includeTypes }
        };
        
        // 如果需要排除已观看的内容
        if (excludeViewed) {
            // 获取用户已观看的内容
            const viewedContents = await ViewHistory.distinct('contentId', { userId });
            if (viewedContents.length > 0) {
                query.contentId = { $nin: viewedContents };
            }
        }
        
        // 内容类型过滤
        if (contentType) {
            // 需要连接查询
            // 这里使用聚合管道来实现
            const pipeline = [
                { $match: query },
                { $lookup: {
                    from: 'contents',
                    localField: 'contentId',
                    foreignField: '_id',
                    as: 'contentData'
                }},
                { $match: { 'contentData.contentType': contentType }},
                { $sort: { score: -1 }},
                { $skip: offset },
                { $limit: limit }
            ];
            
            return await Recommendation.aggregate(pipeline);
        }
        
        // 普通查询
        const recommendations = await Recommendation.find(query)
            .sort({ score: -1 })
            .skip(offset)
            .limit(limit)
            .populate('contentId', 'title description contentType thumbnailURL stats');
        
        return recommendations;
    }
    
    // 获取编辑推荐内容
    static async getEditorialRecommendations(options = {}) {
        const {
            limit = 10,
            featureType = 'homepage',
            category,
            targetUserGroup = 'all',
            language = 'zh-CN'
        } = options;
        
        // 构建查询条件
        const query = {
            featureType,
            status: 'active',
            startDate: { $lte: new Date() },
            $or: [
                { endDate: { $exists: false } },
                { endDate: { $gte: new Date() } }
            ]
        };
        
        // 分类过滤
        if (category) {
            query.$or = [
                { category },
                { category: { $exists: false } }
            ];
        }
        
        // 目标用户群体
        if (targetUserGroup !== 'all') {
            query.targetUserGroups = { $in: [targetUserGroup, 'all'] };
        }
        
        const featuredContents = await FeaturedContent.find(query)
            .sort({ priority: -1 })
            .limit(limit)
            .populate({
                path: 'contentId',
                select: 'title description contentType thumbnailURL stats',
                // 选择对应语言的标题和描述
                transform: doc => {
                    if (doc) {
                        return {
                            ...doc.toObject(),
                            title: doc.title[language] || doc.title['zh-CN'],
                            description: doc.description[language] || doc.description['zh-CN']
                        };
                    }
                    return doc;
                }
            });
        
        return featuredContents;
    }
    
    // 获取热门内容推荐
    static async getTrendingRecommendations(options = {}) {
        const {
            limit = 10,
            timeFrame = 'week', // day, week, month
            contentType,
            category
        } = options;
        
        // 确定时间范围
        const now = new Date();
        let startDate;
        
        if (timeFrame === 'day') {
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 1);
        } else if (timeFrame === 'week') {
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
        } else if (timeFrame === 'month') {
            startDate = new Date(now);
            startDate.setMonth(now.getMonth() - 1);
        }
        
        // 构建查询条件
        const query = {
            status: 'published',
            publishedAt: { $gte: startDate }
        };
        
        if (contentType) {
            query.contentType = contentType;
        }
        
        if (category) {
            query.category = category;
        }
        
        // 获取内容并按热度排序
        // 热度计算: views + (likes * 2) + (favorites * 3) + (comments * 2)
        const pipeline = [
            { $match: query },
            { $addFields: {
                hotScore: {
                    $add: [
                        "$stats.views",
                        { $multiply: ["$stats.likes", 2] },
                        { $multiply: ["$stats.favorites", 3] },
                        { $multiply: ["$stats.comments", 2] }
                    ]
                }
            }},
            { $sort: { hotScore: -1 }},
            { $limit: limit }
        ];
        
        const trendingContents = await Content.aggregate(pipeline);
        
        return trendingContents;
    }
    
    // 获取类似内容推荐（基于当前内容）
    static async getSimilarRecommendations(contentId, options = {}) {
        const {
            limit = 10,
            userId
        } = options;
        
        // 获取当前内容的信息
        const content = await Content.findById(contentId);
        
        if (!content) {
            throw new Error('内容不存在');
        }
        
        // 构建查询条件 - 基于相同类型和标签
        const query = {
            _id: { $ne: contentId }, // 不包括自己
            status: 'published',
            contentType: content.contentType
        };
        
        // 如果有标签，查找具有相同标签的内容
        if (content.tags && content.tags.length > 0) {
            query.tags = { $in: content.tags };
        }
        
        // 如果有分类，优先相同分类
        if (content.category) {
            query.category = content.category;
        }
        
        // 如果指定了用户，排除用户已观看的内容
        if (userId) {
            const viewedContents = await ViewHistory.distinct('contentId', { userId });
            if (viewedContents.length > 0) {
                query._id.$nin = viewedContents;
            }
        }
        
        // 使用聚合来计算相似度分数
        const pipeline = [
            { $match: query },
            { $addFields: {
                // 标签匹配度
                tagSimilarity: {
                    $size: {
                        $setIntersection: ["$tags", content.tags || []]
                    }
                }
            }},
            { $sort: { tagSimilarity: -1, "stats.views": -1 }},
            { $limit: limit }
        ];
        
        const similarContents = await Content.aggregate(pipeline);
        
        return similarContents;
    }
    
    // 更新用户推荐
    static async updateUserRecommendations(userId) {
        try {
            // 1. 获取用户偏好
            let userPreference = await UserPreference.findOne({ userId });
            
            // 如果不存在，创建新的偏好记录
            if (!userPreference) {
                userPreference = new UserPreference({ userId });
                await userPreference.save();
            }
            
            // 2. 生成或更新编辑推荐
            await this.generateEditorialRecommendations(userId);
            
            // 3. 生成个性化推荐
            await this.generatePersonalizedRecommendations(userId, userPreference);
            
            // 4. 生成热门推荐
            await this.generateTrendingRecommendations(userId);
            
            // 5. 更新推荐分数
            await this.updateRecommendationScores(userId, userPreference);
            
            return true;
        } catch (error) {
            console.error('更新用户推荐失败:', error);
            return false;
        }
    }
    
    // 生成编辑推荐
    static async generateEditorialRecommendations(userId) {
        // 获取所有活跃的编辑推荐
        const editorialContents = await FeaturedContent.find({
            status: 'active',
            startDate: { $lte: new Date() },
            $or: [
                { endDate: { $exists: false } },
                { endDate: { $gte: new Date() } }
            ]
        });
        
        // 为用户创建推荐
        for (const featured of editorialContents) {
            // 检查是否已有此推荐
            const existingRec = await Recommendation.findOne({
                userId,
                contentId: featured.contentId,
                type: 'editorial'
            });
            
            if (!existingRec) {
                // 创建新推荐
                const newRec = new Recommendation({
                    userId,
                    contentId: featured.contentId,
                    type: 'editorial',
                    reason: 'admin_pick',
                    score: 100 + featured.priority, // 编辑推荐通常有较高的分数
                    editorial: {
                        editorId: featured.addedBy,
                        comment: featured.description['zh-CN'],
                        featured: true,
                        priority: featured.priority
                    }
                });
                
                await newRec.save();
            } else {
                // 更新现有推荐
                existingRec.score = 100 + featured.priority;
                existingRec.editorial.comment = featured.description['zh-CN'];
                existingRec.editorial.priority = featured.priority;
                existingRec.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                
                await existingRec.save();
            }
        }
    }
    
    // 生成个性化推荐
    static async generatePersonalizedRecommendations(userId, userPreference) {
        // 生成基于用户历史行为的推荐
        
        // 1. 获取用户的浏览、点赞、收藏历史
        const viewHistory = await ViewHistory.find({ userId })
            .sort('-lastViewedAt')
            .limit(50)
            .populate('contentId', 'contentType category tags creatorId');
            
        const likeHistory = await UserInteraction.find({
            userId,
            type: 'like',
            isActive: true
        }).populate('contentId', 'contentType category tags creatorId');
        
        const favoriteHistory = await UserInteraction.find({
            userId,
            type: 'favorite',
            isActive: true
        }).populate('contentId', 'contentType category tags creatorId');
        
        // 2. 提取用户兴趣特征
        const contentTypes = new Set();
        const categories = new Set();
        const tags = new Map();
        const creators = new Set();
        
        // 处理浏览历史
        for (const view of viewHistory) {
            if (view.contentId) {
                if (view.contentId.contentType) contentTypes.add(view.contentId.contentType);
                if (view.contentId.category) categories.add(view.contentId.category);
                if (view.contentId.creatorId) creators.add(view.contentId.creatorId.toString());
                
                // 累计标签出现次数
                if (view.contentId.tags) {
                    for (const tag of view.contentId.tags) {
                        tags.set(tag, (tags.get(tag) || 0) + 1);
                    }
                }
                
                // 更新用户偏好
                if (view.contentId.category) {
                    userPreference.updateCategoryPreference(view.contentId.category, 1);
                }
                
                if (view.contentId.tags) {
                    for (const tag of view.contentId.tags) {
                        userPreference.updateTagPreference(tag, 1);
                    }
                }
            }
        }
        
        // 处理点赞和收藏 - 这些行为权重更高
        const processInteraction = (interaction, weight) => {
            if (interaction.contentId) {
                if (interaction.contentId.contentType) contentTypes.add(interaction.contentId.contentType);
                if (interaction.contentId.category) categories.add(interaction.contentId.category);
                if (interaction.contentId.creatorId) creators.add(interaction.contentId.creatorId.toString());
                
                // 累计标签出现次数
                if (interaction.contentId.tags) {
                    for (const tag of interaction.contentId.tags) {
                        tags.set(tag, (tags.get(tag) || 0) + weight);
                    }
                }
                
                // 更新用户偏好
                if (interaction.contentId.category) {
                    userPreference.updateCategoryPreference(interaction.contentId.category, weight);
                }
                
                if (interaction.contentId.tags) {
                    for (const tag of interaction.contentId.tags) {
                        userPreference.updateTagPreference(tag, weight);
                    }
                }
            }
        };
        
        likeHistory.forEach(like => processInteraction(like, 2));
        favoriteHistory.forEach(favorite => processInteraction(favorite, 3));
        
        // 保存更新后的用户偏好
        userPreference.lastUpdated = new Date();
        await userPreference.save();
        
        // 3. 查找与用户兴趣匹配的内容
        
        // 获取用户已观看的内容ID
        const viewedContentIds = viewHistory.map(v => v.contentId._id);
        
        // 按内容类型查找
        if (contentTypes.size > 0) {
            const typeContents = await Content.find({
                contentType: { $in: Array.from(contentTypes) },
                _id: { $nin: viewedContentIds },
                status: 'published'
            }).limit(20);
            
            // 为这些内容创建推荐
            for (const content of typeContents) {
                await this.createOrUpdateRecommendation(userId, content._id, 'personalized', 'content_match', 70);
            }
        }
        
        // 按分类查找
        if (categories.size > 0) {
            const categoryContents = await Content.find({
                category: { $in: Array.from(categories) },
                _id: { $nin: viewedContentIds },
                status: 'published'
            }).limit(20);
            
            // 为这些内容创建推荐
            for (const content of categoryContents) {
                await this.createOrUpdateRecommendation(userId, content._id, 'personalized', 'content_match', 60);
            }
        }
        
        // 按标签查找 - 选择前5个最常见的标签
        if (tags.size > 0) {
            const topTags = Array.from(tags.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(entry => entry[0]);
                
            const tagContents = await Content.find({
                tags: { $in: topTags },
                _id: { $nin: viewedContentIds },
                status: 'published'
            }).limit(30);
            
            // 为这些内容创建推荐
            for (const content of tagContents) {
                // 计算标签匹配度
                const contentTags = content.tags || [];
                const matchingTags = topTags.filter(tag => contentTags.includes(tag));
                const matchScore = matchingTags.length / Math.max(1, topTags.length) * 100;
                
                await this.createOrUpdateRecommendation(userId, content._id, 'personalized', 'content_match', 50 + matchScore);
            }
        }
        
        // 按创作者查找
        if (creators.size > 0) {
            const creatorContents = await Content.find({
                creatorId: { $in: Array.from(creators).map(id => mongoose.Types.ObjectId(id)) },
                _id: { $nin: viewedContentIds },
                status: 'published'
            }).limit(20);
            
            // 为这些内容创建推荐
            for (const content of creatorContents) {
                await this.createOrUpdateRecommendation(userId, content._id, 'personalized', 'content_match', 80);
            }
        }
    }
    
    // 生成热门内容推荐
    static async generateTrendingRecommendations(userId) {
        // 获取用户已观看的内容
        const viewedContentIds = await ViewHistory.distinct('contentId', { userId });
        
        // 获取热门内容
        const trendingContents = await this.getTrendingRecommendations({
            limit: 30
        });
        
        // 为这些内容创建推荐
        for (const content of trendingContents) {
            // 排除已观看的内容
            if (!viewedContentIds.some(id => id.toString() === content._id.toString())) {
                // 热度分数 = 基础分 + 热度评分 * 0.2 (给热门内容一些权重，但不会压过个性化推荐)
                const score = 40 + content.hotScore * 0.2;
                await this.createOrUpdateRecommendation(userId, content._id, 'trending', 'popular', score);
            }
        }
    }
    
    // 创建或更新推荐
    static async createOrUpdateRecommendation(userId, contentId, type, reason, score) {
        // 查找是否已有推荐
        let recommendation = await Recommendation.findOne({
            userId,
            contentId,
            type
        });
        
        if (recommendation) {
            // 更新推荐分数 - 取最高分数
            recommendation.score = Math.max(recommendation.score, score);
            recommendation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            await recommendation.save();
        } else {
            // 创建新推荐
            recommendation = new Recommendation({
                userId,
                contentId,
                type,
                reason,
                score
            });
            
            await recommendation.save();
        }
        
        return recommendation;
    }
    
    // 更新推荐分数
    static async updateRecommendationScores(userId, userPreference) {
        // 获取用户所有活跃的推荐
        const recommendations = await Recommendation.find({
            userId,
            status: 'active'
        }).populate('contentId', 'contentType category tags creatorId');
        
        for (const rec of recommendations) {
            let adjustedScore = rec.score;
            
            // 基于用户偏好对推荐分数进行调整
            if (rec.contentId) {
                // 根据分类偏好调整分数
                if (rec.contentId.category && userPreference.categoryPreferences[rec.contentId.category]) {
                    adjustedScore += userPreference.categoryPreferences[rec.contentId.category] * 10;
                }
                
                // 根据内容类型偏好调整分数
                if (rec.contentId.contentType && userPreference.contentTypePreferences[rec.contentId.contentType]) {
                    adjustedScore += userPreference.contentTypePreferences[rec.contentId.contentType] * 10;
                }
                
                // 根据标签偏好调整分数
                if (rec.contentId.tags) {
                    let tagBonus = 0;
                    for (const tag of rec.contentId.tags) {
                        const tagScore = userPreference.tagPreferences.get(tag);
                        if (tagScore) {
                            tagBonus += tagScore;
                        }
                    }
                    adjustedScore += tagBonus * 5;
                }
            }
            
            // 更新分数
            if (adjustedScore !== rec.score) {
                rec.score = adjustedScore;
                await rec.save();
            }
        }
    }
    
    // 记录推荐交互
    static async recordRecommendationInteraction(recommendationId, interactionType) {
        const recommendation = await Recommendation.findById(recommendationId);
        
        if (!recommendation) {
            throw new Error('推荐不存在');
        }
        
        // 添加互动记录
        recommendation.interactions.push({
            type: interactionType,
            timestamp: new Date()
        });
        
        // 更新计数器
        if (interactionType === 'impression') {
            recommendation.impressions += 1;
        }
        
        // 更新状态
        if (interactionType === 'click') {
            recommendation.status = 'clicked';
        } else if (interactionType === 'dismiss') {
            recommendation.status = 'dismissed';
        } else if (['like', 'favorite', 'complete_view'].includes(interactionType)) {
            recommendation.status = 'converted';
        }
        
        await recommendation.save();
        
        return recommendation;
    }
}

module.exports = RecommendationService;