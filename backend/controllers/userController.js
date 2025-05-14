// controllers/userController.js
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

// 用户注册
const register = async (req, res) => {
    try {
        const { username, email, password, preferredLanguage } = req.body;

        // 检查用户是否已存在
        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });

        if (existingUser) {
            return res.status(400).json({
                error: req.__('error.validation_error'),
                message: existingUser.email === email ? 
                    '该邮箱已被注册' : '该用户名已被使用'
            });
        }

        // 创建新用户
        const user = new User({
            username,
            email,
            password,
            preferredLanguage: preferredLanguage || req.locale
        });

        await user.save();

        // 生成JWT令牌
        const token = generateToken(user._id);

        // 返回用户信息和令牌
        res.status(201).json({
            success: true,
            message: req.__('success.saved'),
            data: {
                user: user.getPublicProfile(),
                token
            }
        });
    } catch (error) {
        console.error('注册错误:', error);
        res.status(400).json({
            error: req.__('error.validation_error'),
            message: error.message
        });
    }
};

// 用户登录
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 查找用户（包含密码字段）
        const user = await User.findOne({ email }).select('+password');

        if (!user || user.status !== 'active') {
            return res.status(401).json({
                error: req.__('error.unauthorized'),
                message: '邮箱或密码错误'
            });
        }

        // 验证密码
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                error: req.__('error.unauthorized'),
                message: '邮箱或密码错误'
            });
        }

        // 更新最后登录时间
        user.lastLoginAt = new Date();
        await user.save();

        // 生成JWT令牌
        const token = generateToken(user._id);

        // 返回用户信息和令牌
        res.json({
            success: true,
            message: req.__('welcome'),
            data: {
                user: user.getPublicProfile(),
                token
            }
        });
    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({
            error: req.__('error.server_error'),
            message: '登录过程中出现错误'
        });
    }
};

// 获取当前用户信息
const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        
        if (!user) {
            return res.status(404).json({
                error: req.__('error.not_found'),
                message: '用户不存在'
            });
        }

        res.json({
            success: true,
            data: {
                user: user.getPublicProfile(),
                profile: user.getLocalizedProfile(req.locale)
            }
        });
    } catch (error) {
        console.error('获取用户信息错误:', error);
        res.status(500).json({
            error: req.__('error.server_error'),
            message: '获取用户信息失败'
        });
    }
};

// 更新用户资料
const updateProfile = async (req, res) => {
    try {
        const { displayName, bio, preferredLanguage } = req.body;
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({
                error: req.__('error.not_found'),
                message: '用户不存在'
            });
        }

        // 更新基本信息
        if (preferredLanguage) {
            user.preferredLanguage = preferredLanguage;
        }

        // 更新多语言个人资料
        if (displayName) {
            // 更新当前语言的显示名称
            user.profile.displayName[req.locale] = displayName;
        }

        if (bio) {
            // 更新当前语言的个人简介
            user.profile.bio[req.locale] = bio;
        }

        user.updatedAt = new Date();
        await user.save();

        res.json({
            success: true,
            message: req.__('success.saved'),
            data: {
                user: user.getPublicProfile(),
                profile: user.getLocalizedProfile(req.locale)
            }
        });
    } catch (error) {
        console.error('更新资料错误:', error);
        res.status(400).json({
            error: req.__('error.validation_error'),
            message: error.message
        });
    }
};

// 更改密码
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        // 获取用户（包含密码字段）
        const user = await User.findById(req.userId).select('+password');

        if (!user) {
            return res.status(404).json({
                error: req.__('error.not_found'),
                message: '用户不存在'
            });
        }

        // 验证当前密码
        const isPasswordValid = await user.comparePassword(currentPassword);

        if (!isPasswordValid) {
            return res.status(401).json({
                error: req.__('error.unauthorized'),
                message: '当前密码错误'
            });
        }

        // 更新密码
        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: req.__('success.saved'),
            data: {
                message: '密码修改成功'
            }
        });
    } catch (error) {
        console.error('修改密码错误:', error);
        res.status(400).json({
            error: req.__('error.validation_error'),
            message: error.message
        });
    }
};

module.exports = {
    register,
    login,
    getCurrentUser,
    updateProfile,
    changePassword
};
