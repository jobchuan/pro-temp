// models/ViewHistory.js
const mongoose = require('mongoose');

const viewHistorySchema = new mongoose.Schema({
    // 用户ID
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // 内容ID
    contentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Content',
        required: true
    },
    
    // 观看进度（秒）
    progress: {
        type: Number,
        default: 0
    },
    
    // 总时长（秒）
    duration: {
        type: Number,
        default: 0
    },
    
    // 观看进度百分比
    progressPercentage: {
        type: Number,
        default: 0
    },
    
    // 是否已完成观看
    isCompleted: {
        type: Boolean,
        default: false
    },
    
    // 观看次数
    viewCount: {
        type: Number,
        default: 1
    },
    
    // 最后观看的位置（用于空间定位）
    lastPosition: {
        x: Number,
        y: Number,
        z: Number,
        timestamp: Number
    },
    
    // 设备信息
    deviceInfo: {
        type: String,
        platform: String,
        version: String
    },
    
    // 观看会话记录
    sessions: [{
        startTime: Date,
        endTime: Date,
        duration: Number, // 秒
        startProgress: Number,
        endProgress: Number
    }],
    
    // 首次观看时间
    firstViewedAt: {
        type: Date,
        default: Date.now
    },
    
    // 最后观看时间
    lastViewedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// 索引
viewHistorySchema.index({ userId: 1, contentId: 1 }, { unique: true });
viewHistorySchema.index({ userId: 1, lastViewedAt: -1 });

// 实例方法：更新观看进度
viewHistorySchema.methods.updateProgress = async function(progress, duration) {
    this.progress = progress;
    this.duration = duration;
    this.progressPercentage = duration > 0 ? (progress / duration) * 100 : 0;
    this.isCompleted = this.progressPercentage >= 95; // 观看95%以上视为完成
    this.lastViewedAt = new Date();
    
    await this.save();
};

// 实例方法：添加观看会话
viewHistorySchema.methods.addSession = async function(sessionData) {
    const { startTime, endTime, startProgress, endProgress } = sessionData;
    const duration = (endTime - startTime) / 1000; // 转换为秒
    
    this.sessions.push({
        startTime,
        endTime,
        duration,
        startProgress,
        endProgress
    });
    
    // 更新观看次数
    this.viewCount += 1;
    this.lastViewedAt = endTime;
    
    await this.save();
};

// 静态方法：获取用户观看历史
viewHistorySchema.statics.getUserHistory = async function(userId, options = {}) {
    const { page = 1, limit = 20, sort = '-lastViewedAt' } = options;
    
    const history = await this.find({ userId })
        .sort(sort)
        .limit(limit)
        .skip((page - 1) * limit)
        .populate('contentId', 'title contentType files.thumbnail stats')
        .lean();
    
    const total = await this.countDocuments({ userId });
    
    return {
        history,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    };
};

// 静态方法：记录观看历史
viewHistorySchema.statics.recordView = async function(userId, contentId, progress = 0, duration = 0) {
    let history = await this.findOne({ userId, contentId });
    
    if (!history) {
        // 创建新记录
        history = await this.create({
            userId,
            contentId,
            progress,
            duration
        });
        
        // 更新内容的观看统计
        const Content = require('./Content');
        await Content.findByIdAndUpdate(contentId, {
            $inc: { 'stats.views': 1 }
        });
    } else {
        // 更新现有记录
        await history.updateProgress(progress, duration);
    }
    
    return history;
};

// 静态方法：获取继续观看列表
viewHistorySchema.statics.getContinueWatching = async function(userId, limit = 10) {
    const history = await this.find({
        userId,
        isCompleted: false,
        progressPercentage: { $gt: 5, $lt: 95 } // 观看进度在5%-95%之间
    })
    .sort('-lastViewedAt')
    .limit(limit)
    .populate('contentId')
    .lean();
    
    return history;
};

module.exports = mongoose.model('ViewHistory', viewHistorySchema);