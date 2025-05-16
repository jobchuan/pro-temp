// scripts/initDb.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Content = require('../models/Content');

async function initDatabase() {
    try {
        console.log('正在连接到数据库...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/visionpro', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('数据库连接成功');
        
        // 检查是否已存在数据
        const usersCount = await User.countDocuments();
        const contentsCount = await Content.countDocuments();
        
        if (usersCount > 0 || contentsCount > 0) {
            console.log(`数据库已存在数据: ${usersCount} 个用户, ${contentsCount} 个内容`);
            console.log('跳过初始化...');
            return;
        }
        
        console.log('开始初始化数据库...');
        
        // 创建测试用户
        console.log('创建测试用户...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);
        
        const adminUser = new User({
            username: 'admin',
            email: 'admin@example.com',
            password: hashedPassword,
            role: 'admin',
            preferredLanguage: 'zh-CN',
            profile: {
                displayName: {
                    'zh-CN': '管理员',
                    'en-US': 'Administrator'
                }
            },
            status: 'active'
        });
        
        const creatorUser = new User({
            username: 'creator',
            email: 'creator@example.com',
            password: hashedPassword,
            role: 'creator',
            preferredLanguage: 'zh-CN',
            profile: {
                displayName: {
                    'zh-CN': '示例创作者',
                    'en-US': 'Example Creator'
                },
                bio: {
                    'zh-CN': '这是一个示例创作者账号',
                    'en-US': 'This is an example creator account'
                }
            },
            creatorInfo: {
                isVerified: true,
                verifiedAt: new Date(),
                totalFollowers: 100,
                totalViews: 1000,
                totalEarnings: 500
            },
            status: 'active'
        });
        
        const normalUser = new User({
            username: 'user',
            email: 'user@example.com',
            password: hashedPassword,
            role: 'user',
            preferredLanguage: 'zh-CN',
            profile: {
                displayName: {
                    'zh-CN': '普通用户',
                    'en-US': 'Normal User'
                }
            },
            status: 'active'
        });
        
        await adminUser.save();
        await creatorUser.save();
        await normalUser.save();
        
        console.log('测试用户创建成功');
        
        // 创建示例内容
        console.log('创建示例内容...');
        
        const content1 = new Content({
            title: {
                'zh-CN': '示例180°全景视频',
                'en-US': 'Sample 180° Video'
            },
            description: {
                'zh-CN': '这是一个示例的180度全景视频',
                'en-US': 'This is a sample 180-degree panoramic video'
            },
            contentType: '180_video',
            files: {
                main: {
                    url: 'https://example.com/samples/180video.mp4',
                    size: 2048000,
                    duration: 60,
                    resolution: {
                        width: 1920,
                        height: 1080
                    }
                },
                thumbnail: {
                    url: 'https://example.com/samples/180video_thumb.jpg',
                    size: 10240
                }
            },
            creatorId: creatorUser._id,
            tags: ['示例', '全景', '180度'],
            category: 'entertainment',
            pricing: {
                isFree: true
            },
            stats: {
                views: 100,
                likes: 20,
                favorites: 10,
                comments: 5,
                shares: 2,
                downloads: 1
            },
            status: 'published',
            publishedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
        });
        
        const content2 = new Content({
            title: {
                'zh-CN': '示例360°全景照片',
                'en-US': 'Sample 360° Photo'
            },
            description: {
                'zh-CN': '这是一个示例的360度全景照片',
                'en-US': 'This is a sample 360-degree panoramic photo'
            },
            contentType: '360_photo',
            files: {
                main: {
                    url: 'https://example.com/samples/360photo.jpg',
                    size: 1024000,
                    resolution: {
                        width: 4096,
                        height: 2048
                    }
                },
                thumbnail: {
                    url: 'https://example.com/samples/360photo_thumb.jpg',
                    size: 8192
                }
            },
            creatorId: creatorUser._id,
            tags: ['示例', '全景', '360度', '照片'],
            category: 'travel',
            pricing: {
                isFree: false,
                price: 5.99,
                currency: 'CNY'
            },
            stats: {
                views: 50,
                likes: 10,
                favorites: 5,
                comments: 2,
                shares: 1,
                downloads: 0
            },
            status: 'published',
            publishedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
        });
        
        const content3 = new Content({
            title: {
                'zh-CN': '示例空间视频',
                'en-US': 'Sample Spatial Video'
            },
            description: {
                'zh-CN': '这是一个示例的空间视频',
                'en-US': 'This is a sample spatial video'
            },
            contentType: 'spatial_video',
            files: {
                main: {
                    url: 'https://example.com/samples/spatial_video.mp4',
                    size: 3072000,
                    duration: 90,
                    resolution: {
                        width: 2560,
                        height: 1440
                    }
                },
                thumbnail: {
                    url: 'https://example.com/samples/spatial_video_thumb.jpg',
                    size: 12288
                }
            },
            creatorId: creatorUser._id,
            tags: ['示例', '空间视频', 'VisionPro'],
            category: 'education',
            pricing: {
                isFree: true
            },
            stats: {
                views: 200,
                likes: 50,
                favorites: 20,
                comments: 10,
                shares: 5,
                downloads: 2
            },
            status: 'published',
            publishedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
        });
        
        await content1.save();
        await content2.save();
        await content3.save();
        
        console.log('示例内容创建成功');
        
        console.log('数据库初始化完成');
    } catch (error) {
        console.error('数据库初始化失败:', error);
    } finally {
        // 关闭数据库连接
        await mongoose.connection.close();
        console.log('数据库连接已关闭');
    }
}

// 执行初始化
initDatabase();