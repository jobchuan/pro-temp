// src/utils/logger.js
const winston = require('winston');
const path = require('path');
const environment = require('../config/environment');

// 定义日志级别
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// 根据环境选择日志级别
const level = () => {
  return environment.NODE_ENV === 'development' ? 'debug' : 'info';
};

// 日志颜色
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

// 添加颜色
winston.addColors(colors);

// 日志格式
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(
    info => `${info.timestamp} ${info.level}: ${info.message}${
      info.stack ? `\n${info.stack}` : ''
    }`
  )
);

// 日志传输器配置
const transports = [
  // 控制台输出
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.printf(
        info => `${info.timestamp} ${info.level}: ${info.message}`
      )
    )
  }),
  
  // 错误日志文件
  new winston.transports.File({
    filename: path.join('logs', 'error.log'),
    level: 'error'
  }),
  
  // 所有日志文件
  new winston.transports.File({
    filename: path.join('logs', 'combined.log')
  })
];

// 创建日志实例
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports
});

module.exports = logger;