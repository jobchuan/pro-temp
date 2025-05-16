// routes/creatorRoutes.js
const express = require('express');
const router = express.Router();
const creatorController = require('../controllers/creatorController');
const { authenticate, authorize } = require('../middleware/auth');

// 应用认证和创作者权限中间件
router.use(authenticate, authorize('creator'));

// 内容管理
router.get('/contents', creatorController.getCreatorContents);
router.get('/contents/:contentId', creatorController.getContentDetails);
router.post('/contents', creatorController.createContent);
router.put('/contents/:contentId', creatorController.updateContent);
router.delete('/contents/:contentId', creatorController.deleteContent);
router.put('/contents/:contentId/status', creatorController.updateContentStatus);

// 内容数据分析
router.get('/analytics/overview', creatorController.getAnalyticsOverview);
router.get('/analytics/contents/:contentId', creatorController.getContentAnalytics);
router.get('/analytics/trends', creatorController.getAnalyticsTrends);
router.get('/analytics/audience', creatorController.getAudienceAnalytics);

// 评论管理
router.get('/comments', creatorController.getCreatorComments);
router.get('/contents/:contentId/comments', creatorController.getContentComments);
router.post('/comments/:commentId/reply', creatorController.replyToComment);
router.put('/comments/:commentId/pin', creatorController.pinComment);
router.put('/comments/:commentId/status', creatorController.updateCommentStatus);

// 收入管理
router.get('/income/overview', creatorController.getIncomeOverview);
router.get('/income/details', creatorController.getIncomeDetails);
router.get('/income/trends', creatorController.getIncomeTrends);
router.post('/income/withdraw', creatorController.requestWithdrawal);
router.get('/income/withdrawals', creatorController.getWithdrawalHistory);

// 创作者设置
router.get('/profile', creatorController.getCreatorProfile);
router.put('/profile', creatorController.updateCreatorProfile);
router.put('/payment-info', creatorController.updatePaymentInfo);
router.put('/notification-settings', creatorController.updateNotificationSettings);

// 导出功能
router.get('/contents/:contentId/export/:format', creatorController.exportContentData);

// 收入分析功能
router.get('/income/analytics', creatorController.getIncomeAnalytics);

// 通知功能
router.get('/notifications', creatorController.getNotifications);
router.put('/notifications/read', creatorController.markNotificationsAsRead);

// 批量操作路由
router.put('/contents/batch/status', creatorController.batchUpdateContentsStatus);
router.put('/contents/batch/tags/add', creatorController.batchAddTags);
router.put('/contents/batch/tags/remove', creatorController.batchRemoveTags);
router.put('/contents/batch/category', creatorController.batchUpdateCategory);
router.delete('/contents/batch', creatorController.batchDeleteContents);

module.exports = router;