// controllers/paymentController.js
const PaymentService = require('../services/paymentService');
const appleIAPService = require('../services/appleIAPService');
const Order = require('../models/Order');
const Subscription = require('../models/Subscription');
const CreatorIncome = require('../models/CreatorIncome');
const { SubscriptionPlans } = require('../config/payment');

// 创建订阅订单
const createSubscriptionOrder = async (req, res) => {
    try {
        const { planId, paymentMethod } = req.body;
        const userId = req.userId;
        
        // 验证订阅计划
        const plan = SubscriptionPlans[planId.toUpperCase()];
        if (!plan) {
            return res.status(400).json({
                error: '无效的订阅计划',
                message: '请选择有效的订阅计划'
            });
        }
        
        // 检查是否已有有效订阅
        const existingSubscription = await Subscription.findOne({
            userId,
            status: 'active'
        });
        
        if (existingSubscription && existingSubscription.isActive()) {
            return res.status(400).json({
                error: '订阅冲突',
                message: '您已有有效的订阅'
            });
        }
        
        // 创建订单
        const { order, paymentParams } = await PaymentService.createPaymentOrder(
            userId,
            'subscription',
            null,
            plan.price,
            paymentMethod,
            plan.name,
            { plan }
        );
        
        res.json({
            success: true,
            data: {
                orderNo: order.orderNo,
                amount: order.amount,
                paymentParams
            }
        });
    } catch (error) {
        console.error('创建订阅订单错误:', error);
        res.status(500).json({
            error: '服务器错误',
            message: error.message
        });
    }
};

// 创建内容购买订单
const createContentOrder = async (req, res) => {
    try {
        const { contentId, paymentMethod } = req.body;
        const userId = req.userId;
        
        // 检查内容是否存在
        const content = await Content.findById(contentId);
        if (!content) {
            return res.status(404).json({
                error: '内容不存在',
                message: '请选择有效的内容'
            });
        }
        
        // 检查是否已购买
        const existingOrder = await Order.findOne({
            userId,
            orderType: 'content',
            relatedId: contentId,
            paymentStatus: 'paid'
        });
        
        if (existingOrder) {
            return res.status(400).json({
                error: '重复购买',
                message: '您已购买过此内容'
            });
        }
        
        // 创建订单
        const { order, paymentParams } = await PaymentService.createPaymentOrder(
            userId,
            'content',
            contentId,
            content.pricing.price,
            paymentMethod,
            content.title['zh-CN'] || content.title['en-US']
        );
        
        res.json({
            success: true,
            data: {
                orderNo: order.orderNo,
                amount: order.amount,
                paymentParams
            }
        });
    } catch (error) {
        console.error('创建内容购买订单错误:', error);
        res.status(500).json({
            error: '服务器错误',
            message: error.message
        });
    }
};

// 创建打赏订单
const createTipOrder = async (req, res) => {
    try {
        const { creatorId, amount, paymentMethod } = req.body;
        const userId = req.userId;
        
        // 验证金额
        if (amount < 1) {
            return res.status(400).json({
                error: '金额错误',
                message: '打赏金额至少为1元'
            });
        }
        
        // 检查创作者是否存在
        const creator = await User.findById(creatorId);
        if (!creator || creator.role !== 'creator') {
            return res.status(404).json({
                error: '创作者不存在',
                message: '请选择有效的创作者'
            });
        }
        
        // 创建订单
        const { order, paymentParams } = await PaymentService.createPaymentOrder(
            userId,
            'tip',
            creatorId,
            amount,
            paymentMethod,
            `打赏给 ${creator.username}`
        );
        
        res.json({
            success: true,
            data: {
                orderNo: order.orderNo,
                amount: order.amount,
                paymentParams
            }
        });
    } catch (error) {
        console.error('创建打赏订单错误:', error);
        res.status(500).json({
            error: '服务器错误',
            message: error.message
        });
    }
};

// 支付回调（支付宝）
const alipayCallback = async (req, res) => {
    try {
        const order = await PaymentService.handlePaymentCallback('alipay', req.body);
        
        if (order) {
            res.send('success');
        } else {
            res.send('fail');
        }
    } catch (error) {
        console.error('支付宝回调处理错误:', error);
        res.send('fail');
    }
};

// 支付回调（微信）
const wechatCallback = async (req, res) => {
    try {
        const order = await PaymentService.handlePaymentCallback('wechat', req.body);
        
        if (order) {
            res.json({ code: 'SUCCESS', message: '成功' });
        } else {
            res.json({ code: 'FAIL', message: '失败' });
        }
    } catch (error) {
        console.error('微信支付回调处理错误:', error);
        res.json({ code: 'FAIL', message: error.message });
    }
};

// 支付回调（Stripe）
const stripeCallback = async (req, res) => {
    try {
        const order = await PaymentService.handlePaymentCallback('stripe', {
            body: req.rawBody,
            headers: req.headers
        });
        
        res.json({ received: true });
    } catch (error) {
        console.error('Stripe回调处理错误:', error);
        res.status(400).json({ error: error.message });
    }
};

// 查询订单状态
const queryOrderStatus = async (req, res) => {
    try {
        const { orderNo } = req.params;
        const order = await PaymentService.queryOrderStatus(orderNo);
        
        res.json({
            success: true,
            data: {
                orderNo: order.orderNo,
                status: order.paymentStatus,
                amount: order.amount,
                paidAt: order.paidAt
            }
        });
    } catch (error) {
        console.error('查询订单状态错误:', error);
        res.status(404).json({
            error: '订单不存在',
            message: error.message
        });
    }
};

// 获取用户订单列表
const getUserOrders = async (req, res) => {
    try {
        const { page = 1, limit = 20, orderType, status } = req.query;
        const userId = req.userId;
        
        const query = { userId };
        if (orderType) query.orderType = orderType;
        if (status) query.paymentStatus = status;
        
        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('relatedId');
        
        const total = await Order.countDocuments(query);
        
        res.json({
            success: true,
            data: {
                orders,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('获取订单列表错误:', error);
        res.status(500).json({
            error: '服务器错误',
            message: error.message
        });
    }
};

// 获取用户订阅信息
const getUserSubscription = async (req, res) => {
    try {
        const userId = req.userId;
        
        const subscription = await Subscription.findOne({
            userId,
            status: { $in: ['active', 'cancelled'] }
        }).sort({ createdAt: -1 });
        
        if (!subscription) {
            return res.json({
                success: true,
                data: {
                    hasSubscription: false
                }
            });
        }
        
        res.json({
            success: true,
            data: {
                hasSubscription: true,
                subscription: {
                    planId: subscription.planId,
                    planName: subscription.planName,
                    status: subscription.status,
                    startDate: subscription.startDate,
                    endDate: subscription.endDate,
                    autoRenew: subscription.autoRenew,
                    isActive: subscription.isActive()
                }
            }
        });
    } catch (error) {
        console.error('获取订阅信息错误:', error);
        res.status(500).json({
            error: '服务器错误',
            message: error.message
        });
    }
};

// 取消订阅
const cancelSubscription = async (req, res) => {
    try {
        const userId = req.userId;
        
        const subscription = await Subscription.findOne({
            userId,
            status: 'active'
        });
        
        if (!subscription) {
            return res.status(404).json({
                error: '订阅不存在',
                message: '未找到有效订阅'
            });
        }
        
        await subscription.cancel();
        
        res.json({
            success: true,
            message: '订阅已取消',
            data: {
                endDate: subscription.endDate
            }
        });
    } catch (error) {
        console.error('取消订阅错误:', error);
        res.status(500).json({
            error: '服务器错误',
            message: error.message
        });
    }
};

// 获取创作者收入统计
const getCreatorIncome = async (req, res) => {
    try {
        const creatorId = req.userId;
        const { year, month } = req.query;
        
        // 获取月收入统计
        const monthlyIncome = await CreatorIncome.calculateMonthlyIncome(
            creatorId,
            parseInt(year) || new Date().getFullYear(),
            parseInt(month) || new Date().getMonth() + 1
        );
        
        // 获取可提现余额
        const withdrawableBalance = await CreatorIncome.getWithdrawableBalance(creatorId);
        
        res.json({
            success: true,
            data: {
                monthlyIncome,
                withdrawableBalance
            }
        });
    } catch (error) {
        console.error('获取创作者收入错误:', error);
        res.status(500).json({
            error: '服务器错误',
            message: error.message
        });
    }
};

// 申请提现
const requestWithdrawal = async (req, res) => {
    try {
        const creatorId = req.userId;
        const { method, account } = req.body;
        
        // 获取可提现余额
        const balance = await CreatorIncome.getWithdrawableBalance(creatorId);
        
        if (balance < 100) {
            return res.status(400).json({
                error: '余额不足',
                message: '可提现余额不足100元'
            });
        }
        
        // 获取所有可提现的收入记录
        const incomes = await CreatorIncome.find({
            creatorId,
            withdrawStatus: 'withdrawable'
        });
        
        // 更新提现状态
        for (const income of incomes) {
            await income.requestWithdrawal(method, account);
        }
        
        res.json({
            success: true,
            message: '提现申请已提交',
            data: {
                amount: balance,
                method,
                account
            }
        });
    } catch (error) {
        console.error('申请提现错误:', error);
        res.status(500).json({
            error: '服务器错误',
            message: error.message
        });
    }
};

// Apple内购验证
const verifyAppleIAP = async (req, res) => {
    try {
        const { receiptData, productId } = req.body;
        const userId = req.userId;
        
        if (!receiptData || !productId) {
            return res.status(400).json({
                error: '参数错误',
                message: '缺少收据数据或产品ID'
            });
        }
        
        const result = await appleIAPService.processTransaction(userId, receiptData, productId);
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Apple内购验证错误:', error);
        res.status(400).json({
            error: '验证失败',
            message: error.message
        });
    }
};

// Apple订阅通知
const appleSubscriptionNotification = async (req, res) => {
    try {
        const notification = req.body;
        
        await appleIAPService.processSubscriptionNotification(notification);
        
        res.sendStatus(200);
    } catch (error) {
        console.error('Apple订阅通知处理错误:', error);
        res.sendStatus(500);
    }
};

// 恢复Apple内购
const restoreAppleIAP = async (req, res) => {
    try {
        const { receiptData } = req.body;
        const userId = req.userId;
        
        if (!receiptData) {
            return res.status(400).json({
                error: '参数错误',
                message: '缺少收据数据'
            });
        }
        
        const result = await appleIAPService.restorePurchases(userId, receiptData);
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('恢复购买错误:', error);
        res.status(400).json({
            error: '恢复失败',
            message: error.message
        });
    }
};

module.exports = {
    createSubscriptionOrder,
    createContentOrder,
    createTipOrder,
    alipayCallback,
    wechatCallback,
    stripeCallback,
    queryOrderStatus,
    getUserOrders,
    getUserSubscription,
    cancelSubscription,
    getCreatorIncome,
    requestWithdrawal,
    verifyAppleIAP,
    appleSubscriptionNotification,
    restoreAppleIAP
};
