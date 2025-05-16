// models/Comment.js
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    // 内容ID
    contentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Content',
        required: true
    },
    
    // 评论者ID
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // 评论内容
    text: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    
    // 空间锚点（用于VR空间中的定位评论）
    spatialAnchor: {
        position: {
            x: Number,
            y: Number,
            z: Number
        },
        rotation: {
            x: Number,
            y: Number,
            z: Number,
            w: Number
        },
        timestamp: Number // 视频时间戳
    },
    
    // 回复的评论ID（用于评论回复）
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    },
    
    // 评论层级
    level: {
        type: Number,
        default: 0
    },
    
    // 评论状态
    status: {
        type: String,
        enum: ['active', 'deleted', 'flagged', 'hidden'],
        default: 'active'
    },
    
    // 点赞数
    likes: {
        type: Number,
        default: 0
    },
    
    // 回复数
    replyCount: {
        type: Number,
        default: 0
    },
    
    // 是否置顶
    isPinned: {
        type: Boolean,
        default: false
    },
    
    // 是否为创作者评论
    isCreatorComment: {
        type: Boolean,
        default: false
    },
    
    // 举报信息
    reports: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        reason: String,
        reportedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // 编辑历史
    editHistory: [{
        text: String,
        editedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // 时间戳
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
commentSchema.index({ contentId: 1, createdAt: -1 });
commentSchema.index({ userId: 1 });
commentSchema.index({ parentId: 1 });

// 虚拟字段：获取回复列表
commentSchema.virtual('replies', {
    ref: 'Comment',
    localField: '_id',
    foreignField: 'parentId'
});

// 前置中间件：保存前处理
commentSchema.pre('save', async function(next) {
    // 如果是回复，计算层级并更新父评论的回复数
    if (this.parentId && this.isNew) {
        const parentComment = await this.constructor.findById(this.parentId);
        if (parentComment) {
            this.level = parentComment.level + 1;
            
            // 更新父评论的回复数
            await this.constructor.findByIdAndUpdate(this.parentId, {
                $inc: { replyCount: 1 }
            });
        }
    }
    
    // 判断是否为创作者评论
    const Content = require('./Content');
    const content = await Content.findById(this.contentId);
    if (content && content.creatorId.toString() === this.userId.toString()) {
        this.isCreatorComment = true;
    }
    
    next();
});

// 实例方法：软删除评论
commentSchema.methods.softDelete = async function() {
    this.status = 'deleted';
    this.text = '[评论已删除]';
    await this.save();
    
    // 更新内容的评论统计
    const Content = require('./Content');
    await Content.findByIdAndUpdate(this.contentId, {
        $inc: { 'stats.comments': -1 }
    });
};

// 实例方法：举报评论
commentSchema.methods.report = async function(userId, reason) {
    const existingReport = this.reports.find(r => r.userId.toString() === userId.toString());
    
    if (!existingReport) {
        this.reports.push({ userId, reason });
        
        // 如果举报数量超过阈值，标记评论
        if (this.reports.length >= 5) {
            this.status = 'flagged';
        }
        
        await this.save();
    }
};

// 静态方法：获取评论树结构
commentSchema.statics.getCommentTree = async function(contentId, options = {}) {
    const { 
        page = 1, 
        limit = 20, 
        sort = '-createdAt',
        includeDeleted = false 
    } = options;
    
    // 查询条件
    const query = { 
        contentId, 
        level: 0  // 只获取顶层评论
    };
    
    if (!includeDeleted) {
        query.status = { $ne: 'deleted' };
    }
    
    // 获取顶层评论
    const comments = await this.find(query)
        .sort(sort)
        .limit(limit)
        .skip((page - 1) * limit)
        .populate('userId', 'username profile.displayName avatarURL')
        .populate({
            path: 'replies',
            populate: {
                path: 'userId',
                select: 'username profile.displayName avatarURL'
            },
            match: includeDeleted ? {} : { status: { $ne: 'deleted' } }
        })
        .lean();
    
    const total = await this.countDocuments(query);
    
    return {
        comments,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    };
};

module.exports = mongoose.model('Comment', commentSchema);