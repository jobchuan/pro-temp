// models/SystemSetting.js
const mongoose = require('mongoose');

const systemSettingSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true
    },
    value: mongoose.Schema.Types.Mixed,
    description: String,
    category: {
        type: String,
        enum: ['payment', 'content', 'user', 'system'],
        default: 'system'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

// 静态方法：获取设置
systemSettingSchema.statics.getSetting = async function(key, defaultValue) {
    const setting = await this.findOne({ key });
    return setting ? setting.value : defaultValue;
};

// 静态方法：设置参数
systemSettingSchema.statics.setSetting = async function(key, value, description, category, userId) {
    const setting = await this.findOne({ key });
    
    if (setting) {
        setting.value = value;
        setting.updatedAt = new Date();
        if (userId) setting.updatedBy = userId;
        await setting.save();
        return setting;
    } else {
        return this.create({
            key,
            value,
            description,
            category,
            updatedBy: userId
        });
    }
};

// 静态方法：获取分类设置
systemSettingSchema.statics.getSettingsByCategory = async function(category) {
    const query = category ? { category } : {};
    const settings = await this.find(query);
    
    // 转换为键值对对象
    const result = {};
    settings.forEach(setting => {
        result[setting.key] = setting.value;
    });
    
    return result;
};

module.exports = mongoose.model('SystemSetting', systemSettingSchema);