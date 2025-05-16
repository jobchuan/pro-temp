// models/OfflineContent.js
const mongoose = require('mongoose');

const offlineContentSchema = new mongoose.Schema({
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
    
    // 下载状态
    status: {
        type: String,
        enum: ['pending', 'downloading', 'completed', 'failed', 'expired'],
        default: 'pending'
    },
    
    // 下载进度
    progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    
    // 文件信息
    files: {
        main: {
            url: String,
            size: Number,
            downloadedSize: Number,
            checksum: String
        },
        thumbnail: {
            url: String,
            size: Number
        },
        audio: {
            url: String,
            size: Number
        }
    },
    
    // 总大小（字节）
    totalSize: {
        type: Number,
        default: 0
    },
    
    // 已下载大小（字节）
    downloadedSize: {
        type: Number,
        default: 0
    },
    
    // 下载质量
    quality: {
        type: String,
        enum: ['low', 'medium', 'high', 'ultra'],
        default: 'high'
    },
    
    // 过期时间
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30天后过期
    },
    
    // 错误信息
    error: {
        code: String,
        message: String
    },
    
    // 下载开始时间
    startedAt: Date,
    
    // 下载完成时间
    completedAt: Date,
    
    // 最后访问时间
    lastAccessedAt: {
        type: Date,
        default: Date.now
    },
    
    // 设备信息
    deviceInfo: {
        deviceId: String,
        platform: String,
        availableSpace: Number
    },
    
    // 元数据（用于离线播放）
    metadata: {
        title: mongoose.Schema.Types.Mixed,
        description: mongoose.Schema.Types.Mixed,
        duration: Number,
        contentType: String
    }
}, {
    timestamps: true
});

// 索引
offlineContentSchema.index({ userId: 1, contentId: 1 }, { unique: true });
offlineContentSchema.index({ userId: 1, status: 1 });
offlineContentSchema.index({ expiresAt: 1 });

// 实例方法：更新下载进度
offlineContentSchema.methods.updateProgress = async function(downloadedSize) {
    this.downloadedSize = downloadedSize;
    this.progress = this.totalSize > 0 ? (downloadedSize / this.totalSize) * 100 : 0;
    
    if (this.progress >= 100) {
        this.status = 'completed';
        this.completedAt = new Date();
    }
    
    await this.save();
};

// 实例方法：标记为失败
offlineContentSchema.methods.markAsFailed = async function(error) {
    this.status = 'failed';
    this.error = {
        code: error.code || 'UNKNOWN',
        message: error.message
    };
    
    await this.save();
};

// 实例方法：更新访问时间
offlineContentSchema.methods.updateLastAccessed = async function() {
    this.lastAccessedAt = new Date();
    await this.save();
};

// 静态方法：获取用户的离线内容
offlineContentSchema.statics.getUserOfflineContent = async function(userId, options = {}) {
    const { page = 1, limit = 20, status } = options;
    
    const query = { userId };
    if (status) {
        query.status = status;
    }
    
    const content = await this.find(query)
        .sort('-createdAt')
        .limit(limit)
        .skip((page - 1) * limit)
        .populate('contentId', 'title contentType files.thumbnail')
        .lean();
    
    const total = await this.countDocuments(query);
    
    return {
        content,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    };
};

// 静态方法：清理过期内容
offlineContentSchema.statics.cleanupExpiredContent = async function() {
    const expired = await this.find({
        expiresAt: { $lt: new Date() }
    });
    
    for (const content of expired) {
        content.status = 'expired';
        await content.save();
        // TODO: 实际删除文件的逻辑
    }
    
    return expired.length;
};

// 静态方法：计算用户的离线存储使用量
offlineContentSchema.statics.calculateUserStorage = async function(userId) {
    const result = await this.aggregate([
        { $match: { userId: mongoose.Types.ObjectId(userId), status: 'completed' } },
        { $group: {
            _id: null,
            totalSize: { $sum: '$totalSize' },
            count: { $sum: 1 }
        }}
    ]);
    
    return result[0] || { totalSize: 0, count: 0 };
};

module.exports = mongoose.model('OfflineContent', offlineContentSchema);