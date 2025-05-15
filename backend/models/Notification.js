// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['system', 'announcement', 'personal'],
        default: 'system'
    },
    recipients: {
        type: String,
        enum: ['all', 'users', 'creators', 'admins', 'specific'],
        default: 'all'
    },
    specificRecipients: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'draft'
    },
    priority: {
        type: String,
        enum: ['low', 'normal', 'high'],
        default: 'normal'
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: Date,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// 索引
notificationSchema.index({ status: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ recipients: 1 });
notificationSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model('Notification', notificationSchema);