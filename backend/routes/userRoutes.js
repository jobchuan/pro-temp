// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { validateRegister, validateLogin, validatePasswordChange } = require('../middleware/validation');

// 公开路由（不需要认证）
router.post('/register', validateRegister, userController.register);
router.post('/login', validateLogin, userController.login);

// 需要认证的路由
router.get('/me', authenticate, userController.getCurrentUser);
router.put('/profile', authenticate, userController.updateProfile);
router.put('/change-password', authenticate, validatePasswordChange, userController.changePassword);

module.exports = router;
