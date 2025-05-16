// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 认证中间件
const authenticate = async (req, res, next) => {
    try {
        // 从请求头获取token
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            throw new Error('未提供认证令牌');
        }

        // 验证token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 查找用户
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user || user.status !== 'active') {
            throw new Error('用户不存在或已被禁用');
        }

        // 将用户信息添加到请求对象
        req.user = user;
        req.userId = user._id;
        
        next();
    } catch (error) {
        console.error('认证失败:', error.message);
        
        res.status(401).json({ 
            error: req.__('error.unauthorized'),
            message: error.message || '请先登录'
        });
    }
};

// 可选的认证中间件（用于可以匿名访问的路由）
const optionalAuthenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');
            
            if (user && user.status === 'active') {
                req.user = user;
                req.userId = user._id;
            }
        }
        
        next();
    } catch (error) {
        // 忽略错误，继续执行
        next();
    }
};

// 检查用户角色
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                error: req.__('error.unauthorized'),
                message: '请先登录'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                error: req.__('error.unauthorized'),
                message: '您没有权限执行此操作'
            });
        }

        next();
    };
};

module.exports = {
    authenticate,
    optionalAuthenticate,
    authorize
};