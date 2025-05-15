// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

// 应用管理员权限验证
router.use(authenticate, authorize('admin'));

// 仪表盘统计
router.get('/dashboard', adminController.getDashboardStats);

// 用户管理
router.get('/users', adminController.listUsers);
router.get('/users/:userId', adminController.getUserDetails);
router.put('/users/:userId', adminController.updateUser);
router.put('/users/:userId/status', adminController.updateUserStatus);

// 内容管理
router.get('/contents', adminController.listContents);
router.get('/contents/:contentId', adminController.getContentDetails);
router.put('/contents/:contentId/status', adminController.updateContentStatus);
router.put('/contents/:contentId/review', adminController.reviewContent);

// 订单管理
router.get('/orders', adminController.listOrders);
router.get('/orders/:orderNo', adminController.getOrderDetails);
router.put('/orders/:orderNo/status', adminController.updateOrderStatus);

// 支付管理
router.get('/payments/income', adminController.getPlatformIncome);

// 创作者收益和提现管理
router.get('/payments/withdrawals', adminController.getWithdrawalRequests);
router.put('/payments/withdrawals/:id/process', adminController.processWithdrawal);
router.get('/payments/creator-income', adminController.getCreatorIncomeStats);

// 评论和交互管理
router.get('/comments', adminController.listFlaggedComments);
router.put('/comments/:commentId/status', adminController.updateCommentStatus);

// 报表和统计
router.get('/reports/user-growth', adminController.getUserGrowthStats);
router.get('/reports/content-publish', adminController.getContentPublishStats);
router.get('/reports/revenue-trends', adminController.getRevenueTrends);

// 通知管理
router.get('/notifications', adminController.listNotifications);
router.post('/notifications', adminController.createNotification);
router.put('/notifications/:id', adminController.updateNotification);
router.put('/notifications/:id/publish', adminController.publishNotification);
router.delete('/notifications/:id', adminController.deleteNotification);

// 系统设置
router.get('/settings', adminController.getSystemSettings);
router.put('/settings', adminController.updateSystemSettings);

// 管理员日志
router.get('/logs', adminController.getAdminLogs);

module.exports = router;