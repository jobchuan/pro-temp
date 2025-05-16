// config/payment.js
const AlipaySdk = require('alipay-sdk');
// 如果上面的不行，尝试：
// const { AlipaySdk } = require('alipay-sdk');
const { Wechatpay } = require('wechatpay-axios-plugin');
const fs = require('fs');
const path = require('path');

// 支付配置
const paymentConfig = {
    // 支付宝配置
    alipay: {
        appId: process.env.ALIPAY_APP_ID,
        privateKey: process.env.ALIPAY_PRIVATE_KEY,
        alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY,
        gateway: 'https://openapi.alipay.com/gateway.do',
        notifyUrl: process.env.ALIPAY_NOTIFY_URL
    },
    
    // 微信支付配置
    wechatpay: {
        appid: process.env.WECHAT_APP_ID,
        mchid: process.env.WECHAT_MCH_ID,
        privateKey: process.env.WECHAT_PRIVATE_KEY,
        serial: process.env.WECHAT_SERIAL,
        apiKey: process.env.WECHAT_API_KEY,
        notifyUrl: process.env.WECHAT_NOTIFY_URL
    },
    
    // Apple Pay 配置（通过 Stripe）
    stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
    },
    
    // Apple App内购配置
    appleIAP: {
        sharedSecret: process.env.APPLE_IAP_SHARED_SECRET,
        environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
        bundleId: process.env.APPLE_BUNDLE_ID
    }
};

// 初始化支付宝SDK
let alipaySdk = null;
/* 暂时注释掉支付宝初始化
if (paymentConfig.alipay.appId) {
    alipaySdk = new AlipaySdk({
        appId: paymentConfig.alipay.appId,
        privateKey: paymentConfig.alipay.privateKey,
        alipayPublicKey: paymentConfig.alipay.alipayPublicKey,
        gateway: paymentConfig.alipay.gateway
    });
}
*/

// 初始化微信支付
let wechatpay = null;
/* 暂时注释掉微信支付初始化
if (paymentConfig.wechatpay.appid) {
    wechatpay = new Wechatpay({
        appid: paymentConfig.wechatpay.appid,
        mchid: paymentConfig.wechatpay.mchid,
        privateKey: paymentConfig.wechatpay.privateKey,
        serial: paymentConfig.wechatpay.serial,
        apiKey3: paymentConfig.wechatpay.apiKey
    });
}
*/

// 初始化 Stripe
let stripe = null;
if (paymentConfig.stripe.secretKey) {
    stripe = require('stripe')(paymentConfig.stripe.secretKey);
}

// 支付方式枚举
const PaymentMethods = {
    ALIPAY: 'alipay',
    WECHAT: 'wechat',
    STRIPE: 'stripe',
    APPLE_PAY: 'apple_pay',
    APPLE_IAP: 'apple_iap'  // 添加Apple内购
};

// Apple内购产品ID映射
const AppleIAPProducts = {
    MONTHLY: 'com.yourdomain.visionpro.monthly',
    QUARTERLY: 'com.yourdomain.visionpro.quarterly',
    YEARLY: 'com.yourdomain.visionpro.yearly',
    CONTENT_PREFIX: 'com.yourdomain.visionpro.content.'
};

// 订阅计划
const SubscriptionPlans = {
    MONTHLY: {
        id: 'monthly',
        name: '月度会员',
        price: 29.9,
        currency: 'CNY',
        duration: 30, // 天
        appleProductId: AppleIAPProducts.MONTHLY,
        features: [
            '无限观看VR内容',
            '独家会员内容',
            '高清画质',
            '无广告体验'
        ]
    },
    QUARTERLY: {
        id: 'quarterly',
        name: '季度会员',
        price: 79.9,
        currency: 'CNY',
        duration: 90,
        appleProductId: AppleIAPProducts.QUARTERLY,
        features: [
            '无限观看VR内容',
            '独家会员内容',
            '高清画质',
            '无广告体验',
            '优先体验新功能'
        ]
    },
    YEARLY: {
        id: 'yearly',
        name: '年度会员',
        price: 299.9,
        currency: 'CNY',
        duration: 365,
        appleProductId: AppleIAPProducts.YEARLY,
        features: [
            '无限观看VR内容',
            '独家会员内容',
            '高清画质',
            '无广告体验',
            '优先体验新功能',
            '专属客服支持'
        ]
    }
};

// 创作者分成比例配置
const RevenueSharing = {
    DEFAULT: 0.7, // 默认创作者获得70%
    PREMIUM: 0.8, // 优质创作者获得80%
    PLATFORM: 0.3, // 平台默认获得30%
    MINIMUM_WITHDRAWAL: 100 // 最低提现金额
};

module.exports = {
    paymentConfig,
    alipaySdk,
    wechatpay,
    stripe,
    PaymentMethods,
    AppleIAPProducts,
    SubscriptionPlans,
    RevenueSharing
};