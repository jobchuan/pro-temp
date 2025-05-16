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
    // 背景音乐扩展，添加控制选项
    backgroundMusic: {
        url: String,
        title: String,
        artist: String,
        startTime: { type: Number, default: 0 }, // 开始时间（秒）
        endTime: Number, // 结束时间（秒），如不设置则播放到结束
        volume: { type: Number, min: 0, max: 1, default: 1 } // 音量控制
    },
    
    // 旁白扩展，添加时间控制
    narration: {
        'zh-CN': { 
            url: String,
            duration: Number, // 旁白时长
            transcript: String, // 旁白文本
            startTime: { type: Number, default: 0 } // 开始时间
        },
        'en-US': { 
            url: String,
            duration: Number,
            transcript: String,
            startTime: { type: Number, default: 0 }
        },
        'ja-JP': { 
            url: String,
            duration: Number,
            transcript: String,
            startTime: { type: Number, default: 0 }
        },
        'ko-KR': { 
            url: String,
            duration: Number,
            transcript: String,
            startTime: { type: Number, default: 0 }
        }
    },
    
    // 添加字幕支持
    subtitles: {
        'zh-CN': { 
            url: String, // 字幕文件URL（通常为.srt或.vtt格式）
            label: { type: String, default: '中文' }
        },
        'en-US': { 
            url: String,
            label: { type: String, default: 'English' }
        },
        'ja-JP': { 
            url: String,
            label: { type: String, default: '日本語' }
        },
        'ko-KR': { 
            url: String,
            label: { type: String, default: '한국어' }
        }
    }
},

// 添加照片特定设置
photoSettings: {
    displayDuration: { type: Number, default: 5 }, // 默认显示时长（秒）
    transitionEffect: { 
        type: String, 
        enum: ['none', 'fade', 'slide', 'zoom'], 
        default: 'none'
    },
    panAndZoom: { type: Boolean, default: false }, // 是否使用平移缩放效果
    panAndZoomSettings: {
        startPosition: { x: Number, y: Number, scale: Number },
        endPosition: { x: Number, y: Number, scale: Number },
        duration: Number
    }
},

// 添加视频特定设置
videoSettings: {
    defaultVolume: { type: Number, min: 0, max: 1, default: 1 },
    defaultQuality: { 
        type: String, 
        enum: ['auto', 'low', 'medium', 'high', 'ultra'], 
        default: 'auto'
    },
    startTime: { type: Number, default: 0 }, // 默认开始播放时间（秒）
    endTime: Number, // 默认结束时间（秒）
    loopCount: { type: Number, default: 0 } // 0表示不循环，>0表示循环次数
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
    featuredImage: {
        url: String,
        alt: String
    },
    seoInfo: {
        metaTitle: String,
        metaDescription: String,
        keywords: [String]
    },
    customData: mongoose.Schema.Types.Mixed, // 用于存储特定内容类型的额外数据
    
    // 协作者信息
    collaborators: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ['editor', 'viewer']
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // 审核历史
    reviewHistory: [{
        status: String,
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        comments: String,
        reviewedAt: {
            type: Date,
            default: Date.now
        }
    }],

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
