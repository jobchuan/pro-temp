// scripts/createAdmin.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function createAdminUser() {
    try {
        console.log('正在连接到数据库...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/visionpro', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('数据库连接成功');
        
        // 检查是否已存在管理员
        const existingAdmin = await User.findOne({ role: 'admin' });
        
        if (existingAdmin) {
            console.log('已存在管理员账户:', existingAdmin.email);
            console.log('密码已被加密，无法显示。如需重置密码，请使用下面的代码更新密码。');
            return;
        }
        
        // 创建新的管理员账户
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('Admin123456', salt);
        
        const adminUser = new User({
            username: 'jobchuan',
            email: 'yngogo@gmail.com',
            password: 'mytimes@9998',
            role: 'admin',
            preferredLanguage: 'zh-CN',
            profile: {
                displayName: {
                    'zh-CN': '系统管理员',
                    'en-US': 'System Administrator'
                }
            },
            status: 'active'
        });
        
        await adminUser.save();
        
        console.log('管理员账户创建成功:');
        console.log('用户名: jobchuan');
        console.log('邮箱: yngogo@gmail.com');
        console.log('密码: mytimes@9998');
        
    } catch (error) {
        console.error('创建管理员账户失败:', error);
    } finally {
        await mongoose.connection.close();
        console.log('数据库连接已关闭');
    }
}

// 执行创建
createAdminUser();