// services/paymentService.js
const Order = require('../models/Order');
const Subscription = require('../models/Subscription');
const CreatorIncome = require('../models/CreatorIncome');
const Content = require('../models/Content');
const User = require('../models/User');
const { alipaySdk, wechatpay, stripe, PaymentMethods } = require('../config/payment');
const crypto = require('crypto');

class PaymentService {
    // 创建Apple内购参数
    static async createAppleIAPParams(order) {
        const { AppleIAPProducts, SubscriptionPlans } = require('../config/payment');
        
        let productId;
        
        if (order.orderType === 'subscription') {
            // 获取订阅计划的Apple产品ID
            const plan = order.metadata.plan;
            productId = plan.appleProductId;
        } else if (order.orderType === 'content') {
            // 内容购买的产品ID
            productId = AppleIAPProducts.CONTENT_PREFIX + order.relatedId;
        }
        
        return {
            method: 'apple_iap',
            productId,
            orderNo: order.orderNo
        };
    }
    // 创建支付订单
    static async createPaymentOrder(userId, orderType, relatedId, amount, paymentMethod, description, metadata = {}) {
        const orderNo = Order.generateOrderNo();
        
        const order = new Order({
            orderNo,
            userId,
            orderType,
            relatedId,
            amount,
            paymentMethod,
            description,
            expiredAt: new Date(Date.now() + 30 * 60 * 1000), // 30分钟过期
            metadata
        });
        
        // 如果是内容购买，记录分成信息
        if (orderType === 'content') {
            const content = await Content.findById(relatedId).populate('creatorId');
            if (content) {
                const creator = content.creatorId;
                const sharingRatio = creator.creatorInfo?.sharingRatio || 0.7;
                
                order.revenue = {
                    creatorId: creator._id,
                    creatorAmount: amount * sharingRatio,
                    platformAmount: amount * (1 - sharingRatio),
                    sharingRatio
                };
            }
        }
        
        await order.save();
        
        // 根据支付方式创建支付参数
        let paymentParams = {};
        
        switch (paymentMethod) {
            case PaymentMethods.ALIPAY:
                paymentParams = await this.createAlipayParams(order);
                break;
            case PaymentMethods.WECHAT:
                paymentParams = await this.createWechatParams(order);
                break;
            case PaymentMethods.STRIPE:
                paymentParams = await this.createStripeParams(order);
                break;
            case PaymentMethods.APPLE_IAP:
                paymentParams = await this.createAppleIAPParams(order);
                break;
        }
        
        return {
            order,
            paymentParams
        };
    }
    
    // 创建支付宝支付参数
    static async createAlipayParams(order) {
        if (!alipaySdk) {
            throw new Error('支付宝支付暂时不可用');
        }
        
        const bizContent = {
            out_trade_no: order.orderNo,
            product_code: 'QUICK_MSECURITY_PAY',
            total_amount: order.amount,
            subject: order.description,
            body: order.description,
            timeout_express: '30m'
        };
        
        const params = {
            method: 'alipay.trade.app.pay',
            bizContent,
            notify_url: process.env.ALIPAY_NOTIFY_URL
        };
        
        const orderStr = await alipaySdk.sdkExecute(params);
        
        return {
            method: 'alipay',
            orderStr
        };
    }
    
    // 创建微信支付参数
    static async createWechatParams(order) {
        if (!wechatpay) {
            throw new Error('微信支付暂时不可用');
        }
        
        const params = {
            appid: process.env.WECHAT_APP_ID,
            mchid: process.env.WECHAT_MCH_ID,
            description: order.description,
            out_trade_no: order.orderNo,
            time_expire: new Date(order.expiredAt).toISOString(),
            notify_url: process.env.WECHAT_NOTIFY_URL,
            amount: {
                total: Math.round(order.amount * 100), // 转换为分
                currency: 'CNY'
            }
        };
        
        const result = await wechatpay.transactions_app(params);
        
        return {
            method: 'wechat',
            ...result
        };
    }
    
    // 创建Stripe支付参数
    static async createStripeParams(order) {
        if (!stripe) {
            throw new Error('Stripe支付暂时不可用');
        }
        
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(order.amount * 100), // 转换为分
            currency: order.currency.toLowerCase(),
            metadata: {
                orderNo: order.orderNo,
                userId: order.userId.toString(),
                orderType: order.orderType
            }
        });
        
        return {
            method: 'stripe',
            clientSecret: paymentIntent.client_secret,
            publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
        };
    }
    
    // 处理支付回调
    static async handlePaymentCallback(paymentMethod, data) {
        let order;
        
        switch (paymentMethod) {
            case PaymentMethods.ALIPAY:
                order = await this.handleAlipayCallback(data);
                break;
            case PaymentMethods.WECHAT:
                order = await this.handleWechatCallback(data);
                break;
            case PaymentMethods.STRIPE:
                order = await this.handleStripeCallback(data);
                break;
        }
        
        if (order && order.paymentStatus === 'paid') {
            // 处理订单完成后的业务逻辑
            await this.processOrderCompletion(order);
        }
        
        return order;
    }
    
    // 处理支付宝回调
    static async handleAlipayCallback(data) {
        // 验证签名
        const isValid = await alipaySdk.checkNotifySign(data);
        if (!isValid) {
            throw new Error('支付宝签名验证失败');
        }
        
        const { out_trade_no, trade_no, trade_status } = data;
        
        const order = await Order.findOne({ orderNo: out_trade_no });
        if (!order) {
            throw new Error('订单不存在');
        }
        
        if (trade_status === 'TRADE_SUCCESS' || trade_status === 'TRADE_FINISHED') {
            await order.markAsPaid(trade_no);
        }
        
        return order;
    }
    
    // 处理微信支付回调
    static async handleWechatCallback(data) {
        // 解密和验证数据
        const decryptedData = await wechatpay.decipher(data);
        
        const { out_trade_no, transaction_id, trade_state } = decryptedData;
        
        const order = await Order.findOne({ orderNo: out_trade_no });
        if (!order) {
            throw new Error('订单不存在');
        }
        
        if (trade_state === 'SUCCESS') {
            await order.markAsPaid(transaction_id);
        }
        
        return order;
    }
    
    // 处理Stripe回调
    static async handleStripeCallback(data) {
        const event = stripe.webhooks.constructEvent(
            data.body,
            data.headers['stripe-signature'],
            process.env.STRIPE_WEBHOOK_SECRET
        );
        
        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object;
            const { orderNo } = paymentIntent.metadata;
            
            const order = await Order.findOne({ orderNo });
            if (!order) {
                throw new Error('订单不存在');
            }
            
            await order.markAsPaid(paymentIntent.id);
            return order;
        }
        
        return null;
    }
    
    // 处理订单完成后的业务逻辑
    static async processOrderCompletion(order) {
        switch (order.orderType) {
            case 'subscription':
                await this.activateSubscription(order);
                break;
            case 'content':
                await this.processContentPurchase(order);
                break;
            case 'tip':
                await this.processTip(order);
                break;
        }
    }
    
    // 激活订阅
    static async activateSubscription(order) {
        // 查找或创建订阅
        let subscription = await Subscription.findOne({
            userId: order.userId,
            status: { $in: ['active', 'expired'] }
        });
        
        const plan = order.metadata.plan;
        
        if (subscription) {
            // 续费
            await subscription.renew(order._id);
        } else {
            // 新订阅
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + plan.duration);
            
            subscription = new Subscription({
                userId: order.userId,
                planId: plan.id,
                planName: plan.name,
                planPrice: plan.price,
                planDuration: plan.duration,
                endDate,
                lastOrderId: order._id,
                paymentMethod: order.paymentMethod,
                history: [{
                    action: 'created',
                    date: new Date(),
                    orderId: order._id
                }]
            });
            
            await subscription.save();
        }
        
        // 更新用户的订阅状态
        await User.findByIdAndUpdate(order.userId, {
            subscription_status: 'premium'
        });
    }
    
    // 处理内容购买
    static async processContentPurchase(order) {
        // 记录创作者收入
        if (order.revenue) {
            const income = new CreatorIncome({
                creatorId: order.revenue.creatorId,
                source: 'content_sale',
                orderId: order._id,
                contentId: order.relatedId,
                totalAmount: order.amount,
                platformFee: order.revenue.platformAmount,
                netAmount: order.revenue.creatorAmount,
                sharingRatio: order.revenue.sharingRatio,
                withdrawStatus: 'pending',
                settlementPeriod: {
                    year: new Date().getFullYear(),
                    month: new Date().getMonth() + 1,
                    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
                },
                description: `内容《${order.description}》销售收入`
            });
            
            await income.save();
            
            // 更新创作者统计
            await User.findByIdAndUpdate(order.revenue.creatorId, {
                $inc: {
                    'creatorInfo.totalEarnings': order.revenue.creatorAmount
                }
            });
        }
    }
    
    // 处理打赏
    static async processTip(order) {
        const creatorId = order.relatedId;
        const tipAmount = order.amount;
        const platformFee = tipAmount * 0.1; // 平台收取10%手续费
        const netAmount = tipAmount - platformFee;
        
        const income = new CreatorIncome({
            creatorId,
            source: 'tip',
            orderId: order._id,
            totalAmount: tipAmount,
            platformFee,
            netAmount,
            sharingRatio: 0.9,
            withdrawStatus: 'pending',
            settlementPeriod: {
                year: new Date().getFullYear(),
                month: new Date().getMonth() + 1,
                startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
            },
            description: '用户打赏'
        });
        
        await income.save();
        
        // 更新创作者统计
        await User.findByIdAndUpdate(creatorId, {
            $inc: {
                'creatorInfo.totalEarnings': netAmount
            }
        });
    }
    
    // 查询订单状态
    static async queryOrderStatus(orderNo) {
        const order = await Order.findOne({ orderNo });
        if (!order) {
            throw new Error('订单不存在');
        }
        
        return order;
    }
    
    // 申请退款
    static async requestRefund(orderNo, amount, reason) {
        const order = await Order.findOne({ orderNo });
        if (!order) {
            throw new Error('订单不存在');
        }
        
        if (order.paymentStatus !== 'paid') {
            throw new Error('订单未支付，无法退款');
        }
        
        await order.processRefund(amount, reason);
        
        // TODO: 调用第三方支付接口进行退款
        
        return order;
    }
}

module.exports = PaymentService;
