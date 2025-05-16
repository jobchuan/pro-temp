// src/middleware/security.js
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');

// 请求速率限制
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs, // 时间窗口，单位毫秒
    max, // 时间窗口内最大请求数
    message: {
      success: false,
      error: 'rate_limit_exceeded',
      message
    }
  });
};

// API基本限制：每15分钟100个请求
const apiLimiter = createRateLimiter(
  15 * 60 * 1000,
  100,
  '请求过于频繁，请稍后再试'
);

// 登录限制：每小时10次尝试
const loginLimiter = createRateLimiter(
  60 * 60 * 1000,
  10,
  '登录尝试次数过多，请稍后再试'
);

// 注册限制：每小时5次尝试
const registerLimiter = createRateLimiter(
  60 * 60 * 1000,
  5,
  '注册尝试次数过多，请稍后再试'
);

// 应用安全中间件
const applySecurityMiddleware = app => {
  // 设置安全HTTP头
  app.use(helmet());
  
  // 防止XSS攻击
  app.use(xss());
  
  // 防止NoSQL注入
  app.use(mongoSanitize());
  
  // 防止HTTP参数污染
  app.use(hpp());
  
  // 应用速率限制
  app.use('/api', apiLimiter);
  app.use('/api/users/login', loginLimiter);
  app.use('/api/users/register', registerLimiter);
};

module.exports = {
  applySecurityMiddleware
};