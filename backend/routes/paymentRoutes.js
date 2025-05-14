// routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate, authorize } = require('../middleware/auth');

// 创建订单
router.post('/order/subscription', authenticate, paymentController.createSubscriptionOrder);
router.post('/order/content', authenticate, paymentController.createContentOrder);
router.post('/order/tip', authenticate, paymentController.createTipOrder);

// 支付回调（公开接口，不需要认证）
router.post('/callback/alipay', paymentController.alipayCallback);
router.post('/callback/wechat', paymentController.wechatCallback);
router.post('/callback/stripe', express.raw({ type: 'application/json' }), paymentController.stripeCallback);
router.post('/callback/apple', paymentController.appleSubscriptionNotification);

// Apple内购相关
router.post('/apple/verify', authenticate, paymentController.verifyAppleIAP);
router.post('/apple/restore', authenticate, paymentController.restoreAppleIAP);

// 订单查询
router.get('/order/:orderNo', authenticate, paymentController.queryOrderStatus);
router.get('/orders', authenticate, paymentController.getUserOrders);

// 订阅管理
router.get('/subscription', authenticate, paymentController.getUserSubscription);
router.post('/subscription/cancel', authenticate, paymentController.cancelSubscription);

// 创作者收入管理
router.get('/creator/income', authenticate, authorize('creator'), paymentController.getCreatorIncome);
router.post('/creator/withdraw', authenticate, authorize('creator'), paymentController.requestWithdrawal);

module.exports = router;
