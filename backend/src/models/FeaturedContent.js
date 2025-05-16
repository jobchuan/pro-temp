// models/FeaturedContent.js
const mongoose = require('mongoose');

const featuredContentSchema = new mongoose.Schema({
    // 关联的内容
    contentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Content',
        required: true
    },
    
    // 精选类型
    featureType: {
        type: String,
        enum: ['homepage', 'category', 'trending', 'new_arrival', 'editor_choice', 'seasonal'],
        required: true
    },
    
    // 适用分类（如果是针对特定分类）
    category: String,
    
    // 推荐语
    headline: {
        'zh-CN': String,
        'en-US': String,
        'ja-JP': String,
        'ko-KR': String
    },
    
    // 精选描述
    description: {
        'zh-CN': String,
        'en-US': String,
        'ja-JP': String,
        'ko-KR': String
    },
    
    // 排序优先级
    priority: {
        type: Number,
        default: 0
    },
    
    // 添加人
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // 状态
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    
    // 有效期
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: Date,
    
    // 针对的用户群体（可选）
    targetUserGroups: [{
        type: String,
        enum: ['all', 'new_users', 'active_users', 'subscribers', 'creators']
    }],
    
    // 自定义显示图片（可覆盖原内容缩略图）
    customThumbnail: String,
    
    // 统计
    stats: {
        impressions: { type: Number, default: 0 },
        clicks: { type: Number, default: 0 },
        conversions: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});

// 索引
featuredContentSchema.index({ featureType: 1, priority: -1 });
featuredContentSchema.index({ startDate: 1, endDate: 1 });
featuredContentSchema.index({ contentId: 1 });

module.exports = mongoose.model('FeaturedContent', featuredContentSchema);