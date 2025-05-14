// models/Order.js
const mongoose = require('mongoose');
const crypto = require('crypto');

const orderSchema = new mongoose.Schema({
    // 订单编号
    orderNo: {
        type: String,
        required: true,
        unique: true
    },
    
    // 用户ID
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // 订单类型
    orderType: {
        type: String,
        enum: ['subscription', 'content', 'tip'],
        required: true
    },
    
    // 关联ID（内容ID、创作者ID等）
    relatedId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'orderType'
    },
    
    // 金额
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    
    // 货币
    currency: {
        type: String,
        default: 'CNY'
    },
    
    // 支付方式
    paymentMethod: {
        type: String,
        enum: ['alipay', 'wechat', 'stripe', 'apple_pay', 'apple_iap'],
        required: true
    },
    
    // 支付状态
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'cancelled', 'refunded'],
        default: 'pending'
    },
    
    // 订单描述
    description: String,
    
    // 交易ID（第三方支付平台的交易ID）
    transactionId: String,
    
    // 支付时间
    paidAt: Date,
    
    // 过期时间
    expiredAt: Date,
    
    // 收入分成信息
    revenue: {
        creatorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        creatorAmount: Number, // 创作者收入
        platformAmount: Number, // 平台收入
        sharingRatio: Number   // 分成比例
    },
    
    // 退款信息
    refund: {
        amount: Number,
        reason: String,
        requestedAt: Date,
        processedAt: Date,
        status: {
            type: String,
            enum: ['pending', 'processed', 'rejected']
        }
    },
    
    // 元数据（存储支付平台特定的信息）
    metadata: mongoose.Schema.Types.Mixed,
    
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

// 索引
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ orderNo: 1 }, { unique: true });
orderSchema.index({ orderType: 1, relatedId: 1 });
orderSchema.index({ paymentStatus: 1 });

// 静态方法：生成订单编号
orderSchema.statics.generateOrderNo = function() {
    // 生成时间戳 + 随机字符的订单号
    const timestamp = Date.now().toString();
    const randomStr = crypto.randomBytes(4).toString('hex');
    return `${timestamp}${randomStr}`;
};

// 实例方法：标记为已支付
orderSchema.methods.markAsPaid = async function(transactionId) {
    this.paymentStatus = 'paid';
    this.transactionId = transactionId;
    this.paidAt = new Date();
    await this.save();
};

// 实例方法：处理退款
orderSchema.methods.processRefund = async function(amount, reason) {
    // 检查退款金额
    if (amount > this.amount) {
        throw new Error('退款金额不能大于订单金额');
    }
    
    // 创建退款请求
    this.refund = {
        amount,
        reason,
        requestedAt: new Date(),
        status: 'pending'
    };
    
    await this.save();
};

// 实例方法：完成退款
orderSchema.methods.completeRefund = async function() {
    this.refund.status = 'processed';
    this.refund.processedAt = new Date();
    this.paymentStatus = 'refunded';
    
    await this.save();
};

module.exports = mongoose.model('Order', orderSchema);