// scripts/initSystemSettings.js
require('dotenv').config();
const mongoose = require('mongoose');
const SystemSetting = require('../models/SystemSetting');

async function initSystemSettings() {
    try {
        console.log('正在连接到数据库...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/visionpro', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('数据库连接成功');
        
        // 默认设置
        const defaultSettings = [
            {
                key: 'platformFee',
                value: 0.3,
                description: '平台分成比例',
                category: 'payment'
            },
            {
                key: 'minimumWithdrawal',
                value: 100,
                description: '最低提现金额',
                category: 'payment'
            },
            {
                key: 'contentReviewRequired',
                value: true,
                description: '内容是否需要审核',
                category: 'content'
            },
            {
                key: 'allowedContentTypes',
                value: ['180_video', '180_photo', '360_video', '360_photo', 'spatial_video', 'spatial_photo'],
                description: '允许的内容类型',
                category: 'content'
            },
            {
                key: 'supportedLanguages',
                value: ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'],
                description: '支持的语言',
                category: 'system'
            },
            {
                key: 'userAutoApproval',
                value: true,
                description: '用户是否自动审核通过',
                category: 'user'
            },
            {
                key: 'maxUploadSize',
                value: 500 * 1024 * 1024, // 500MB
                description: '最大上传文件大小',
                category: 'content'
            }
        ];
        
        // 检查并创建设置
        for (const setting of defaultSettings) {
            const existingSetting = await SystemSetting.findOne({ key: setting.key });
            
            if (!existingSetting) {
                await SystemSetting.create(setting);
                console.log(`创建设置: ${setting.key}`);
            } else {
                console.log(`设置已存在: ${setting.key}`);
            }
        }
        
        console.log('系统设置初始化完成');
    } catch (error) {
        console.error('系统设置初始化失败:', error);
    } finally {
        await mongoose.connection.close();
        console.log('数据库连接已关闭');
    }
}

// 执行初始化
initSystemSettings();