// controllers/adminController.js
const User = require('../models/User');
const Content = require('../models/Content');
const Order = require('../models/Order');
const Comment = require('../models/Comment');
const Subscription = require('../models/Subscription');
const CreatorIncome = require('../models/CreatorIncome');
const AdminLog = require('../models/AdminLog');
const SystemSetting = require('../models/SystemSetting');
const mongoose = require('mongoose');

// 记录管理员操作
const logAdminAction = async (req, action, resourceType, resourceId, details) => {
    try {
        const log = new AdminLog({
            adminId: req.userId,
            action,
            resourceType,
            resourceId,
            details,
            ip: req.ip,
            userAgent: req.headers['user-agent']
        });
        await log.save();
    } catch (error) {
        console.error('记录管理员操作失败:', error);
    }
};

// 仪表盘统计
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
        
        // 添加更多统计数据
        // 内容类型分布
        const contentTypeDistribution = await Content.aggregate([
            { $group: { _id: '$contentType', count: { $sum: 1 } } }
        ]);
        
        // 用户角色分布
        const userRoleDistribution = await User.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } }
        ]);
        
        // 订单类型分布
        const orderTypeDistribution = await Order.aggregate([
            { $match: { paymentStatus: 'paid' } },
            { $group: { _id: '$orderType', count: { $sum: 1 }, amount: { $sum: '$amount' } } }
        ]);
        
        // 内容评价分布
        const contentRatingDistribution = await Content.aggregate([
            { 
                $group: { 
                    _id: null, 
                    totalLikes: { $sum: '$stats.likes' },
                    totalFavorites: { $sum: '$stats.favorites' },
                    totalViews: { $sum: '$stats.views' },
                    totalComments: { $sum: '$stats.comments' }
                } 
            }
        ]);
        
        // 近7天新用户
        const last7DaysUsers = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            
            const nextDate = new Date(date);
            nextDate.setDate(date.getDate() + 1);
            
            const count = await User.countDocuments({
                createdAt: {
                    $gte: date,
                    $lt: nextDate
                }
            });
            
            last7DaysUsers.push({
                date: date.toISOString().split('T')[0],
                count
            });
        }
        
        // 近7天收入
        const last7DaysRevenue = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            
            const nextDate = new Date(date);
            nextDate.setDate(date.getDate() + 1);
            
            const revenue = await Order.aggregate([
                { 
                    $match: { 
                        paymentStatus: 'paid',
                        paidAt: {
                            $gte: date,
                            $lt: nextDate
                        }
                    } 
                },
                { $group: { _id: null, amount: { $sum: '$amount' } } }
            ]);
            
            last7DaysRevenue.push({
                date: date.toISOString().split('T')[0],
                amount: revenue.length > 0 ? revenue[0].amount : 0
            });
        }
        
        await logAdminAction(req, 'view_dashboard', 'system', null, {});
        
        res.json({
            success: true,
            data: {
                users: {
                    total: totalUsers,
                    active: activeUsers,
                    new: newUsers
                },
                content: {
                    total: totalContent,
                    published: publishedContent,
                    pendingReview: pendingReview
                },
                orders: {
                    total: totalOrders,
                    completed: completedOrders,
                    revenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0
                },
                subscriptions: {
                    active: activeSubscriptions
                },
                contentTypeDistribution,
                userRoleDistribution,
                orderTypeDistribution,
                contentRatingDistribution: contentRatingDistribution.length > 0 ? contentRatingDistribution[0] : {},
                last7DaysUsers,
                last7DaysRevenue
            }
        });
    } catch (error) {
        console.error('获取仪表盘统计失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 用户管理功能
const listUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20, sort = '-createdAt', search, role, status } = req.query;
        
        // 构建查询条件
        const query = {};
        if (search) {
            query.$or = [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        if (role) query.role = role;
        if (status) query.status = status;
        
        // 执行查询
        const users = await User.find(query)
            .select('-password')
            .sort(sort)
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));
            
        const total = await User.countDocuments(query);
        
        await logAdminAction(req, 'list_users', 'user', null, { query });
        
        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('获取用户列表失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

const getUserDetails = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await User.findById(userId)
            .select('-password');
            
        if (!user) {
            return res.status(404).json({
                success: false,
                error: '未找到',
                message: '用户不存在'
            });
        }
        
        // 获取用户内容数量
        const contentCount = await Content.countDocuments({ creatorId: userId });
        
        // 获取用户订单历史
        const orders = await Order.find({ userId })
            .sort('-createdAt')
            .limit(10);
            
        // 获取用户订阅信息
        const subscription = await Subscription.findOne({ 
            userId, 
            status: { $in: ['active', 'cancelled'] } 
        });
        
        await logAdminAction(req, 'view_user_details', 'user', userId, {});
        
        res.json({
            success: true,
            data: {
                user,
                stats: {
                    contentCount,
                    hasSubscription: !!subscription,
                    subscription,
                    recentOrders: orders
                }
            }
        });
    } catch (error) {
        console.error('获取用户详情失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

const updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const updates = req.body;
        
        // 防止更新某些字段
        delete updates.password;
        delete updates._id;
        
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: '未找到',
                message: '用户不存在'
            });
        }
        
        // 应用更新
        Object.keys(updates).forEach(key => {
            user[key] = updates[key];
        });
        
        user.updatedAt = new Date();
        await user.save();
        
        await logAdminAction(req, 'update_user', 'user', userId, { updates });
        
        res.json({
            success: true,
            message: '用户更新成功',
            data: { user }
        });
    } catch (error) {
        console.error('更新用户失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

const updateUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status, reason } = req.body;
        
        if (!['active', 'suspended', 'deleted'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: '无效状态',
                message: '状态必须是: active, suspended, deleted'
            });
        }
        
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: '未找到',
                message: '用户不存在'
            });
        }
        
        // 不能修改其他管理员状态
        if (user.role === 'admin' && status !== 'active' && req.userId !== userId) {
            return res.status(403).json({
                success: false,
                error: '禁止操作',
                message: '不能修改管理员状态'
            });
        }
        
        user.status = status;
        user.updatedAt = new Date();
        await user.save();
        
        await logAdminAction(req, 'update_user_status', 'user', userId, { status, reason });
        
        res.json({
            success: true,
            message: `用户状态已更新为 ${status}`,
            data: { user }
        });
    } catch (error) {
        console.error('更新用户状态失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 内容管理功能
const listContents = async (req, res) => {
    try {
        const { page = 1, limit = 20, sort = '-createdAt', status, contentType, search } = req.query;
        
        // 构建查询条件
        const query = {};
        if (status) query.status = status;
        if (contentType) query.contentType = contentType;
        if (search) {
            query.$or = [
                { 'title.zh-CN': { $regex: search, $options: 'i' } },
                { 'title.en-US': { $regex: search, $options: 'i' } },
                { tags: { $in: [search] } }
            ];
        }
        
        // 执行查询
        const contents = await Content.find(query)
            .populate('creatorId', 'username email')
            .sort(sort)
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));
            
        const total = await Content.countDocuments(query);
        
        await logAdminAction(req, 'list_contents', 'content', null, { query });
        
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
        console.error('获取内容列表失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

const getContentDetails = async (req, res) => {
    try {
        const { contentId } = req.params;
        
        const content = await Content.findById(contentId)
            .populate('creatorId', 'username email profile');
            
        if (!content) {
            return res.status(404).json({
                success: false,
                error: '未找到',
                message: '内容不存在'
            });
        }
        
        // 获取评论统计
        const commentCount = await Comment.countDocuments({ contentId });
        
        await logAdminAction(req, 'view_content_details', 'content', contentId, {});
        
        res.json({
            success: true,
            data: {
                content,
                stats: {
                    commentCount
                }
            }
        });
    } catch (error) {
        console.error('获取内容详情失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

const updateContentStatus = async (req, res) => {
    try {
        const { contentId } = req.params;
        const { status, reason } = req.body;
        
        if (!['draft', 'pending_review', 'approved', 'rejected', 'published', 'archived'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: '无效状态',
                message: '状态必须是: draft, pending_review, approved, rejected, published, archived'
            });
        }
        
        const content = await Content.findById(contentId);
        
        if (!content) {
            return res.status(404).json({
                success: false,
                error: '未找到',
                message: '内容不存在'
            });
        }
        
        content.status = status;
        content.updatedAt = new Date();
        
        // 如果发布，设置publishedAt
        if (status === 'published' && !content.publishedAt) {
            content.publishedAt = new Date();
        }
        
        await content.save();
        
        await logAdminAction(req, 'update_content_status', 'content', contentId, { status, reason });
        
        res.json({
            success: true,
            message: `内容状态已更新为 ${status}`,
            data: { content }
        });
    } catch (error) {
        console.error('更新内容状态失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

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
        
        await logAdminAction(req, 'review_content', 'content', contentId, { 
            approved, 
            reviewNote 
        });
        
        res.json({
            success: true,
            message: `内容${approved ? '已批准' : '已拒绝'}`,
            data: { content }
        });
    } catch (error) {
        console.error('审核内容失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 评论管理功能
const listFlaggedComments = async (req, res) => {
    try {
        const { page = 1, limit = 20, status = 'flagged' } = req.query;
        
        // 构建查询条件
        const query = {};
        if (status) query.status = status;
        
        // 如果查找被举报的评论，查询reports字段
        if (status === 'flagged') {
            query['reports.0'] = { $exists: true };
        }
        
        // 执行查询
        const comments = await Comment.find(query)
            .populate('userId', 'username email profile')
            .populate('contentId', 'title')
            .sort('-createdAt')
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));
            
        const total = await Comment.countDocuments(query);
        
        await logAdminAction(req, 'list_flagged_comments', 'comment', null, { status });
        
        res.json({
            success: true,
            data: {
                comments,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('获取评论列表失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

const updateCommentStatus = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { status, reason } = req.body;
        
        if (!['active', 'deleted', 'hidden'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: '无效状态',
                message: '状态必须是: active, deleted, hidden'
            });
        }
        
        const comment = await Comment.findById(commentId);
        
        if (!comment) {
            return res.status(404).json({
                success: false,
                error: '未找到',
                message: '评论不存在'
            });
        }
        
        const previousStatus = comment.status;
        comment.status = status;
        
        // 如果删除评论，更新文本
        if (status === 'deleted') {
            comment.text = '[评论已被管理员删除]';
        }
        
        await comment.save();
        
        await logAdminAction(req, 'update_comment_status', 'comment', commentId, { 
            previousStatus,
            newStatus: status,
            reason
        });
        
        res.json({
            success: true,
            message: `评论状态已更新为 ${status}`,
            data: { comment }
        });
    } catch (error) {
        console.error('更新评论状态失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 系统设置功能
const getSystemSettings = async (req, res) => {
    try {
        const allSettings = await SystemSetting.find();
        
        // 转换为键值对对象
        const settings = {};
        allSettings.forEach(setting => {
            settings[setting.key] = setting.value;
        });
        
        await logAdminAction(req, 'view_system_settings', 'system', null, {});
        
        res.json({
            success: true,
            data: { settings }
        });
    } catch (error) {
        console.error('获取系统设置失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

const updateSystemSettings = async (req, res) => {
    try {
        const settings = req.body;
        
        // 验证设置
        if (settings.platformFee !== undefined && (settings.platformFee < 0 || settings.platformFee > 1)) {
            return res.status(400).json({
                success: false,
                error: '无效设置',
                message: '平台分成比例必须在0到1之间'
            });
        }
        
        // 更新或创建设置
        for (const [key, value] of Object.entries(settings)) {
            await SystemSetting.setSetting(key, value, null, null, req.userId);
        }
        
        await logAdminAction(req, 'update_system_settings', 'system', null, { settings });
        
        res.json({
            success: true,
            message: '系统设置已更新',
            data: { settings }
        });
    } catch (error) {
        console.error('更新系统设置失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 管理员日志功能
const getAdminLogs = async (req, res) => {
    try {
        const { page = 1, limit = 20, adminId, action, resourceType } = req.query;
        
        // 构建查询条件
        const query = {};
        if (adminId) query.adminId = adminId;
        if (action) query.action = action;
        if (resourceType) query.resourceType = resourceType;
        
        // 执行查询
        const logs = await AdminLog.find(query)
            .populate('adminId', 'username email')
            .sort('-createdAt')
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));
            
        const total = await AdminLog.countDocuments(query);
        
        res.json({
            success: true,
            data: {
                logs,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('获取管理员日志失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 订单管理功能
const listOrders = async (req, res) => {
    try {
        const { page = 1, limit = 20, sort = '-createdAt', status, type, search } = req.query;
        
        // 构建查询条件
        const query = {};
        if (status) query.paymentStatus = status;
        if (type) query.orderType = type;
        if (search) {
            query.$or = [
                { orderNo: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        
        // 执行查询
        const orders = await Order.find(query)
            .populate('userId', 'username email')
            .populate('relatedId')
            .sort(sort)
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));
            
        const total = await Order.countDocuments(query);
        
        await logAdminAction(req, 'list_orders', 'order', null, { query });
        
        res.json({
            success: true,
            data: {
                orders,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('获取订单列表失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

const getOrderDetails = async (req, res) => {
    try {
        const { orderNo } = req.params;
        
        const order = await Order.findOne({ orderNo })
            .populate('userId', 'username email profile')
            .populate('relatedId');
            
        if (!order) {
            return res.status(404).json({
                success: false,
                error: '未找到',
                message: '订单不存在'
            });
        }
        
        await logAdminAction(req, 'view_order_details', 'order', order._id, {});
        
        res.json({
            success: true,
            data: { order }
        });
    } catch (error) {
        console.error('获取订单详情失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { orderNo } = req.params;
        const { status, reason } = req.body;
        
        if (!['pending', 'paid', 'failed', 'cancelled', 'refunded'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: '无效状态',
                message: '状态必须是: pending, paid, failed, cancelled, refunded'
            });
        }
        
        const order = await Order.findOne({ orderNo });
        
        if (!order) {
            return res.status(404).json({
                success: false,
                error: '未找到',
                message: '订单不存在'
            });
        }
        
        const previousStatus = order.paymentStatus;
        order.paymentStatus = status;
        
        // 更新相关字段
        if (status === 'paid' && previousStatus !== 'paid') {
            order.paidAt = new Date();
            
            // 处理订单完成（激活订阅、处理内容购买等）
            const PaymentService = require('../services/paymentService');
            await PaymentService.processOrderCompletion(order);
        } else if (status === 'refunded' && !order.refund) {
            order.refund = {
                amount: order.amount,
                reason: reason || '管理员退款',
                requestedAt: new Date(),
                processedAt: new Date(),
                status: 'processed'
            };
        }
        
        await order.save();
        
        await logAdminAction(req, 'update_order_status', 'order', order._id, { 
            previousStatus,
            newStatus: status,
            reason
        });
        
        res.json({
            success: true,
            message: `订单状态已更新为 ${status}`,
            data: { order }
        });
    } catch (error) {
        console.error('更新订单状态失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 支付管理功能
const getPlatformIncome = async (req, res) => {
    try {
        const { period, year, month } = req.query;
        
        let startDate, endDate;
        
        // 根据周期计算日期范围
        if (period === 'today') {
            startDate = new Date();
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date();
            endDate.setHours(23, 59, 59, 999);
        } else if (period === 'week') {
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);
            endDate = new Date();
        } else if (period === 'month') {
            startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1);
            endDate = new Date();
        } else if (period === 'year') {
            startDate = new Date();
            startDate.setFullYear(startDate.getFullYear() - 1);
            endDate = new Date();
        } else if (year && month) {
            // 指定年月
            startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
        } else {
            // 默认当月
            startDate = new Date();
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date();
        }
        
        // 查询日期范围内的订单
        const orders = await Order.aggregate([
            { 
                $match: { 
                    paymentStatus: 'paid',
                    paidAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: '$orderType',
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);
        
        // 计算平台收入
        const incomeBySource = await CreatorIncome.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: '$source',
                    totalAmount: { $sum: '$totalAmount' },
                    platformFee: { $sum: '$platformFee' },
                    netAmountToCreators: { $sum: '$netAmount' },
                    count: { $sum: 1 }
                }
            }
        ]);
        
        // 计算总额
        const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const totalPlatformFee = incomeBySource.reduce((sum, source) => sum + source.platformFee, 0);
        const totalToCreators = incomeBySource.reduce((sum, source) => sum + source.netAmountToCreators, 0);
        
        await logAdminAction(req, 'view_platform_income', 'system', null, { period, year, month });
        
        res.json({
            success: true,
            data: {
                period: {
                    startDate,
                    endDate
                },
                summary: {
                    totalRevenue,
                    totalPlatformFee,
                    totalToCreators,
                    orderCount: orders.reduce((sum, order) => sum + order.count, 0)
                },
                byOrderType: orders,
                byIncomeSource: incomeBySource
            }
        });
    } catch (error) {
        console.error('获取平台收入失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};
// 在 adminController.js 中添加以下函数

// 获取提现请求
const getWithdrawalRequests = async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        
        // 构建查询条件
        const query = { withdrawStatus: 'processing' };
        if (status) query.withdrawStatus = status;
        
        // 获取提现请求
        const withdrawals = await CreatorIncome.find(query)
            .populate('creatorId', 'username email profile')
            .sort('-withdrawal.requestedAt')
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));
            
        const total = await CreatorIncome.countDocuments(query);
        
        // 按创作者分组
        const groupedByCreator = {};
        withdrawals.forEach(withdrawal => {
            const creatorId = withdrawal.creatorId._id.toString();
            if (!groupedByCreator[creatorId]) {
                groupedByCreator[creatorId] = {
                    creator: withdrawal.creatorId,
                    totalAmount: 0,
                    withdrawals: []
                };
            }
            
            groupedByCreator[creatorId].totalAmount += withdrawal.netAmount;
            groupedByCreator[creatorId].withdrawals.push(withdrawal);
        });
        
        await logAdminAction(req, 'view_withdrawal_requests', 'system', null, { status });
        
        res.json({
            success: true,
            data: {
                withdrawalsByCreator: Object.values(groupedByCreator),
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('获取提现请求失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 处理提现请求
const processWithdrawal = async (req, res) => {
    try {
        const { id } = req.params;
        const { approved, reason, batchId } = req.body;
        
        const withdrawal = await CreatorIncome.findById(id);
        
        if (!withdrawal) {
            return res.status(404).json({
                success: false,
                error: '未找到',
                message: '提现请求不存在'
            });
        }
        
        if (withdrawal.withdrawStatus !== 'processing') {
            return res.status(400).json({
                success: false,
                error: '无效状态',
                message: '提现请求不是处理中状态'
            });
        }
        
        if (approved) {
            // 标记为已完成
            withdrawal.withdrawStatus = 'withdrawn';
            withdrawal.withdrawal.processedAt = new Date();
            withdrawal.withdrawal.batchId = batchId || `BATCH_${Date.now()}`;
            withdrawal.withdrawal.status = 'completed';
        } else {
            // 标记为失败
            withdrawal.withdrawStatus = 'failed';
            withdrawal.withdrawal.processedAt = new Date();
            withdrawal.withdrawal.status = 'failed';
            withdrawal.withdrawal.reason = reason;
        }
        
        await withdrawal.save();
        
        await logAdminAction(req, 'process_withdrawal', 'system', withdrawal._id, { 
            approved,
            reason,
            batchId
        });
        
        res.json({
            success: true,
            message: `提现请求${approved ? '已批准' : '已拒绝'}`,
            data: { withdrawal }
        });
    } catch (error) {
        console.error('处理提现请求失败:', error);
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
        
        let startDate, endDate;
        
        // 计算日期范围
        if (period === 'month' && year && month) {
            startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
        } else if (period === 'year' && year) {
            startDate = new Date(parseInt(year), 0, 1);
            endDate = new Date(parseInt(year), 11, 31, 23, 59, 59, 999);
        } else {
            // 默认当月
            const now = new Date();
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        }
        
        // 构建查询条件
        const query = {
            createdAt: { $gte: startDate, $lte: endDate }
        };
        
        if (creatorId) {
            query.creatorId = mongoose.Types.ObjectId(creatorId);
        }
        
        // 按来源统计收入
        const incomeBySource = await CreatorIncome.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$source',
                    totalAmount: { $sum: '$totalAmount' },
                    platformFee: { $sum: '$platformFee' },
                    netAmount: { $sum: '$netAmount' },
                    count: { $sum: 1 }
                }
            }
        ]);
        
        // 按创作者统计收入
        const incomeByCreator = await CreatorIncome.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$creatorId',
                    totalAmount: { $sum: '$totalAmount' },
                    platformFee: { $sum: '$platformFee' },
                    netAmount: { $sum: '$netAmount' },
                    count: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'creator'
                }
            },
            {
                $unwind: '$creator'
            },
            {
                $project: {
                    creatorId: '$_id',
                    totalAmount: 1,
                    platformFee: 1,
                    netAmount: 1,
                    count: 1,
                    creatorName: '$creator.username',
                    creatorEmail: '$creator.email'
                }
            }
        ]);
        
        // 计算总金额
        const totalStats = {
            totalAmount: incomeBySource.reduce((sum, item) => sum + item.totalAmount, 0),
            platformFee: incomeBySource.reduce((sum, item) => sum + item.platformFee, 0),
            netAmount: incomeBySource.reduce((sum, item) => sum + item.netAmount, 0),
            count: incomeBySource.reduce((sum, item) => sum + item.count, 0)
        };
        
        await logAdminAction(req, 'view_creator_income_stats', 'system', null, { 
            creatorId, 
            period, 
            year, 
            month 
        });
        
        res.json({
            success: true,
            data: {
                period: {
                    startDate,
                    endDate
                },
                summary: totalStats,
                bySource: incomeBySource,
                byCreator: incomeByCreator
            }
        });
    } catch (error) {
        console.error('获取创作者收益统计失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};
// 在 adminController.js 中添加

// 获取用户增长数据
const getUserGrowthStats = async (req, res) => {
    try {
        const { period = 'month', count = 12 } = req.query;
        const today = new Date();
        let results = [];
        
        if (period === 'day') {
            // 按天统计过去30天
            const startDate = new Date();
            startDate.setDate(today.getDate() - parseInt(count) + 1);
            startDate.setHours(0, 0, 0, 0);
            
            for (let i = 0; i < parseInt(count); i++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + i);
                
                const nextDate = new Date(currentDate);
                nextDate.setDate(currentDate.getDate() + 1);
                
                const newUsers = await User.countDocuments({
                    createdAt: {
                        $gte: currentDate,
                        $lt: nextDate
                    }
                });
                
                results.push({
                    date: currentDate.toISOString().split('T')[0],
                    newUsers
                });
            }
        } else if (period === 'month') {
            // 按月统计过去12个月
            for (let i = 0; i < parseInt(count); i++) {
                const currentMonth = new Date(today);
                currentMonth.setMonth(today.getMonth() - i);
                currentMonth.setDate(1);
                currentMonth.setHours(0, 0, 0, 0);
                
                const nextMonth = new Date(currentMonth);
                nextMonth.setMonth(currentMonth.getMonth() + 1);
                
                const newUsers = await User.countDocuments({
                    createdAt: {
                        $gte: currentMonth,
                        $lt: nextMonth
                    }
                });
                
                results.push({
                    date: `${currentMonth.getFullYear()}-${(currentMonth.getMonth() + 1).toString().padStart(2, '0')}`,
                    newUsers
                });
            }
            
            // 反转顺序，使其按时间顺序排列
            results.reverse();
        }
        
        await logAdminAction(req, 'view_user_growth_stats', 'system', null, { period });
        
        res.json({
            success: true,
            data: {
                period,
                stats: results
            }
        });
    } catch (error) {
        console.error('获取用户增长统计失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 获取内容发布数据
const getContentPublishStats = async (req, res) => {
    try {
        const { period = 'month', count = 12 } = req.query;
        const today = new Date();
        let results = [];
        
        if (period === 'day') {
            // 按天统计过去30天
            const startDate = new Date();
            startDate.setDate(today.getDate() - parseInt(count) + 1);
            startDate.setHours(0, 0, 0, 0);
            
            for (let i = 0; i < parseInt(count); i++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + i);
                
                const nextDate = new Date(currentDate);
                nextDate.setDate(currentDate.getDate() + 1);
                
                const newContents = await Content.countDocuments({
                    createdAt: {
                        $gte: currentDate,
                        $lt: nextDate
                    }
                });
                
                const publishedContents = await Content.countDocuments({
                    publishedAt: {
                        $gte: currentDate,
                        $lt: nextDate
                    }
                });
                
                results.push({
                    date: currentDate.toISOString().split('T')[0],
                    newContents,
                    publishedContents
                });
            }
        } else if (period === 'month') {
            // 按月统计过去12个月
            for (let i = 0; i < parseInt(count); i++) {
                const currentMonth = new Date(today);
                currentMonth.setMonth(today.getMonth() - i);
                currentMonth.setDate(1);
                currentMonth.setHours(0, 0, 0, 0);
                
                const nextMonth = new Date(currentMonth);
                nextMonth.setMonth(currentMonth.getMonth() + 1);
                
                const newContents = await Content.countDocuments({
                    createdAt: {
                        $gte: currentMonth,
                        $lt: nextMonth
                    }
                });
                
                const publishedContents = await Content.countDocuments({
                    publishedAt: {
                        $gte: currentMonth,
                        $lt: nextMonth
                    }
                });
                
                results.push({
                    date: `${currentMonth.getFullYear()}-${(currentMonth.getMonth() + 1).toString().padStart(2, '0')}`,
                    newContents,
                    publishedContents
                });
            }
            
            // 反转顺序，使其按时间顺序排列
            results.reverse();
        }
        
        await logAdminAction(req, 'view_content_publish_stats', 'system', null, { period });
        
        res.json({
            success: true,
            data: {
                period,
                stats: results
            }
        });
    } catch (error) {
        console.error('获取内容发布统计失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 获取收入趋势
const getRevenueTrends = async (req, res) => {
    try {
        const { period = 'month', count = 12 } = req.query;
        const today = new Date();
        let results = [];
        
        if (period === 'day') {
            // 按天统计过去30天
            const startDate = new Date();
            startDate.setDate(today.getDate() - parseInt(count) + 1);
            startDate.setHours(0, 0, 0, 0);
            
            for (let i = 0; i < parseInt(count); i++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + i);
                
                const nextDate = new Date(currentDate);
                nextDate.setDate(currentDate.getDate() + 1);
                
                const revenue = await Order.aggregate([
                    {
                        $match: {
                            paymentStatus: 'paid',
                            paidAt: {
                                $gte: currentDate,
                                $lt: nextDate
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalAmount: { $sum: '$amount' }
                        }
                    }
                ]);
                
                results.push({
                    date: currentDate.toISOString().split('T')[0],
                    revenue: revenue.length > 0 ? revenue[0].totalAmount : 0
                });
            }
        } else if (period === 'month') {
            // 按月统计过去12个月
            for (let i = 0; i < parseInt(count); i++) {
                const currentMonth = new Date(today);
                currentMonth.setMonth(today.getMonth() - i);
                currentMonth.setDate(1);
                currentMonth.setHours(0, 0, 0, 0);
                
                const nextMonth = new Date(currentMonth);
                nextMonth.setMonth(currentMonth.getMonth() + 1);
                
                const revenue = await Order.aggregate([
                    {
                        $match: {
                            paymentStatus: 'paid',
                            paidAt: {
                                $gte: currentMonth,
                                $lt: nextMonth
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalAmount: { $sum: '$amount' }
                        }
                    }
                ]);
                
                results.push({
                    date: `${currentMonth.getFullYear()}-${(currentMonth.getMonth() + 1).toString().padStart(2, '0')}`,
                    revenue: revenue.length > 0 ? revenue[0].totalAmount : 0
                });
            }
            
            // 反转顺序，使其按时间顺序排列
            results.reverse();
        }
        
        await logAdminAction(req, 'view_revenue_trends', 'system', null, { period });
        
        res.json({
            success: true,
            data: {
                period,
                stats: results
            }
        });
    } catch (error) {
        console.error('获取收入趋势失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};
// 在 adminController.js 中添加通知管理功能

// 获取通知列表
const listNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, type } = req.query;
        
        // 构建查询条件
        const query = {};
        if (status) query.status = status;
        if (type) query.type = type;
        
        // 执行查询
        const notifications = await Notification.find(query)
            .populate('createdBy', 'username')
            .sort('-createdAt')
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));
            
        const total = await Notification.countDocuments(query);
        
        await logAdminAction(req, 'list_notifications', 'system', null, { query });
        
        res.json({
            success: true,
            data: {
                notifications,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('获取通知列表失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 创建通知
const createNotification = async (req, res) => {
    try {
        const { title, content, type, recipients, specificRecipients, priority, startDate, endDate } = req.body;
        
        // 验证必填字段
        if (!title || !content) {
            return res.status(400).json({
                success: false,
                error: '缺少必填字段',
                message: '标题和内容不能为空'
            });
        }
        
        // 创建通知
        const notification = new Notification({
            title,
            content,
            type: type || 'system',
            recipients: recipients || 'all',
            specificRecipients: specificRecipients || [],
            priority: priority || 'normal',
            startDate: startDate ? new Date(startDate) : new Date(),
            endDate: endDate ? new Date(endDate) : null,
            createdBy: req.userId,
            status: 'draft'
        });
        
        await notification.save();
        
        await logAdminAction(req, 'create_notification', 'system', notification._id, {
            title,
            type,
            recipients
        });
        
        res.status(201).json({
            success: true,
            message: '通知创建成功',
            data: { notification }
        });
    } catch (error) {
        console.error('创建通知失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 更新通知
const updateNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        const notification = await Notification.findById(id);
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                error: '未找到',
                message: '通知不存在'
            });
        }
        
        // 如果通知已发布，仅允许更新某些字段
        if (notification.status === 'published') {
            const allowedUpdates = ['endDate'];
            
            Object.keys(updates).forEach(key => {
                if (allowedUpdates.includes(key)) {
                    notification[key] = updates[key];
                }
            });
        } else {
            // 草稿状态可以更新所有字段
            const allowedUpdates = ['title', 'content', 'type', 'recipients', 'specificRecipients', 'priority', 'startDate', 'endDate'];
            
            Object.keys(updates).forEach(key => {
                if (allowedUpdates.includes(key)) {
                    notification[key] = updates[key];
                }
            });
        }
        
        notification.updatedAt = new Date();
        await notification.save();
        
        await logAdminAction(req, 'update_notification', 'system', notification._id, { updates });
        
        res.json({
            success: true,
            message: '通知更新成功',
            data: { notification }
        });
    } catch (error) {
        console.error('更新通知失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 发布通知
const publishNotification = async (req, res) => {
    try {
        const { id } = req.params;
        
        const notification = await Notification.findById(id);
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                error: '未找到',
                message: '通知不存在'
            });
        }
        
        if (notification.status === 'published') {
            return res.status(400).json({
                success: false,
                error: '操作失败',
                message: '通知已经发布'
            });
        }
        
        notification.status = 'published';
        notification.updatedAt = new Date();
        await notification.save();
        
        // TODO: 实现通知推送给目标用户的逻辑
        
        await logAdminAction(req, 'publish_notification', 'system', notification._id, {});
        
        res.json({
            success: true,
            message: '通知已发布',
            data: { notification }
        });
    } catch (error) {
        console.error('发布通知失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 删除通知
const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        
        const notification = await Notification.findById(id);
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                error: '未找到',
                message: '通知不存在'
            });
        }
        
        if (notification.status === 'published') {
            return res.status(400).json({
                success: false,
                error: '操作失败',
                message: '已发布的通知不能删除'
            });
        }
        
        await notification.remove();
        
        await logAdminAction(req, 'delete_notification', 'system', id, {});
        
        res.json({
            success: true,
            message: '通知已删除'
        });
    } catch (error) {
        console.error('删除通知失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};


module.exports = {
    getDashboardStats,
    listUsers,
    getUserDetails,
    updateUser,
    updateUserStatus,
    listContents,
    getContentDetails,
    updateContentStatus,
    reviewContent,
    listOrders,
    getOrderDetails,
    updateOrderStatus,
    getPlatformIncome,
    listFlaggedComments,
    updateCommentStatus,
    getSystemSettings,
    updateSystemSettings,
    getAdminLogs,
    getWithdrawalRequests,
    processWithdrawal,
    getCreatorIncomeStats,
    getUserGrowthStats,
    getContentPublishStats,
    getRevenueTrends,
    listNotifications,
    createNotification,
    updateNotification,
    publishNotification,
    deleteNotification
};