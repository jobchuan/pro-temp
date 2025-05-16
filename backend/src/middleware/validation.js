// middleware/validation.js

// 验证注册输入
const validateRegister = (req, res, next) => {
    const { username, email, password } = req.body;
    const errors = [];

    // 验证用户名
    if (!username || username.length < 3) {
        errors.push('用户名至少需要3个字符');
    }
    if (username && username.length > 20) {
        errors.push('用户名不能超过20个字符');
    }
    if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
        errors.push('用户名只能包含字母、数字和下划线');
    }

    // 验证邮箱
    if (!email) {
        errors.push('邮箱不能为空');
    }
    if (email && !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        errors.push('请输入有效的邮箱地址');
    }

    // 验证密码
    if (!password || password.length < 6) {
        errors.push('密码至少需要6个字符');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            error: req.__('error.validation_error'),
            messages: errors
        });
    }

    next();
};

// 验证登录输入
const validateLogin = (req, res, next) => {
    const { email, password } = req.body;
    const errors = [];

    if (!email) {
        errors.push('邮箱不能为空');
    }
    if (!password) {
        errors.push('密码不能为空');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            error: req.__('error.validation_error'),
            messages: errors
        });
    }

    next();
};

// 验证密码修改输入
const validatePasswordChange = (req, res, next) => {
    const { currentPassword, newPassword } = req.body;
    const errors = [];

    if (!currentPassword) {
        errors.push('当前密码不能为空');
    }
    if (!newPassword || newPassword.length < 6) {
        errors.push('新密码至少需要6个字符');
    }
    if (currentPassword === newPassword) {
        errors.push('新密码不能与当前密码相同');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            error: req.__('error.validation_error'),
            messages: errors
        });
    }

    next();
};
const Joi = require('joi');
const { AppError } = require('../utils/errorHandler');

/**
 * 创建验证中间件
 * @param {Joi.Schema} schema Joi验证模式
 * @param {string} property 要验证的属性 ('body' | 'query' | 'params')
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property]);
    
    if (!error) {
      next();
    } else {
      const message = error.details[0].message;
      next(new AppError(message, 400, 'validation_error'));
    }
  };
};

module.exports = {
    validateRegister,
    validateLogin,
    validatePasswordChange,
    validate
};
