// routes/interactionRoutes.js
const express = require('express');
const router = express.Router();
const interactionController = require('../controllers/interactionController');
const { authenticate } = require('../middleware/auth');

// 点赞/收藏相关
router.post('/content/:contentId/like', authenticate, interactionController.toggleLike);
router.post('/content/:contentId/favorite', authenticate, interactionController.toggleFavorite);
router.get('/content/:contentId/status', authenticate, interactionController.getInteractionStatus);

// 评论相关
router.post('/content/:contentId/comments', authenticate, interactionController.addComment);
router.get('/content/:contentId/comments', interactionController.getComments);
router.delete('/comments/:commentId', authenticate, interactionController.deleteComment);

// 观看历史相关
router.post('/content/:contentId/view', authenticate, interactionController.recordViewHistory);
router.get('/history', authenticate, interactionController.getViewHistory);
router.get('/continue-watching', authenticate, interactionController.getContinueWatching);

// 离线下载相关
router.post('/content/:contentId/offline', authenticate, interactionController.createOfflineDownload);
router.get('/offline', authenticate, interactionController.getOfflineContent);

// 弹幕相关
router.post('/content/:contentId/danmaku', authenticate, interactionController.sendDanmaku);
router.get('/content/:contentId/danmaku', interactionController.getDanmakuList);
router.get('/content/:contentId/danmaku/density', interactionController.getDanmakuDensity);

module.exports = router;