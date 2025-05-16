// routes/mediaRoutes.js
const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');
const { authenticate } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/temp/' });

// 应用认证中间件
router.use(authenticate);

// 字幕上传路由
router.post('/content/:contentId/subtitles', upload.single('subtitle'), mediaController.uploadSubtitle);

// 旁白上传路由
router.post('/content/:contentId/narrations', upload.single('narration'), mediaController.uploadNarration);

// 背景音乐上传路由
router.post('/content/:contentId/background-music', upload.single('music'), mediaController.uploadBackgroundMusic);

// 照片设置更新路由
router.put('/content/:contentId/photo-settings', mediaController.updatePhotoSettings);

module.exports = router;