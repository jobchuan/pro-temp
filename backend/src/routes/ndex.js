// src/routes/index.js
const express = require('express');
const router = express.Router();

const userRoutes = require('./userRoutes');
const contentRoutes = require('./contentRoutes');
const collaborationRoutes = require('./collaborationRoutes');
const uploadRoutes = require('./uploadRoutes');
const paymentRoutes = require('./paymentRoutes');
const interactionRoutes = require('./interactionRoutes');
const adminRoutes = require('./adminRoutes');
const creatorRoutes = require('./creatorRoutes');
const mediaRoutes = require('./mediaRoutes');
const fusionRoutes = require('./fusionRoutes');
const recommendationRoutes = require('./recommendationRoutes');

router.use('/users', userRoutes);
router.use('/contents', contentRoutes);
router.use('/collaborations', collaborationRoutes);
router.use('/upload', uploadRoutes);
router.use('/payment', paymentRoutes);
router.use('/interactions', interactionRoutes);
router.use('/admin', adminRoutes);
router.use('/creator', creatorRoutes);
router.use('/media', mediaRoutes);
router.use('/fusions', fusionRoutes);
router.use('/recommendations', recommendationRoutes);

module.exports = router;ß