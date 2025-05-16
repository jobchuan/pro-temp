// models/AdminLog.js
const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true
    },
    resourceType: {
        type: String,
        enum: ['user', 'content', 'order', 'subscription', 'comment', 'system'],
        required: true
    },
    resourceId: mongoose.Schema.Types.ObjectId,
    details: mongoose.Schema.Types.Mixed,
    ip: String,
    userAgent: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// 索引
adminLogSchema.index({ adminId: 1 });
adminLogSchema.index({ action: 1 });
adminLogSchema.index({ resourceType: 1 });
adminLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AdminLog', adminLogSchema);