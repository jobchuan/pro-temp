// routes/fusionRoutes.js
const express = require('express');
const router = express.Router();
const fusionController = require('../controllers/fusionController');
const { authenticate, authorize } = require('../middleware/auth');

// 应用认证中间件
router.use(authenticate);

// 融合内容管理路由
router.get('/', fusionController.getFusionContents);
router.post('/', fusionController.createFusionContent);
router.get('/:fusionId', fusionController.getFusionContent);
router.put('/:fusionId', fusionController.updateFusionContent);
router.delete('/:fusionId', fusionController.deleteFusionContent);

// 融合内容中的内容管理
router.post('/:fusionId/contents', fusionController.addContentToFusion);
router.delete('/:fusionId/contents/:contentId', fusionController.removeContentFromFusion);
router.put('/:fusionId/contents/:contentId', fusionController.updateContentSettings);
router.put('/:fusionId/contents/reorder', fusionController.reorderFusionContents);

// 融合内容分析
router.get('/:fusionId/analytics', fusionController.getFusionAnalytics);

module.exports = router;