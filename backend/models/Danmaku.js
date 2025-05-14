// models/Danmaku.js
const mongoose = require('mongoose');

const danmakuSchema = new mongoose.Schema({
    // 内容ID
    contentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Content',
        required: true
    },
    
    // 用户ID
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // 弹幕文本
    text: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    
    // 时间戳（秒）
    timestamp: {
        type: Number,
        required: true
    },
    
    // 弹幕类型
    type: {
        type: String,
        enum: ['scroll', 'top', 'bottom', 'spatial'], // spatial用于VR空间定位弹幕
        default: 'scroll'
    },
    
    // 弹幕样式
    style: {
        color: {
            type: String,
            default: '#FFFFFF'
        },
        fontSize: {
            type: String,
            enum: ['small', 'medium', 'large'],
            default: 'medium'
        },
        opacity: {
            type: Number,
            default: 1,
            min: 0,
            max: 1
        }
    },
    
    // 空间位置（用于VR弹幕）
    spatialPosition: {
        x: Number,
        y: Number,
        z: Number,
        rx: Number, // 旋转
        ry: Number,
        rz: Number
    },
    
    // 弹幕速度（仅用于滚动弹幕）
    speed: {
        type: Number,
        default: 1,
        min: 0.5,
        max: 2
    },
    
    // 状态
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
    
    // 设备信息
    deviceInfo: {
        platform: String,
        visionProMode: Boolean
    },
    
    // 创建时间
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// 索引
danmakuSchema.index({ contentId: 1, timestamp: 1 });
danmakuSchema.index({ userId: 1 });
danmakuSchema.index({ contentId: 1, status: 1 });

// 实例方法：举报弹幕
danmakuSchema.methods.report = async function(userId, reason) {
    const existingReport = this.reports.find(r => r.userId.toString() === userId.toString());
    
    if (!existingReport) {
        this.reports.push({ userId, reason });
        
        // 如果举报数量超过阈值，标记弹幕
        if (this.reports.length >= 3) {
            this.status = 'flagged';
        }
        
        await this.save();
    }
};

// 静态方法：获取弹幕列表
danmakuSchema.statics.getDanmakuList = async function(contentId, options = {}) {
    const { 
        startTime = 0, 
        endTime = Infinity,
        status = 'active',
        limit = 1000 
    } = options;
    
    const danmakus = await this.find({
        contentId,
        timestamp: { $gte: startTime, $lte: endTime },
        status
    })
    .sort('timestamp')
    .limit(limit)
    .populate('userId', 'username')
    .lean();
    
    return danmakus;
};

// 静态方法：获取弹幕密度分布
danmakuSchema.statics.getDanmakuDensity = async function(contentId, interval = 10) {
    const result = await this.aggregate([
        { $match: { contentId: mongoose.Types.ObjectId(contentId), status: 'active' } },
        { $group: {
            _id: { $floor: { $divide: ['$timestamp', interval] } },
            count: { $sum: 1 },
            timestamp: { $first: { $multiply: [{ $floor: { $divide: ['$timestamp', interval] } }, interval] } }
        }},
        { $sort: { timestamp: 1 } }
    ]);
    
    return result;
};

// 静态方法：获取热门弹幕
danmakuSchema.statics.getPopularDanmakus = async function(contentId, limit = 10) {
    return await this.find({
        contentId,
        status: 'active'
    })
    .sort('-likes')
    .limit(limit)
    .populate('userId', 'username')
    .lean();
};

// 静态方法：批量发送弹幕（用于导入）
danmakuSchema.statics.bulkCreate = async function(danmakus) {
    return await this.insertMany(danmakus, { ordered: false });
};

module.exports = mongoose.model('Danmaku', danmakuSchema);