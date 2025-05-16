// models/UserInteraction.js
const mongoose = require('mongoose');

const userInteractionSchema = new mongoose.Schema({
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
    
    // 交互类型
    type: {
        type: String,
        enum: ['like', 'favorite', 'view', 'share', 'download'],
        required: true
    },
    
    // 状态（用于点赞和收藏的开关）
    isActive: {
        type: Boolean,
        default: true
    },
    
    // 创建时间
    createdAt: {
        type: Date,
        default: Date.now
    },
    
    // 更新时间
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// 复合索引，确保用户对同一内容的交互唯一
userInteractionSchema.index({ userId: 1, contentId: 1, type: 1 }, { unique: true });

// 静态方法：切换交互状态（点赞/取消点赞，收藏/取消收藏）
userInteractionSchema.statics.toggleInteraction = async function(userId, contentId, type) {
    const existingInteraction = await this.findOne({ userId, contentId, type });
    
    if (existingInteraction) {
        // 切换状态
        existingInteraction.isActive = !existingInteraction.isActive;
        existingInteraction.updatedAt = new Date();
        await existingInteraction.save();
        
        // 更新内容统计
        const Content = require('./Content');
        const statField = type === 'like' ? 'likes' : type === 'favorite' ? 'favorites' : type;
        const increment = existingInteraction.isActive ? 1 : -1;
        
        await Content.findByIdAndUpdate(contentId, {
            $inc: { [`stats.${statField}`]: increment }
        });
        
        return existingInteraction;
    } else {
        // 创建新交互
        const interaction = await this.create({
            userId,
            contentId,
            type,
            isActive: true
        });
        
        // 更新内容统计
        const Content = require('./Content');
        const statField = type === 'like' ? 'likes' : type === 'favorite' ? 'favorites' : type;
        
        await Content.findByIdAndUpdate(contentId, {
            $inc: { [`stats.${statField}`]: 1 }
        });
        
        return interaction;
    }
};

// 实例方法：获取用户对内容的交互状态
userInteractionSchema.statics.getUserInteractions = async function(userId, contentId) {
    const interactions = await this.find({
        userId,
        contentId,
        isActive: true
    });
    
    const result = {
        liked: false,
        favorited: false
    };
    
    interactions.forEach(interaction => {
        if (interaction.type === 'like') result.liked = true;
        if (interaction.type === 'favorite') result.favorited = true;
    });
    
    return result;
};

module.exports = mongoose.model('UserInteraction', userInteractionSchema);