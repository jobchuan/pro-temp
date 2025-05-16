// models/CreatorIncome.js
const mongoose = require('mongoose');
const { RevenueSharing } = require('../config/payment');

const creatorIncomeSchema = new mongoose.Schema({
    // 创作者ID
    creatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // 收入来源
    source: {
        type: String,
        enum: ['content_sale', 'tip', 'subscription_share'],
        required: true
    },
    
    // 订单ID
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    
    // 内容ID（如果是内容销售）
    contentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Content'
    },
    
    // 总金额
    totalAmount: {
        type: Number,
        required: true
    },
    
    // 平台费用
    platformFee: {
        type: Number,
        required: true
    },
    
    // 净收入
    netAmount: {
        type: Number,
        required: true
    },
    
    // 分成比例
    sharingRatio: {
        type: Number,
        required: true
    },
    
    // 提现状态
    withdrawStatus: {
        type: String,
        enum: ['pending', 'withdrawable', 'processing', 'withdrawn', 'failed'],
        default: 'pending'
    },
    
    // 结算周期
    settlementPeriod: {
        year: Number,
        month: Number,
        startDate: Date,
        endDate: Date
    },
    
    // 提现请求
    withdrawal: {
        requestedAt: Date,
        processedAt: Date,
        method: {
            type: String,
            enum: ['alipay', 'wechat', 'bank_transfer']
        },
        account: String,
        batchId: String,
        status: String
    },
    
    // 描述
    description: String,
    
    // 创建时间
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// 索引
creatorIncomeSchema.index({ creatorId: 1, createdAt: -1 });
creatorIncomeSchema.index({ orderId: 1 });
creatorIncomeSchema.index({ 'settlementPeriod.year': 1, 'settlementPeriod.month': 1 });
creatorIncomeSchema.index({ withdrawStatus: 1 });

// 实例方法：请求提现
creatorIncomeSchema.methods.requestWithdrawal = async function(method, account) {
    if (this.withdrawStatus !== 'withdrawable') {
        throw new Error('当前收入不可提现');
    }
    
    this.withdrawStatus = 'processing';
    this.withdrawal = {
        requestedAt: new Date(),
        method,
        account,
        status: 'processing'
    };
    
    await this.save();
};

// 实例方法：完成提现
creatorIncomeSchema.methods.completeWithdrawal = async function(batchId) {
    if (this.withdrawStatus !== 'processing') {
        throw new Error('提现尚未处理');
    }
    
    this.withdrawStatus = 'withdrawn';
    this.withdrawal.processedAt = new Date();
    this.withdrawal.batchId = batchId;
    this.withdrawal.status = 'completed';
    
    await this.save();
};

// 静态方法：计算月收入
creatorIncomeSchema.statics.calculateMonthlyIncome = async function(creatorId, year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const result = await this.aggregate([
        {
            $match: {
                creatorId: mongoose.Types.ObjectId(creatorId),
                'settlementPeriod.year': year,
                'settlementPeriod.month': month
            }
        },
        {
            $group: {
                _id: '$source',
                totalAmount: { $sum: '$totalAmount' },
                platformFee: { $sum: '$platformFee' },
                netAmount: { $sum: '$netAmount' },
                count: { $sum: 1 }
            }
        }
    ]);
    
    // 计算总计
    const totalIncome = {
        totalAmount: 0,
        platformFee: 0,
        netAmount: 0,
        count: 0
    };
    
    result.forEach(source => {
        totalIncome.totalAmount += source.totalAmount;
        totalIncome.platformFee += source.platformFee;
        totalIncome.netAmount += source.netAmount;
        totalIncome.count += source.count;
    });
    
    return {
        sources: result,
        total: totalIncome,
        period: {
            year,
            month,
            startDate,
            endDate
        }
    };
};

// 静态方法：获取可提现余额
creatorIncomeSchema.statics.getWithdrawableBalance = async function(creatorId) {
    const result = await this.aggregate([
        {
            $match: {
                creatorId: mongoose.Types.ObjectId(creatorId),
                withdrawStatus: 'withdrawable'
            }
        },
        {
            $group: {
                _id: null,
                balance: { $sum: '$netAmount' }
            }
        }
    ]);
    
    return result.length > 0 ? result[0].balance : 0;
};

// 静态方法：更新为可提现状态
creatorIncomeSchema.statics.updateToWithdrawable = async function() {
    // 查找满足结算条件的收入
    const minDate = new Date();
    minDate.setDate(minDate.getDate() - 30); // 30天后可提现
    
    const result = await this.updateMany(
        {
            withdrawStatus: 'pending',
            createdAt: { $lt: minDate }
        },
        {
            $set: { withdrawStatus: 'withdrawable' }
        }
    );
    
    return result.nModified || 0;
};

module.exports = mongoose.model('CreatorIncome', creatorIncomeSchema);