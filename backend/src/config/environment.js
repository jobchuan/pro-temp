// src/config/environment.js
require('dotenv').config();

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5001,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/visionpro',
  JWT_SECRET: process.env.JWT_SECRET || 'vision-pro-dev-secret-key',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '30d',
  
  // 支付配置
  ALIPAY_APP_ID: process.env.ALIPAY_APP_ID,
  ALIPAY_PRIVATE_KEY: process.env.ALIPAY_PRIVATE_KEY,
  ALIPAY_PUBLIC_KEY: process.env.ALIPAY_PUBLIC_KEY,
  ALIPAY_NOTIFY_URL: process.env.ALIPAY_NOTIFY_URL,
  
  WECHAT_APP_ID: process.env.WECHAT_APP_ID,
  WECHAT_MCH_ID: process.env.WECHAT_MCH_ID,
  WECHAT_PRIVATE_KEY: process.env.WECHAT_PRIVATE_KEY,
  WECHAT_SERIAL: process.env.WECHAT_SERIAL,
  WECHAT_API_KEY: process.env.WECHAT_API_KEY,
  WECHAT_NOTIFY_URL: process.env.WECHAT_NOTIFY_URL,
  
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  
  APPLE_IAP_SHARED_SECRET: process.env.APPLE_IAP_SHARED_SECRET,
  APPLE_BUNDLE_ID: process.env.APPLE_BUNDLE_ID,
  
  // Redis配置
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: process.env.REDIS_PORT || 6379
};