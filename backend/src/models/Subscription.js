// models/Subscription.js
const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    // 用户ID
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // 订阅计划ID
    planId: {
        type: String,
        required: true
    },
    
    // 计划名称
    planName: {
        type: String,
        required: true
    },
    
    // 计划价格
    planPrice: {
        type: Number,
        required: true
    },
    
    // 计划时长（天）
    planDuration: {
        type: Number,
        required: true
    },
    
    // 订阅状态
    status: {
        type: String,
        enum: ['active', 'expired', 'cancelled', 'paused'],
        default: 'active'
    },
    
    // 开始日期
    startDate: {
        type: Date,
        default: Date.now
    },
    
    // 结束日期
    endDate: {
        type: Date,
        required: true
    },
    
    // 是否自动续费
    autoRenew: {
        type: Boolean,
        default: true
    },
    
    // 下次计费日期
    nextBillingDate: Date,
    
    // 取消日期
    cancelledAt: Date,
    
    // 最后一次订单ID
    lastOrderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },
    
    // 支付方式
    paymentMethod: {
        type: String,
        enum: ['alipay', 'wechat', 'stripe', 'apple_pay', 'apple_iap']
    },
    
    // 订阅历史
    history: [{
        action: {
            type: String,
            enum: ['created', 'renewed', 'cancelled', 'expired', 'paused', 'resumed']
        },
        date: {
            type: Date,
            default: Date.now
        },
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order'
        },
        note: String
    }]
}, {
    timestamps: true
});

// 索引
subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ endDate: 1 });

// 实例方法：检查是否有效
subscriptionSchema.methods.isActive = function() {
    return this.status === 'active' && this.endDate > new Date();
};

// 实例方法：续订
subscriptionSchema.methods.renew = async function(orderId) {
    // 计算新的结束日期
    const newEndDate = new Date(this.endDate);
    
    // 如果已过期，从当前日期开始计算
    if (newEndDate < new Date()) {
        newEndDate.setTime(Date.now());
    }
    
    // 添加订阅时长
    newEndDate.setDate(newEndDate.getDate() + this.planDuration);
    
    this.endDate = newEndDate;
    this.status = 'active';
    this.lastOrderId = orderId;
    
    // 更新下次计费日期（如果启用自动续费）
    if (this.autoRenew) {
        this.nextBillingDate = new Date(newEndDate);
        this.nextBillingDate.setDate(this.nextBillingDate.getDate() - 1); // 提前1天
    }
    
    // 添加续订记录
    this.history.push({
        action: 'renewed',
        date: new Date(),
        orderId
    });
    
    await this.save();
};

// 实例方法：取消订阅
subscriptionSchema.methods.cancel = async function() {
    this.autoRenew = false;
    this.cancelledAt = new Date();
    
    // 订阅依然有效，直到到期
    if (this.endDate > new Date()) {
        this.status = 'cancelled';
    } else {
        this.status = 'expired';
    }
    
    // 添加取消记录
    this.history.push({
        action: 'cancelled',
        date: new Date()
    });
    
    await this.save();
};

// 实例方法：暂停订阅
subscriptionSchema.methods.pause = async function(reason) {
    this.status = 'paused';
    
    // 添加暂停记录
    this.history.push({
        action: 'paused',
        date: new Date(),
        note: reason
    });
    
    await this.save();
};

// 实例方法：恢复订阅
subscriptionSchema.methods.resume = async function() {
    // 检查是否已过期
    if (this.endDate < new Date()) {
        throw new Error('订阅已过期，请重新订阅');
    }
    
    this.status = 'active';
    
    // 添加恢复记录
    this.history.push({
        action: 'resumed',
        date: new Date()
    });
    
    await this.save();
};

// 静态方法：检查用户的订阅状态
subscriptionSchema.statics.checkUserSubscription = async function(userId) {
    const subscription = await this.findOne({
        userId,
        status: 'active',
        endDate: { $gt: new Date() }
    });
    
    return !!subscription;
};

module.exports = mongoose.model('Subscription', subscriptionSchema);