// routes/recommendationRoutes.js
const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const { authenticate, authorize } = require('../middleware/auth');

// 应用认证中间件
router.use(authenticate);

// 用户推荐路由
router.get('/home', recommendationController.getHomeRecommendations);
router.get('/content/:contentId', recommendationController.getContentRecommendations);
router.get('/category/:category', recommendationController.getCategoryRecommendations);
router.post('/interaction', recommendationController.recordInteractionAndUpdateRecommendations);

// 用户偏好设置
router.get('/preferences', recommendationController.getUserPreferences);
router.put('/preferences', recommendationController.updateUserPreferences);

// 管理员路由 - 需要管理员权限
router.post('/featured', authenticate, authorize('admin'), recommendationController.createFeaturedContent);
router.get('/featured', authenticate, authorize('admin'), recommendationController.getFeaturedContents);
router.put('/featured/:featuredId', authenticate, authorize('admin'), recommendationController.updateFeaturedContent);
router.delete('/featured/:featuredId', authenticate, authorize('admin'), recommendationController.deleteFeaturedContent);

module.exports = router;