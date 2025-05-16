// utils/jwt.js
const jwt = require('jsonwebtoken');

// 生成JWT令牌
const generateToken = (userId) => {
    const secret = process.env.JWT_SECRET || 'vision-pro-dev-secret-key';
    return jwt.sign(
        { id: userId },
        secret,
        { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );
};

// 验证JWT令牌
const verifyToken = (token) => {
    try {
        const secret = process.env.JWT_SECRET || 'vision-pro-dev-secret-key';
        return jwt.verify(token, secret);
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new Error('令牌已过期，请重新登录');
        }
        if (error instanceof jwt.JsonWebTokenError) {
            throw new Error('无效的令牌');
        }
        throw error;
    }
};

module.exports = {
    generateToken,
    verifyToken
};