// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, '用户名不能为空'],
        unique: true,
        trim: true,
        minlength: [3, '用户名至少3个字符'],
        maxlength: [20, '用户名最多20个字符']
    },
    email: {
        type: String,
        required: [true, '邮箱不能为空'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '请输入有效的邮箱地址']
    },
    password: {
        type: String,
        required: [true, '密码不能为空'],
        minlength: [6, '密码至少6个字符'],
        select: false // 查询时默认不返回密码
    },
    role: {
        type: String,
        enum: ['user', 'creator', 'admin'],
        default: 'user'
    },
    // 多语言支持
    preferredLanguage: {
        type: String,
        enum: ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'],
        default: 'zh-CN'
    },
    // 个人资料多语言
    profile: {
        displayName: {
            'zh-CN': { type: String, default: '' },
            'en-US': { type: String, default: '' },
            'ja-JP': { type: String, default: '' },
            'ko-KR': { type: String, default: '' }
        },
        bio: {
            'zh-CN': { type: String, default: '' },
            'en-US': { type: String, default: '' },
            'ja-JP': { type: String, default: '' },
            'ko-KR': { type: String, default: '' }
        }
    },
    // 创作者信息
    creatorInfo: {
        isVerified: { type: Boolean, default: false },
        verifiedAt: Date,
        totalFollowers: { type: Number, default: 0 },
        totalViews: { type: Number, default: 0 },
        totalEarnings: { type: Number, default: 0 }
    },
    // 账户状态
    status: {
        type: String,
        enum: ['active', 'suspended', 'deleted'],
        default: 'active'
    },
    // 时间戳
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    lastLoginAt: Date
}, {
    timestamps: true
});

// 密码加密中间件
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// 验证密码方法
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// 获取用户公开信息
userSchema.methods.getPublicProfile = function() {
    const { password, ...publicData } = this.toObject();
    return publicData;
};

// 获取指定语言的个人资料
userSchema.methods.getLocalizedProfile = function(language) {
    const lang = language || this.preferredLanguage;
    return {
        displayName: this.profile.displayName[lang] || this.profile.displayName[this.preferredLanguage],
        bio: this.profile.bio[lang] || this.profile.bio[this.preferredLanguage]
    };
};

module.exports = mongoose.model('User', userSchema);
