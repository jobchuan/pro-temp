// models/UserPreference.js
const mongoose = require('mongoose');

const userPreferenceSchema = new mongoose.Schema({
    // 用户ID
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    
    // 偏好分类权重
    categoryPreferences: {
        travel: { type: Number, default: 0 },
        education: { type: Number, default: 0 },
        entertainment: { type: Number, default: 0 },
        sports: { type: Number, default: 0 },
        news: { type: Number, default: 0 },
        documentary: { type: Number, default: 0 },
        art: { type: Number, default: 0 },
        other: { type: Number, default: 0 }
    },
    
    // 内容类型偏好权重
    contentTypePreferences: {
        '180_video': { type: Number, default: 0 },
        '180_photo': { type: Number, default: 0 },
        '360_video': { type: Number, default: 0 },
        '360_photo': { type: Number, default: 0 },
        'spatial_video': { type: Number, default: 0 },
        'spatial_photo': { type: Number, default: 0 }
    },
    
    // 标签偏好权重 (动态增长的标签列表)
    tagPreferences: {
        type: Map,
        of: Number,
        default: {}
    },
    
    // 创作者偏好权重
    creatorPreferences: {
        type: Map,
        of: Number,
        default: {}
    },
    
    // 时间偏好
    timePreferences: {
        morningActivity: { type: Number, default: 0 }, // 0-6 (0最低，6最高)
        afternoonActivity: { type: Number, default: 0 },
        eveningActivity: { type: Number, default: 0 },
        nightActivity: { type: Number, default: 0 },
        weekdayActivity: { type: Number, default: 0 },
        weekendActivity: { type: Number, default: 0 }
    },
    
    // 内容时长偏好
    durationPreferences: {
        short: { type: Number, default: 0 }, // < 5分钟
        medium: { type: Number, default: 0 }, // 5-15分钟
        long: { type: Number, default: 0 }    // > 15分钟
    },
    
    // 互动行为权重
    interactionWeights: {
        view: { type: Number, default: 1 },
        complete: { type: Number, default: 2 },
        like: { type: Number, default: 3 },
        favorite: { type: Number, default: 4 },
        comment: { type: Number, default: 3 },
        share: { type: Number, default: 5 }
    },
    
    // 是否启用个性化推荐
    enablePersonalization: {
        type: Boolean,
        default: true
    },
    
    // 更新时间
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// 方法: 更新分类偏好
userPreferenceSchema.methods.updateCategoryPreference = function(category, value) {
    if (this.categoryPreferences[category] !== undefined) {
        // 使用衰减因子来平滑更新
        const decayFactor = 0.9;
        this.categoryPreferences[category] = 
            this.categoryPreferences[category] * decayFactor + value * (1 - decayFactor);
    }
};

// 方法: 更新标签偏好
userPreferenceSchema.methods.updateTagPreference = function(tag, value) {
    let currentValue = this.tagPreferences.get(tag) || 0;
    const decayFactor = 0.9;
    this.tagPreferences.set(tag, 
        currentValue * decayFactor + value * (1 - decayFactor));
};

module.exports = mongoose.model('UserPreference', userPreferenceSchema);