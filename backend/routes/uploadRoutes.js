// routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { authenticate } = require('../middleware/auth');

// 单文件上传
router.post('/single', authenticate, uploadController.uploadSingleFile);

// 多文件上传
router.post('/multiple', authenticate, uploadController.uploadMultipleFiles);

// 分片上传相关路由
router.post('/chunk/init', authenticate, uploadController.initChunkUpload);
router.post('/chunk/upload', authenticate, uploadController.uploadFileChunk);
router.post('/chunk/complete', authenticate, uploadController.completeChunkUpload);
router.delete('/chunk/:identifier', authenticate, uploadController.cancelUpload);
router.get('/chunk/:identifier/progress', authenticate, uploadController.getUploadProgress);

// 静态文件服务
router.use('/static', express.static('uploads'));

module.exports = router;
