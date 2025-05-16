// routes/contentRoutes.js
const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const { authenticate } = require('../middleware/auth');

// 内容相关路由
router.get('/', contentController.getContents);  // 公开内容列表（不需要认证）
router.post('/', authenticate, contentController.createContent);
router.get('/user', authenticate, contentController.getUserContents);
router.get('/:contentId', authenticate, contentController.getContent);
router.put('/:contentId', authenticate, contentController.updateContent);
router.delete('/:contentId', authenticate, contentController.deleteContent);

module.exports = router;


// 在文件末尾添加调试路由（仅在开发环境使用）
// 调试路由 - 查看所有内容（开发环境）
if (process.env.NODE_ENV !== 'production') {
    router.get('/debug/all', authenticate, async (req, res) => {
        try {
            const Content = require('../models/Content');
            
            // 查询所有内容，不加任何过滤条件
            const allContents = await Content.find({}).populate('creatorId');
            
            // 按状态分组统计
            const statusCount = await Content.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]);
            
            res.json({
                success: true,
                data: {
                    totalContents: allContents.length,
                    statusCount,
                    contents: allContents.map(content => ({
                        id: content._id,
                        title: content.title,
                        status: content.status,
                        contentType: content.contentType,
                        creatorId: content.creatorId,
                        createdAt: content.createdAt
                    }))
                }
            });
        } catch (error) {
            console.error('调试查询错误:', error);
            res.status(500).json({
                error: '调试查询失败',
                message: error.message
            });
        }
    });
}