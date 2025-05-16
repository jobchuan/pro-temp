// models/Fusion.js
const mongoose = require('mongoose');

const fusionSchema = new mongoose.Schema({
    // 基本信息
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    
    // 创作者信息
    creatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // 封面图
    coverImage: {
        url: String,
        thumbnailURL: String,
        alt: String
    },
    
    // 分类
    category: {
        type: String,
        enum: ['travel', 'education', 'entertainment', 'sports', 'news', 'documentary', 'art', 'other'],
        default: 'other'
    },
    
    // 内容列表
    contents: [{
        contentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Content',
            required: true
        },
        order: {
            type: Number,
            default: 0
        },
        settings: {
            autoPlay: {
                type: Boolean,
                default: true
            },
            loop: {
                type: Boolean,
                default: false
            },
            duration: Number, // 覆盖原始时长
            transition: {
                type: String,
                enum: ['none', 'fade', 'slide'],
                default: 'fade'
            },
            customOptions: mongoose.Schema.Types.Mixed
        }
    }],
    
    // 全局设置
    settings: {
        autoPlay: {
            type: Boolean,
            default: true
        },
        loop: {
            type: Boolean,
            default: false
        },
        shuffle: {
            type: Boolean,
            default: false
        },
        transitionDuration: {
            type: Number,
            default: 1000 // 毫秒
        },
        displayMode: {
            type: String,
            enum: ['sequential', 'grid', 'custom'],
            default: 'sequential'
        },
        customOptions: mongoose.Schema.Types.Mixed
    },
    
    // 统计信息
    stats: {
        views: {
            type: Number,
            default: 0
        },
        likes: {
            type: Number,
            default: 0
        },
        favorites: {
            type: Number,
            default: 0
        },
        shares: {
            type: Number,
            default: 0
        },
        comments: {
            type: Number,
            default: 0
        }
    },
    
    // 状态
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    },
    
    // 访问控制
    visibility: {
        type: String,
        enum: ['public', 'private', 'unlisted'],
        default: 'public'
    },
    
    // 协作者
    collaborators: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ['editor', 'viewer'],
            default: 'viewer'
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // 标签
    tags: [String],
    
    // 时间戳
    publishedAt: Date,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// 索引
fusionSchema.index({ creatorId: 1 });
fusionSchema.index({ status: 1 });
fusionSchema.index({ 'contents.contentId': 1 });
fusionSchema.index({ tags: 1 });
fusionSchema.index({ createdAt: -1 });

// 实例方法：增加内容
fusionSchema.methods.addContent = async function(contentId, order, settings = {}) {
    // 检查内容是否已存在
    const exists = this.contents.some(item => item.contentId.toString() === contentId.toString());
    
    if (!exists) {
        this.contents.push({
            contentId,
            order: order !== undefined ? order : this.contents.length,
            settings
        });
        
        // 排序内容
        this.contents.sort((a, b) => a.order - b.order);
        await this.save();
    }
    
    return this;
};

// 实例方法：移除内容
fusionSchema.methods.removeContent = async function(contentId) {
    const initialLength = this.contents.length;
    this.contents = this.contents.filter(item => item.contentId.toString() !== contentId.toString());
    
    // 重新排序
    this.contents.forEach((item, index) => {
        item.order = index;
    });
    
    if (initialLength !== this.contents.length) {
        await this.save();
        return true;
    }
    
    return false;
};

// 实例方法：重新排序内容
fusionSchema.methods.reorderContents = async function(orderedIds) {
    // 创建ID到顺序的映射
    const orderMap = {};
    orderedIds.forEach((id, index) => {
        orderMap[id.toString()] = index;
    });
    
    // 更新顺序
    this.contents.forEach(item => {
        const id = item.contentId.toString();
        if (orderMap[id] !== undefined) {
            item.order = orderMap[id];
        }
    });
    
    // 排序内容
    this.contents.sort((a, b) => a.order - b.order);
    
    await this.save();
    return this;
};

// 实例方法：增加查看次数
fusionSchema.methods.incrementViews = async function() {
    this.stats.views = (this.stats.views || 0) + 1;
    await this.save();
    return this;
};

// 实例方法：发布
fusionSchema.methods.publish = async function() {
    if (this.status !== 'published') {
        this.status = 'published';
        this.publishedAt = new Date();
        await this.save();
    }
    
    return this;
};

module.exports = mongoose.model('Fusion', fusionSchema);