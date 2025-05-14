// models/Content.js
const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
    // 基本信息
    title: {
        'zh-CN': { type: String, required: true },
        'en-US': { type: String },
        'ja-JP': { type: String },
        'ko-KR': { type: String }
    },
    description: {
        'zh-CN': { type: String },
        'en-US': { type: String },
        'ja-JP': { type: String },
        'ko-KR': { type: String }
    },
    
    // 内容类型
    contentType: {
        type: String,
        enum: ['180_video', '180_photo', '360_video', '360_photo', 'spatial_video', 'spatial_photo'],
        required: true
    },
    
    // 文件信息
    files: {
        main: {
            url: { type: String, required: true },
            size: Number,
            duration: Number, // 视频时长（秒）
            resolution: {
                width: Number,
                height: Number
            }
        },
        thumbnail: {
            url: String,
            size: Number
        },
        preview: {
            url: String,
            size: Number
        }
    },
    
    // 额外媒体
    media: {
        backgroundMusic: {
            url: String,
            title: String,
            artist: String
        },
        narration: {
            'zh-CN': { url: String },
            'en-US': { url: String },
            'ja-JP': { url: String },
            'ko-KR': { url: String }
        }
    },
    
    // GPS信息
    location: {
        latitude: Number,
        longitude: Number,
        altitude: Number,
        address: String,
        country: String,
        city: String
    },
    
    // 创作者信息
    creatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // 协作信息
    collaboration: {
        isCollaborative: { type: Boolean, default: false },
        collaborationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Collaboration'
        }
    },
    
    // 标签和分类
    tags: [String],
    category: {
        type: String,
        enum: ['travel', 'education', 'entertainment', 'sports', 'news', 'documentary', 'art', 'other'],
        default: 'other'
    },
    
    // 付费设置
    pricing: {
        isFree: { type: Boolean, default: true },
        price: { type: Number, default: 0 },
        currency: { type: String, default: 'CNY' }
    },
    
    // 统计信息
    stats: {
        views: { type: Number, default: 0 },
        likes: { type: Number, default: 0 },
        favorites: { type: Number, default: 0 },
        comments: { type: Number, default: 0 },
        shares: { type: Number, default: 0 },
        downloads: { type: Number, default: 0 },
        danmakus: { type: Number, default: 0 }
    },
    // 内容状态
    status: {
        type: String,
        enum: ['draft', 'pending_review', 'approved', 'rejected', 'published', 'archived'],
        default: 'draft'
    },
    
    // 审核信息
    review: {
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        reviewedAt: Date,
        reviewNote: String
    },
    
    // 版本控制
    version: {
        current: { type: Number, default: 1 },
        history: [{
            version: Number,
            changedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            changedAt: Date,
            changes: mongoose.Schema.Types.Mixed
        }]
    },
    
    // 时间戳
    publishedAt: Date,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// 索引
contentSchema.index({ creatorId: 1, status: 1 });
contentSchema.index({ 'title.zh-CN': 'text', 'description.zh-CN': 'text' });
contentSchema.index({ tags: 1 });
contentSchema.index({ category: 1 });
contentSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });

// 虚拟字段：获取本地化标题
contentSchema.virtual('localizedTitle').get(function() {
    return (language) => {
        return this.title[language] || this.title['zh-CN'];
    };
});

// 实例方法：更新统计
contentSchema.methods.incrementStat = async function(statType) {
    if (this.stats[statType] !== undefined) {
        this.stats[statType] += 1;
        await this.save();
    }
};

// 实例方法：添加版本记录
contentSchema.methods.addVersionHistory = async function(userId, changes) {
    const newVersion = this.version.current + 1;
    
    this.version.history.push({
        version: this.version.current,
        changedBy: userId,
        changedAt: new Date(),
        changes: changes
    });
    
    this.version.current = newVersion;
    await this.save();
};

module.exports = mongoose.model('Content', contentSchema);
