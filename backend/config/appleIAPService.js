// services/appleIAPService.js
const appleReceiptVerify = require('node-apple-receipt-verify');
const { paymentConfig, AppleIAPProducts } = require('../config/payment');
const Order = require('../models/Order');

class AppleIAPService {
    constructor() {
        // 配置Apple收据验证
        appleReceiptVerify.config({
            secret: paymentConfig.appleIAP.sharedSecret,
            environment: [paymentConfig.appleIAP.environment],
            excludeOldTransactions: true,
            extended: true
        });
    }

    // 验证收据
    async verifyReceipt(receiptData) {
        try {
            const products = await appleReceiptVerify.validate({
                device: receiptData,
                ignoreExpired: true,
                extended: true
            });

            return {
                valid: true,
                products: products
            };
        } catch (error) {
            console.error('Apple收据验证失败:', error);
            return {
                valid: false,
                error: error.message
            };
        }
    }

    // 处理内购交易
    async processTransaction(userId, receiptData, productId) {
        try {
            // 验证收据
            const verification = await this.verifyReceipt(receiptData);
            
            if (!verification.valid) {
                throw new Error('收据验证失败: ' + verification.error);
            }

            // 查找对应的产品
            const product = verification.products.find(p => p.productId === productId);
            
            if (!product) {
                throw new Error('未找到对应的产品');
            }

            // 检查交易是否已处理
            const existingOrder = await Order.findOne({
                'metadata.appleTransactionId': product.transactionId
            });

            if (existingOrder) {
                return {
                    success: true,
                    message: '交易已处理',
                    order: existingOrder
                };
            }

            // 确定订单类型和金额
            let orderType, relatedId, amount, description;
            
            if (this.isSubscriptionProduct(productId)) {
                orderType = 'subscription';
                const plan = this.getPlanByProductId(productId);
                amount = plan.price;
                description = plan.name;
            } else if (this.isContentProduct(productId)) {
                orderType = 'content';
                relatedId = this.extractContentId(productId);
                // 从产品信息中获取价格（需要从App Store Connect配置）
                amount = this.getContentPrice(product);
                description = '内容购买';
            }

            // 创建订单
            const order = new Order({
                orderNo: Order.generateOrderNo(),
                userId,
                orderType,
                relatedId,
                amount,
                paymentMethod: 'apple_iap',
                paymentStatus: 'paid',
                transactionId: product.transactionId,
                description,
                paidAt: new Date(product.purchaseDate),
                metadata: {
                    appleProductId: productId,
                    appleTransactionId: product.transactionId,
                    applePurchaseInfo: product
                }
            });

            await order.save();

            // 处理订单完成后的业务逻辑
            const PaymentService = require('./paymentService');
            await PaymentService.processOrderCompletion(order);

            return {
                success: true,
                message: '交易处理成功',
                order
            };
        } catch (error) {
            console.error('处理Apple内购交易失败:', error);
            throw error;
        }
    }

    // 处理订阅续费通知
    async processSubscriptionNotification(notification) {
        try {
            const { 
                notification_type,
                auto_renew_product_id,
                original_transaction_id,
                latest_receipt
            } = notification;

            // 根据通知类型处理
            switch (notification_type) {
                case 'INITIAL_BUY':
                    // 首次订阅
                    console.log('新订阅:', auto_renew_product_id);
                    break;
                    
                case 'DID_RENEW':
                    // 订阅续费
                    await this.handleSubscriptionRenewal(latest_receipt);
                    break;
                    
                case 'CANCEL':
                case 'DID_FAIL_TO_RENEW':
                    // 订阅取消或续费失败
                    await this.handleSubscriptionCancellation(original_transaction_id);
                    break;
                    
                case 'DID_CHANGE_RENEWAL_STATUS':
                    // 续费状态改变
                    console.log('续费状态改变:', notification);
                    break;
            }

            return { success: true };
        } catch (error) {
            console.error('处理订阅通知失败:', error);
            throw error;
        }
    }

    // 处理订阅续费
    async handleSubscriptionRenewal(receiptData) {
        const verification = await this.verifyReceipt(receiptData);
        
        if (!verification.valid) {
            throw new Error('续费收据验证失败');
        }

        // 获取最新的交易
        const latestTransaction = verification.products
            .sort((a, b) => b.purchaseDate - a.purchaseDate)[0];

        // 查找原始订单
        const originalOrder = await Order.findOne({
            'metadata.appleOriginalTransactionId': latestTransaction.originalTransactionId
        });

        if (!originalOrder) {
            console.error('未找到原始订单');
            return;
        }

        // 创建续费订单
        const renewalOrder = new Order({
            orderNo: Order.generateOrderNo(),
            userId: originalOrder.userId,
            orderType: 'subscription',
            amount: originalOrder.amount,
            paymentMethod: 'apple_iap',
            paymentStatus: 'paid',
            transactionId: latestTransaction.transactionId,
            description: '订阅续费',
            paidAt: new Date(latestTransaction.purchaseDate),
            metadata: {
                appleProductId: latestTransaction.productId,
                appleTransactionId: latestTransaction.transactionId,
                appleOriginalTransactionId: latestTransaction.originalTransactionId,
                isRenewal: true
            }
        });

        await renewalOrder.save();

        // 更新订阅
        const Subscription = require('../models/Subscription');
        const subscription = await Subscription.findOne({
            userId: originalOrder.userId,
            lastOrderId: originalOrder._id
        });

        if (subscription) {
            await subscription.renew(renewalOrder._id);
        }
    }

    // 处理订阅取消
    async handleSubscriptionCancellation(originalTransactionId) {
        const order = await Order.findOne({
            'metadata.appleOriginalTransactionId': originalTransactionId
        });

        if (!order) {
            console.error('未找到订单');
            return;
        }

        const Subscription = require('../models/Subscription');
        const subscription = await Subscription.findOne({
            userId: order.userId,
            lastOrderId: order._id
        });

        if (subscription) {
            await subscription.cancel();
        }
    }

    // 判断是否为订阅产品
    isSubscriptionProduct(productId) {
        return Object.values(AppleIAPProducts).includes(productId) &&
               !productId.startsWith(AppleIAPProducts.CONTENT_PREFIX);
    }

    // 判断是否为内容产品
    isContentProduct(productId) {
        return productId.startsWith(AppleIAPProducts.CONTENT_PREFIX);
    }

    // 根据产品ID获取订阅计划
    getPlanByProductId(productId) {
        const { SubscriptionPlans } = require('../config/payment');
        
        for (const [key, plan] of Object.entries(SubscriptionPlans)) {
            if (plan.appleProductId === productId) {
                return plan;
            }
        }
        
        return null;
    }

    // 从产品ID提取内容ID
    extractContentId(productId) {
        return productId.replace(AppleIAPProducts.CONTENT_PREFIX, '');
    }

    // 获取内容价格（实际应从产品配置中获取）
    getContentPrice(product) {
        // 这里应该从App Store Connect的产品配置中获取价格
        // 或者从数据库中的内容定价获取
        return product.price || 0;
    }

    // 恢复购买
    async restorePurchases(userId, receiptData) {
        try {
            const verification = await this.verifyReceipt(receiptData);
            
            if (!verification.valid) {
                throw new Error('收据验证失败');
            }

            const restoredOrders = [];

            for (const product of verification.products) {
                // 检查是否已有此交易的订单
                const existingOrder = await Order.findOne({
                    'metadata.appleTransactionId': product.transactionId
                });

                if (!existingOrder) {
                    // 创建恢复的订单
                    const order = await this.createOrderFromProduct(userId, product);
                    restoredOrders.push(order);
                }
            }

            return {
                success: true,
                restoredCount: restoredOrders.length,
                orders: restoredOrders
            };
        } catch (error) {
            console.error('恢复购买失败:', error);
            throw error;
        }
    }

    // 从产品信息创建订单
    async createOrderFromProduct(userId, product) {
        let orderType, relatedId, amount, description;
        
        if (this.isSubscriptionProduct(product.productId)) {
            orderType = 'subscription';
            const plan = this.getPlanByProductId(product.productId);
            amount = plan.price;
            description = plan.name;
        } else {
            orderType = 'content';
            relatedId = this.extractContentId(product.productId);
            amount = this.getContentPrice(product);
            description = '内容购买';
        }

        const order = new Order({
            orderNo: Order.generateOrderNo(),
            userId,
            orderType,
            relatedId,
            amount,
            paymentMethod: 'apple_iap',
            paymentStatus: 'paid',
            transactionId: product.transactionId,
            description,
            paidAt: new Date(product.purchaseDate),
            metadata: {
                appleProductId: product.productId,
                appleTransactionId: product.transactionId,
                appleOriginalTransactionId: product.originalTransactionId,
                isRestored: true
            }
        });

        await order.save();
        
        // 处理订单完成后的业务逻辑
        const PaymentService = require('./paymentService');
        await PaymentService.processOrderCompletion(order);

        return order;
    }
}

module.exports = new AppleIAPService();
