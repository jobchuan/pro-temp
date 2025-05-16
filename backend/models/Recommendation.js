// models/Recommendation.js
const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema({
    // 推荐给谁
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    
    // 推荐什么内容
    contentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Content',
        required: true
    },
    
    // 推荐类型
    type: {
        type: String,
        enum: ['editorial', 'personalized', 'trending', 'similar'],
        required: true
    },
    
    // 推荐分数（用于排序）
    score: {
        type: Number,
        default: 0
    },
    
    // 推荐原因
    reason: {
        type: String,
        enum: ['admin_pick', 'similar_users', 'content_match', 'popular', 'continue_watching', 'new_creator'],
        required: true
    },
    
    // 管理员推荐信息
    editorial: {
        editorId: mongoose.Schema.Types.ObjectId,
        comment: String,
        featured: Boolean, // 是否为特色推荐
        priority: {
            type: Number,
            default: 0
        }
    },
    
    // 推荐状态
    status: {
        type: String,
        enum: ['active', 'clicked', 'dismissed', 'converted'], // 转化表示用户进行了点赞/收藏等行为
        default: 'active'
    },
    
    // 展示次数
    impressions: {
        type: Number,
        default: 0
    },
    
    // 用户与推荐的交互
    interactions: [{
        type: {
            type: String,
            enum: ['impression', 'click', 'dismiss', 'like', 'favorite', 'complete_view']
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    
    // 时间戳
    createdAt: {
        type: Date,
        default: Date.now
    },
    
    // 过期时间（使推荐能够自动刷新）
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7天后过期
    }
}, {
    timestamps: true
});

// 复合索引
recommendationSchema.index({ userId: 1, contentId: 1, type: 1 }, { unique: true });
recommendationSchema.index({ type: 1, score: -1 });
recommendationSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('Recommendation', recommendationSchema);