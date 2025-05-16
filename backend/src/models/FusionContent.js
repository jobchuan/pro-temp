// models/FusionContent.js
const mongoose = require('mongoose');

const fusionContentSchema = new mongoose.Schema({
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
    
    // 融合类型
    fusionType: {
        type: String,
        enum: ['video_fusion', 'photo_fusion', 'mixed_fusion'],
        required: true
    },
    
    // 创作者信息
    creatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // 引用现有内容的数组（不再需要FusionItem模型）
    contents: [{
        // 引用已存在的Content模型
        contentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Content',
            required: true
        },
        
        // 在此融合中的显示顺序
        displayOrder: {
            type: Number,
            default: 0
        },
        
        // 在此融合中的特殊设置（覆盖原始内容的设置）
        overrideSettings: {
            // 旁白覆盖（可以为此融合选择特定的旁白版本）
            narration: {
                active: { type: Boolean, default: false },
                language: { type: String },
                url: String,
                volume: { type: Number, min: 0, max: 1, default: 1 }
            },
            
            // 背景音乐覆盖
            backgroundMusic: {
                active: { type: Boolean, default: false },
                url: String,
                startTime: Number,
                endTime: Number, 
                volume: { type: Number, min: 0, max: 1, default: 1 }
            },
            
            // 视频特定设置
            videoSettings: {
                startTime: Number,
                endTime: Number,
                volume: { type: Number, min: 0, max: 1, default: 1 }
            },
            
            // 照片特定设置
            photoSettings: {
                displayDuration: Number, // 显示时长（秒）
                zoomEffect: Boolean // 是否使用缩放效果
            },
            
            // 字幕设置
            subtitles: {
                active: { type: Boolean, default: false },
                language: { type: String },
                url: String
            }
        },
        
        // 此内容项的标题和描述（可覆盖原内容的标题描述）
        customTitle: {
            'zh-CN': { type: String },
            'en-US': { type: String },
            'ja-JP': { type: String },
            'ko-KR': { type: String }
        },
        customDescription: {
            'zh-CN': { type: String },
            'en-US': { type: String },
            'ja-JP': { type: String },
            'ko-KR': { type: String }
        }
    }],
    
    // 全局背景音乐
    backgroundMusic: {
        url: String,
        title: String,
        artist: String,
        startTime: Number,
        endTime: Number,
        volume: { type: Number, min: 0, max: 1, default: 1 }
    },
    
    // 可定义内容之间的过渡效果
    transitions: {
        type: String,
        enum: ['none', 'fade', 'slide', 'zoom', 'custom'],
        default: 'fade'
    },
    
    // 统计信息
    stats: {
        views: { type: Number, default: 0 },
        likes: { type: Number, default: 0 },
        favorites: { type: Number, default: 0 },
        comments: { type: Number, default: 0 },
        shares: { type: Number, default: 0 },
        downloads: { type: Number, default: 0 }
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
    
    // 内容状态
    status: {
        type: String,
        enum: ['draft', 'pending_review', 'approved', 'rejected', 'published', 'archived'],
        default: 'draft'
    },
    
    // 缩略图
    thumbnailURL: String,
    
    // 协作信息
    collaboration: {
        isCollaborative: { type: Boolean, default: false },
        collaborationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Collaboration'
        }
    },
    
    // 默认播放设置
    playSettings: {
        autoplay: { type: Boolean, default: false },
        loop: { type: Boolean, default: false },
        defaultSpeed: { type: Number, default: 1 },
        pauseBetweenItems: { type: Boolean, default: false },
        pauseDuration: { type: Number, default: 2 } // 秒
    },
    
    // 时间戳
    publishedAt: Date,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// 索引
fusionContentSchema.index({ creatorId: 1 });
fusionContentSchema.index({ 'contents.contentId': 1 });
fusionContentSchema.index({ status: 1 });
fusionContentSchema.index({ fusionType: 1 });
fusionContentSchema.index({ tags: 1 });
fusionContentSchema.index({ category: 1 });

module.exports = mongoose.model('FusionContent', fusionContentSchema);