# Vision Pro内容平台功能列表

## 一、用户管理
```javascript
// 用户模型 - User.js
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'creator', 'admin'], default: 'user' },
    // 多语言支持
    preferredLanguage: { type: String, enum: ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'], default: 'zh-CN' },
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
    }
});

// 用户控制器 - userController.js
// 注册、登录、获取个人信息、更新资料、更改密码等功能
const register = async (req, res) => {
    try {
        const { username, email, password, preferredLanguage } = req.body;
        // 创建新用户
        const user = new User({ username, email, password, preferredLanguage });
        await user.save();
        // 生成JWT令牌
        const token = generateToken(user._id);
        res.status(201).json({ success: true, data: { user: user.getPublicProfile(), token } });
    } catch (error) {
        res.status(400).json({ error: req.__('error.validation_error'), message: error.message });
    }
};
```

## 二、内容管理
```javascript
// 内容模型 - Content.js
const contentSchema = new mongoose.Schema({
    // 基本信息
    title: {
        'zh-CN': { type: String, required: true },
        'en-US': { type: String },
        'ja-JP': { type: String },
        'ko-KR': { type: String }
    },
    description: {
        'zh-CN': { type: String },
        'en-US': { type: String },
        'ja-JP': { type: String },
        'ko-KR': { type: String }
    },
    
    // 内容类型
    contentType: {
        type: String,
        enum: ['180_video', '180_photo', '360_video', '360_photo', 'spatial_video', 'spatial_photo'],
        required: true
    },
    
    // 文件信息
    files: {
        main: {
            url: { type: String, required: true },
            size: Number,
            duration: Number, // 视频时长（秒）
            resolution: { width: Number, height: Number }
        },
        thumbnail: { url: String, size: Number },
        preview: { url: String, size: Number }
    },
    
    // 额外媒体
    media: {
        // 背景音乐
        backgroundMusic: {
            url: String,
            title: String,
            artist: String,
            startTime: { type: Number, default: 0 },
            endTime: Number,
            volume: { type: Number, min: 0, max: 1, default: 1 }
        },
        
        // 旁白
        narration: {
            'zh-CN': { url: String, duration: Number, transcript: String, startTime: Number },
            'en-US': { url: String, duration: Number, transcript: String, startTime: Number },
            'ja-JP': { url: String, duration: Number, transcript: String, startTime: Number },
            'ko-KR': { url: String, duration: Number, transcript: String, startTime: Number }
        },
        
        // 字幕
        subtitles: {
            'zh-CN': { url: String, label: String },
            'en-US': { url: String, label: String },
            'ja-JP': { url: String, label: String },
            'ko-KR': { url: String, label: String }
        }
    },
    
    // 创作者信息
    creatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // 协作信息
    collaboration: {
        isCollaborative: { type: Boolean, default: false },
        collaborationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Collaboration' }
    },
    
    // 标签和分类
    tags: [String],
    category: {
        type: String,
        enum: ['travel', 'education', 'entertainment', 'sports', 'news', 'documentary', 'art', 'other'],
        default: 'other'
    },
    
    // 付费设置
    pricing: {
        isFree: { type: Boolean, default: true },
        price: { type: Number, default: 0 },
        currency: { type: String, default: 'CNY' }
    },
    
    // 统计信息
    stats: {
        views: { type: Number, default: 0 },
        likes: { type: Number, default: 0 },
        favorites: { type: Number, default: 0 },
        comments: { type: Number, default: 0 },
        shares: { type: Number, default: 0 },
        downloads: { type: Number, default: 0 },
        danmakus: { type: Number, default: 0 }
    },
    
    // 内容状态
    status: {
        type: String,
        enum: ['draft', 'pending_review', 'approved', 'rejected', 'published', 'archived'],
        default: 'draft'
    }
});

// 融合内容模型 - Fusion.js
const fusionSchema = new mongoose.Schema({
    // 基本信息
    title: { type: String, required: true },
    description: { type: String },
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // 内容列表
    contents: [{
        contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Content', required: true },
        order: { type: Number, default: 0 },
        settings: {
            autoPlay: { type: Boolean, default: true },
            loop: { type: Boolean, default: false },
            duration: Number,
            transition: { type: String, enum: ['none', 'fade', 'slide'], default: 'fade' }
        }
    }],
    
    // 全局设置
    settings: {
        autoPlay: { type: Boolean, default: true },
        loop: { type: Boolean, default: false },
        shuffle: { type: Boolean, default: false },
        transitionDuration: { type: Number, default: 1000 }
    }
});

// 内容控制器 - contentController.js
const createContent = async (req, res) => {
    try {
        const { title, description, contentType, files, media, location, tags, category, pricing } = req.body;
        // 创建内容
        const content = new Content({
            title, description, contentType, files, media, location,
            creatorId: req.userId,
            tags: tags || [],
            category: category || 'other',
            pricing: pricing || { isFree: true },
            status: 'draft'
        });
        await content.save();
        
        res.status(201).json({
            success: true,
            message: req.__('success.saved'),
            data: content
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: req.__('error.validation_error'),
            message: error.message
        });
    }
};
```

## 三、交互功能
```javascript
// 评论模型 - Comment.js
const commentSchema = new mongoose.Schema({
    contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Content', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
    // 空间锚点（用于VR空间中的定位评论）
    spatialAnchor: {
        position: { x: Number, y: Number, z: Number },
        rotation: { x: Number, y: Number, z: Number, w: Number },
        timestamp: Number // 视频时间戳
    },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }, // 用于评论回复
    level: { type: Number, default: 0 }, // 评论层级
    status: { type: String, enum: ['active', 'deleted', 'flagged', 'hidden'], default: 'active' },
    likes: { type: Number, default: 0 },
    replyCount: { type: Number, default: 0 },
    isPinned: { type: Boolean, default: false },
    isCreatorComment: { type: Boolean, default: false }
});

// 弹幕模型 - Danmaku.js
const danmakuSchema = new mongoose.Schema({
    contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Content', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true, maxlength: 100 },
    timestamp: { type: Number, required: true }, // 时间戳（秒）
    type: { type: String, enum: ['scroll', 'top', 'bottom', 'spatial'], default: 'scroll' },
    style: {
        color: { type: String, default: '#FFFFFF' },
        fontSize: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' },
        opacity: { type: Number, default: 1, min: 0, max: 1 }
    },
    // 空间位置（用于VR弹幕）
    spatialPosition: {
        x: Number, y: Number, z: Number,
        rx: Number, ry: Number, rz: Number // 旋转
    }
});

// 观看历史模型 - ViewHistory.js
const viewHistorySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Content', required: true },
    progress: { type: Number, default: 0 }, // 观看进度（秒）
    duration: { type: Number, default: 0 }, // 总时长（秒）
    progressPercentage: { type: Number, default: 0 }, // 观看进度百分比
    isCompleted: { type: Boolean, default: false }, // 是否已完成观看
    viewCount: { type: Number, default: 1 }, // 观看次数
    lastPosition: { x: Number, y: Number, z: Number, timestamp: Number } // 最后观看的位置
});

// 离线内容模型 - OfflineContent.js
const offlineContentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Content', required: true },
    status: { type: String, enum: ['pending', 'downloading', 'completed', 'failed', 'expired'], default: 'pending' },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    files: {
        main: { url: String, size: Number, downloadedSize: Number, checksum: String },
        thumbnail: { url: String, size: Number },
        audio: { url: String, size: Number }
    },
    totalSize: { type: Number, default: 0 }, // 总大小（字节）
    downloadedSize: { type: Number, default: 0 }, // 已下载大小（字节）
    quality: { type: String, enum: ['low', 'medium', 'high', 'ultra'], default: 'high' },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } // 30天后过期
});

// 交互控制器 - interactionController.js
// 点赞/取消点赞
const toggleLike = async (req, res) => {
    try {
        const { contentId } = req.params;
        const userId = req.userId;
        
        const interaction = await UserInteraction.toggleInteraction(userId, contentId, 'like');
        
        res.json({
            success: true,
            data: { liked: interaction.isActive, contentId }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: '操作失败', message: error.message });
    }
};

// 添加评论
const addComment = async (req, res) => {
    try {
        const { contentId } = req.params;
        const { text, parentId, spatialAnchor } = req.body;
        const userId = req.userId;
        
        // 创建评论对象
        const comment = new Comment({ contentId, userId, text, parentId, spatialAnchor });
        await comment.save();
        
        // 更新内容的评论统计
        await Content.findByIdAndUpdate(contentId, { $inc: { 'stats.comments': 1 } });
        
        res.status(201).json({ success: true, data: comment });
    } catch (error) {
        res.status(500).json({ success: false, error: '操作失败', message: error.message });
    }
};
```

## 四、协作功能
```javascript
// 协作模型 - Collaboration.js
const collaborationSchema = new mongoose.Schema({
    // 内容引用
    contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Content', required: true },
    
    // 创建者（内容所有者）
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // 协作者列表
    collaborators: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        role: { type: String, enum: ['editor', 'viewer', 'commenter'], default: 'viewer' },
        permissions: {
            canEdit: { type: Boolean, default: false },
            canDelete: { type: Boolean, default: false },
            canInvite: { type: Boolean, default: false },
            canPublish: { type: Boolean, default: false },
            canManageVersions: { type: Boolean, default: false }
        },
        invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        invitedAt: { type: Date, default: Date.now },
        acceptedAt: Date,
        lastActiveAt: Date,
        status: { type: String, enum: ['pending', 'accepted', 'declined', 'removed'], default: 'pending' }
    }],
    
    // 协作设置
    settings: {
        allowPublicView: { type: Boolean, default: false },
        allowComments: { type: Boolean, default: true },
        requireApprovalForChanges: { type: Boolean, default: false },
        autoSaveInterval: { type: Number, default: 30 } // 秒
    },
    
    // 协作历史记录
    history: [{
        action: { type: String, enum: ['created', 'edited', 'invited', 'removed', 'permission_changed', 'published'] },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        details: mongoose.Schema.Types.Mixed,
        timestamp: { type: Date, default: Date.now }
    }],
    
    // 当前编辑状态
    editingStatus: {
        isLocked: { type: Boolean, default: false },
        lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        lockedAt: Date,
        activeEditors: [{
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            startedAt: Date,
            lastActiveAt: Date
        }]
    }
});

// 协作控制器 - collaborationController.js
// 邀请协作者
const inviteCollaborator = async (req, res) => {
    try {
        const { contentId } = req.params;
        const { userId, role = 'viewer', permissions = {} } = req.body;

        // 获取内容
        const content = await Content.findById(contentId);
        if (!content) {
            return res.status(404).json({ error: req.__('error.not_found'), message: '内容不存在' });
        }

        // 检查是否有权限邀请
        if (content.creatorId.toString() !== req.userId) {
            const collaboration = await Collaboration.findById(content.collaboration.collaborationId);
            
            if (!collaboration || !collaboration.checkPermission(req.userId, 'canInvite')) {
                return res.status(403).json({ error: req.__('error.unauthorized'), message: '没有权限邀请协作者' });
            }
        }

        // 获取或创建协作记录
        let collaboration = await Collaboration.findById(content.collaboration.collaborationId);
        
        if (!collaboration) {
            collaboration = new Collaboration({
                contentId: content._id,
                ownerId: content.creatorId
            });
            await collaboration.save();
            
            // 更新内容的协作信息
            content.collaboration.isCollaborative = true;
            content.collaboration.collaborationId = collaboration._id;
            await content.save();
        }

        // 添加协作者
        await collaboration.addCollaborator(userId, role, permissions, req.userId);

        res.json({
            success: true,
            message: '邀请已发送',
            data: { collaborationId: collaboration._id }
        });
    } catch (error) {
        res.status(400).json({ error: req.__('error.validation_error'), message: error.message });
    }
};
```

## 五、支付与收益系统
```javascript
// 支付配置 - payment.js
const paymentConfig = {
    // 支付宝配置
    alipay: {
        appId: process.env.ALIPAY_APP_ID,
        privateKey: process.env.ALIPAY_PRIVATE_KEY,
        alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY,
        gateway: 'https://openapi.alipay.com/gateway.do',
        notifyUrl: process.env.ALIPAY_NOTIFY_URL
    },
    
    // 微信支付配置
    wechatpay: {
        appid: process.env.WECHAT_APP_ID,
        mchid: process.env.WECHAT_MCH_ID,
        privateKey: process.env.WECHAT_PRIVATE_KEY,
        serial: process.env.WECHAT_SERIAL,
        apiKey: process.env.WECHAT_API_KEY,
        notifyUrl: process.env.WECHAT_NOTIFY_URL
    },
    
    // Stripe配置
    stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
    },
    
    // Apple内购配置
    appleIAP: {
        sharedSecret: process.env.APPLE_IAP_SHARED_SECRET,
        environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
        bundleId: process.env.APPLE_BUNDLE_ID
    }
};

// 订阅计划
const SubscriptionPlans = {
    MONTHLY: {
        id: 'monthly',
        name: '月度会员',
        price: 29.9,
        currency: 'CNY',
        duration: 30, // 天
        appleProductId: 'com.yourdomain.visionpro.monthly',
        features: ['无限观看VR内容', '独家会员内容', '高清画质', '无广告体验']
    },
    QUARTERLY: {
        id: 'quarterly',
        name: '季度会员',
        price: 79.9,
        currency: 'CNY',
        duration: 90,
        appleProductId: 'com.yourdomain.visionpro.quarterly',
        features: ['无限观看VR内容', '独家会员内容', '高清画质', '无广告体验', '优先体验新功能']
    },
    YEARLY: {
        id: 'yearly',
        name: '年度会员',
        price: 299.9,
        currency: 'CNY',
        duration: 365,
        appleProductId: 'com.yourdomain.visionpro.yearly',
        features: ['无限观看VR内容', '独家会员内容', '高清画质', '无广告体验', '优先体验新功能', '专属客服支持']
    }
};

// 订单模型 - Order.js
const orderSchema = new mongoose.Schema({
    orderNo: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderType: { type: String, enum: ['subscription', 'content', 'tip'], required: true },
    relatedId: { type: mongoose.Schema.Types.ObjectId, refPath: 'orderType' },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'CNY' },
    paymentMethod: { type: String, enum: ['alipay', 'wechat', 'stripe', 'apple_pay', 'apple_iap'], required: true },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'cancelled', 'refunded'], default: 'pending' },
    description: String,
    transactionId: String,
    paidAt: Date,
    expiredAt: Date,
    // 收入分成信息
    revenue: {
        creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        creatorAmount: Number, // 创作者收入
        platformAmount: Number, // 平台收入
        sharingRatio: Number   // 分成比例
    }
});

// 订阅模型 - Subscription.js
const subscriptionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    planId: { type: String, required: true },
    planName: { type: String, required: true },
    planPrice: { type: Number, required: true },
    planDuration: { type: Number, required: true },
    status: { type: String, enum: ['active', 'expired', 'cancelled', 'paused'], default: 'active' },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },
    autoRenew: { type: Boolean, default: true },
    paymentMethod: { type: String, enum: ['alipay', 'wechat', 'stripe', 'apple_pay', 'apple_iap'] }
});

// 创作者收入模型 - CreatorIncome.js
const creatorIncomeSchema = new mongoose.Schema({
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    source: { type: String, enum: ['content_sale', 'tip', 'subscription_share'], required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Content' },
    totalAmount: { type: Number, required: true },
    platformFee: { type: Number, required: true },
    netAmount: { type: Number, required: true },
    sharingRatio: { type: Number, required: true },
    withdrawStatus: { type: String, enum: ['pending', 'withdrawable', 'processing', 'withdrawn', 'failed'], default: 'pending' }
});

// 支付控制器 - paymentController.js
// 创建订阅订单
const createSubscriptionOrder = async (req, res) => {
    try {
        const { planId, paymentMethod } = req.body;
        const userId = req.userId;
        
        // 验证订阅计划
        const plan = SubscriptionPlans[planId.toUpperCase()];
        if (!plan) {
            return res.status(400).json({ error: '无效的订阅计划', message: '请选择有效的订阅计划' });
        }
        
        // 检查是否已有有效订阅
        const existingSubscription = await Subscription.findOne({ userId, status: 'active' });
        if (existingSubscription && existingSubscription.isActive()) {
            return res.status(400).json({ error: '订阅冲突', message: '您已有有效的订阅' });
        }
        
        // 创建订单
        const { order, paymentParams } = await PaymentService.createPaymentOrder(
            userId, 'subscription', null, plan.price, paymentMethod, plan.name, { plan }
        );
        
        res.json({
            success: true,
            data: { orderNo: order.orderNo, amount: order.amount, paymentParams }
        });
    } catch (error) {
        res.status(500).json({ error: '服务器错误', message: error.message });
    }
};
```

## 六、创作者中心
```javascript
// 创作者控制器 - creatorController.js
// 获取创作者内容列表
const getCreatorContents = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, contentType, search, sort = '-createdAt' } = req.query;
        
        // 构建查询条件
        const query = { creatorId: req.userId };
        if (status) query.status = status;
        if (contentType) query.contentType = contentType;
        
        // 搜索过滤
        if (search) {
            query.$or = [
                { "title.zh-CN": { $regex: search, $options: 'i' } },
                { "title.en-US": { $regex: search, $options: 'i' } },
                { tags: { $in: [search] } }
            ];
        }
        
        // 执行查询
        const contents = await Content.find(query)
            .sort(sort)
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));
            
        const total = await Content.countDocuments(query);
        
        res.json({
            success: true,
            data: {
                contents,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 获取内容分析
const getContentAnalytics = async (req, res) => {
    try {
        const { contentId } = req.params;
        const { period = '7days' } = req.query;
        
        // 验证内容所有权
        const content = await Content.findOne({
            _id: contentId,
            creatorId: req.userId
        });
        
        if (!content) {
            return res.status(404).json({
                success: false,
                error: '未找到',
                message: '内容不存在或您无权访问'
            });
        }
        
        // 计算日期范围
        const endDate = new Date();
        let startDate;
        
        if (period === '7days') {
            startDate = new Date(endDate);
            startDate.setDate(endDate.getDate() - 7);
        } else if (period === '30days') {
            startDate = new Date(endDate);
            startDate.setDate(endDate.getDate() - 30);
        } else if (period === '90days') {
            startDate = new Date(endDate);
            startDate.setDate(endDate.getDate() - 90);
        } else {
            startDate = new Date(0); // 从1970年开始
        }
        
        // 获取观看数据
        const viewsData = [];
        let currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
            const dayStart = new Date(currentDate);
            const dayEnd = new Date(currentDate);
            dayEnd.setDate(dayEnd.getDate() + 1);
            
            const viewsCount = await ViewHistory.countDocuments({
                contentId,
                createdAt: { $gte: dayStart, $lt: dayEnd }
            });
            
            viewsData.push({
                date: dayStart.toISOString().split('T')[0],
                count: viewsCount
            });
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // 获取互动数据
        const interactions = {
            likes: await UserInteraction.countDocuments({ 
                contentId, 
                type: 'like',
                isActive: true
            }),
            favorites: await UserInteraction.countDocuments({ 
                contentId, 
                type: 'favorite',
                isActive: true
            }),
            comments: await Comment.countDocuments({
                contentId,
                status: 'active'
            }),
            shares: content.stats.shares || 0
        };
        
        res.json({
            success: true,
            data: {
                content: {
                    _id: content._id,
                    title: content.title,
                    status: content.status,
                    createdAt: content.createdAt,
                    publishedAt: content.publishedAt
                },
                period,
                stats: {
                    totalViews: content.stats.views || 0,
                    ...interactions
                },
                viewsTrend: viewsData
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 获取收入概览
const getIncomeOverview = async (req, res) => {
    try {
        const creatorId = req.userId;
        
        // 获取总收入
        const totalIncome = await CreatorIncome.aggregate([
            { $match: { creatorId: mongoose.Types.ObjectId(creatorId) } },
            { $group: {
                _id: null,
                totalAmount: { $sum: '$totalAmount' },
                platformFee: { $sum: '$platformFee' },
                netAmount: { $sum: '$netAmount' },
                count: { $sum: 1 }
            }}
        ]);
        
        // 获取本月收入
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthlyIncome = await CreatorIncome.aggregate([
            { 
                $match: { 
                    creatorId: mongoose.Types.ObjectId(creatorId),
                    createdAt: { $gte: firstDayOfMonth }
                } 
            },
            { $group: {
                _id: null,
                totalAmount: { $sum: '$totalAmount' },
                platformFee: { $sum: '$platformFee' },
                netAmount: { $sum: '$netAmount' },
                count: { $sum: 1 }
            }}
        ]);
        
        res.json({
            success: true,
            data: {
                overview: {
                    totalLifetime: totalIncome.length > 0 ? totalIncome[0].netAmount : 0,
                    thisMonth: monthlyIncome.length > 0 ? monthlyIncome[0].netAmount : 0
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};
```

## 七、推荐系统
```javascript
// 推荐服务 - recommendationService.js
class RecommendationService {
    // 获取用户推荐列表
    static async getUserRecommendations(userId, options = {}) {
        const {
            limit = 20,
            offset = 0,
            includeTypes = ['editorial', 'personalized', 'trending', 'similar'],
            excludeViewed = true,
            contentType,
            category
        } = options;
        
        // 构建查询条件
        const query = {
            userId: mongoose.Types.ObjectId(userId),
            status: 'active',
            type: { $in: includeTypes }
        };
        
        // 如果需要排除已观看的内容
        if (excludeViewed) {
            // 获取用户已观看的内容
            const viewedContents = await ViewHistory.distinct('contentId', { userId });
            if (viewedContents.length > 0) {
                query.contentId = { $nin: viewedContents };
            }
        }
        
        // 执行查询
        const recommendations = await Recommendation.find(query)
            .sort({ score: -1 })
            .skip(offset)
            .limit(limit)
            .populate('contentId', 'title description contentType thumbnailURL stats');
        
        return recommendations;
    }
    
    // 获取类似内容推荐（基于当前内容）
    static async getSimilarRecommendations(contentId, options = {}) {
        const { limit = 10, userId } = options;
        
        // 获取当前内容的信息
        const content = await Content.findById(contentId);
        
        if (!content) {
            throw new Error('内容不存在');
        }
        
        // 构建查询条件 - 基于相同类型和标签
        const query = {
            _id: { $ne: contentId }, // 不包括自己
            status: 'published',
            contentType: content.contentType
        };
        
        // 如果有标签，查找具有相同标签的内容
        if (content.tags && content.tags.length > 0) {
            query.tags = { $in: content.tags };
        }
        
        // 使用聚合来计算相似度分数
        const pipeline = [
            { $match: query },
            { $addFields: {
                // 标签匹配度
                tagSimilarity: {
                    $size: {
                        $setIntersection: ["$tags", content.tags || []]
                    }
                }
            }},
            { $sort: { tagSimilarity: -1, "stats.views": -1 }},
            { $limit: limit }
        ];
        
        const similarContents = await Content.aggregate(pipeline);
        
        return similarContents;
    }
    
    // 更新用户推荐
    static async updateUserRecommendations(userId) {
        try {
            // 1. 获取用户偏好
            let userPreference = await UserPreference.findOne({ userId });
            
            // 如果不存在，创建新的偏好记录
            if (!userPreference) {
                userPreference = new UserPreference({ userId });
                await userPreference.save();
            }
            
            // 2. 生成或更新编辑推荐
            await this.generateEditorialRecommendations(userId);
            
            // 3. 生成个性化推荐
            await this.generatePersonalizedRecommendations(userId, userPreference);
            
            // 4. 生成热门推荐
            await this.generateTrendingRecommendations(userId);
            
            return true;
        } catch (error) {
            console.error('更新用户推荐失败:', error);
            return false;
        }
    }
}

// 用户偏好模型 - UserPreference.js
const userPreferenceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    
    // 偏好分类权重
    categoryPreferences: {
        travel: { type: Number, default: 0 },
        education: { type: Number, default: 0 },
        entertainment: { type: Number, default: 0 },
        sports: { type: Number, default: 0 },
        news: { type: Number, default: 0 },
        documentary: { type: Number, default: 0 },
        art: { type: Number, default: 0 },
        other: { type: Number, default: 0 }
    },
    
    // 内容类型偏好权重
    contentTypePreferences: {
        '180_video': { type: Number, default: 0 },
        '180_photo': { type: Number, default: 0 },
        '360_video': { type: Number, default: 0 },
        '360_photo': { type: Number, default: 0 },
        'spatial_video': { type: Number, default: 0 },
        'spatial_photo': { type: Number, default: 0 }
    },
    
    // 标签偏好权重
    tagPreferences: { type: Map, of: Number, default: {} },
    
    // 互动行为权重
    interactionWeights: {
        view: { type: Number, default: 1 },
        complete: { type: Number, default: 2 },
        like: { type: Number, default: 3 },
        favorite: { type: Number, default: 4 },
        comment: { type: Number, default: 3 },
        share: { type: Number, default: 5 }
    },
    
    // 是否启用个性化推荐
    enablePersonalization: { type: Boolean, default: true },
    
    // 更新时间
    lastUpdated: { type: Date, default: Date.now }
});

// 推荐模型 - Recommendation.js
const recommendationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Content', required: true },
    type: { type: String, enum: ['editorial', 'personalized', 'trending', 'similar'], required: true },
    score: { type: Number, default: 0 },
    reason: { type: String, enum: ['admin_pick', 'similar_users', 'content_match', 'popular', 'continue_watching', 'new_creator'], required: true },
    status: { type: String, enum: ['active', 'clicked', 'dismissed', 'converted'], default: 'active' }
});

// 推荐控制器 - recommendationController.js
// 获取首页推荐内容
const getHomeRecommendations = async (req, res) => {
    try {
        const userId = req.userId;
        const { language = 'zh-CN' } = req.query;
        
        // 获取编辑精选内容
        const featuredContents = await RecommendationService.getEditorialRecommendations({
            featureType: 'homepage',
            language
        });
        
        // 获取个性化推荐
        const personalizedContents = await RecommendationService.getUserRecommendations(userId, {
            limit: 10,
            includeTypes: ['personalized']
        });
        
        // 获取热门内容
        const trendingContents = await RecommendationService.getTrendingRecommendations();
        
        // 获取继续观看列表
        const continueWatching = await ViewHistory.getContinueWatching(userId, 5);
        
        res.json({
            success: true,
            data: {
                featured: featuredContents,
                personalized: personalizedContents,
                trending: trendingContents,
                continueWatching: continueWatching
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};
```

## 八、管理员功能
```javascript
// 管理员控制器 - adminController.js
// 获取仪表盘统计
const getDashboardStats = async (req, res) => {
    try {
        // 用户统计
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ status: 'active' });
        const newUsers = await User.countDocuments({
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        });
        
        // 内容统计
        const totalContent = await Content.countDocuments();
        const publishedContent = await Content.countDocuments({ status: 'published' });
        const pendingReview = await Content.countDocuments({ status: 'pending_review' });
        
        // 订单统计
        const totalOrders = await Order.countDocuments();
        const completedOrders = await Order.countDocuments({ paymentStatus: 'paid' });
        const totalRevenue = await Order.aggregate([
            { $match: { paymentStatus: 'paid' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        
        // 订阅统计
        const activeSubscriptions = await Subscription.countDocuments({ status: 'active' });
        
        await logAdminAction(req, 'view_dashboard', 'system', null, {});
        
        res.json({
            success: true,
            data: {
                users: { total: totalUsers, active: activeUsers, new: newUsers },
                content: { total: totalContent, published: publishedContent, pendingReview: pendingReview },
                orders: { total: totalOrders, completed: completedOrders, revenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0 },
                subscriptions: { active: activeSubscriptions }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 获取创作者收益统计
const getCreatorIncomeStats = async (req, res) => {
    try {
        const { creatorId, period, year, month } = req.query;
        
        // 构建查询条件
        const query = {};
        if (creatorId) {
            query.creatorId = mongoose.Types.ObjectId(creatorId);
        }
        
        // 按来源统计收入
        const incomeBySource = await CreatorIncome.aggregate([
            { $match: query },
            { $group: {
                _id: '$source',
                totalAmount: { $sum: '$totalAmount' },
                platformFee: { $sum: '$platformFee' },
                netAmount: { $sum: '$netAmount' },
                count: { $sum: 1 }
            }}
        ]);
        
        // 按创作者统计收入
        const incomeByCreator = await CreatorIncome.aggregate([
            { $match: query },
            { $group: {
                _id: '$creatorId',
                totalAmount: { $sum: '$totalAmount' },
                netAmount: { $sum: '$netAmount' },
                count: { $sum: 1 }
            }},
            { $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'creator'
            }},
            { $unwind: '$creator' }
        ]);
        
        res.json({
            success: true,
            data: {
                bySource: incomeBySource,
                byCreator: incomeByCreator
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 审核内容
const reviewContent = async (req, res) => {
    try {
        const { contentId } = req.params;
        const { approved, reviewNote } = req.body;
        
        const content = await Content.findById(contentId);
        
        if (!content) {
            return res.status(404).json({
                success: false,
                error: '未找到',
                message: '内容不存在'
            });
        }
        
        // 更新审核信息
        content.review = {
            reviewedBy: req.userId,
            reviewedAt: new Date(),
            reviewNote
        };
        
        // 根据审核决定更新状态
        content.status = approved ? 'approved' : 'rejected';
        content.updatedAt = new Date();
        
        await content.save();
        
        await logAdminAction(req, 'review_content', 'content', contentId, { approved, reviewNote });
        
        res.json({
            success: true,
            message: `内容${approved ? '已批准' : '已拒绝'}`,
            data: { content }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};
```

## 九、系统功能
```javascript
// 多语言支持 - i18n.js
// 翻译字典
const translations = {
    'zh-CN': {
        'welcome': '欢迎使用Vision Pro内容平台',
        'error.not_found': '未找到',
        'error.validation_error': '验证错误',
        'error.unauthorized': '未授权',
        'error.server_error': '服务器错误',
        'success.saved': '保存成功',
        'success.deleted': '删除成功'
    },
    'en-US': {
        'welcome': 'Welcome to Vision Pro Content Platform',
        'error.not_found': 'Not Found',
        'error.validation_error': 'Validation Error',
        'error.unauthorized': 'Unauthorized',
        'error.server_error': 'Server Error',
        'success.saved': 'Successfully saved',
        'success.deleted': 'Successfully deleted'
    }
};

// 安全中间件 - security.js
const applySecurityMiddleware = app => {
    // 设置安全HTTP头
    app.use(helmet());
    
    // 防止XSS攻击
    app.use(xss());
    
    // 防止NoSQL注入
    app.use(mongoSanitize());
    
    // 防止HTTP参数污染
    app.use(hpp());
    
    // 应用速率限制
    app.use('/api', apiLimiter);
    app.use('/api/users/login', loginLimiter);
    app.use('/api/users/register', registerLimiter);
};

// 定时任务 - scheduledTasks.js
class ScheduledTasks {
    // 启动定时任务
    static initScheduledTasks() {
        // 每天凌晨3点更新所有用户的推荐
        cron.schedule('0 3 * * *', async () => {
            console.log('开始执行每日推荐更新...');
            await this.updateAllUsersRecommendations();
            console.log('每日推荐更新完成');
        });
        
        // 每4小时更新一次热门内容
        cron.schedule('0 */4 * * *', async () => {
            console.log('开始更新热门内容...');
            await this.updateTrendingRecommendations();
            console.log('热门内容更新完成');
        });
        
        // 每周一清理过期推荐
        cron.schedule('0 2 * * 1', async () => {
            console.log('开始清理过期推荐...');
            await this.cleanupExpiredRecommendations();
            console.log('过期推荐清理完成');
        });
    }
}

// 日志系统 - logger.js
const logger = winston.createLogger({
    level: level(),
    levels,
    format,
    transports: [
        // 控制台输出
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize({ all: true }),
                winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
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
    ]
});

// 错误处理 - errorHandler.js
// 错误处理中间件
const errorHandler = (err, req, res, next) => {
    console.error('API Error:', err);

    // Default error status and message
    const statusCode = err.statusCode || 500;
    const errorCode = err.errorCode || 'SERVER_ERROR';
    
    // Translate error message if i18n is available
    const message = req.__ ? req.__(errorCode, err.message) : err.message;
    
    res.status(statusCode).json({
        success: false,
        error: errorCode,
        message: message
    });
};
```
