// models/Collaboration.js
const mongoose = require('mongoose');

const collaborationSchema = new mongoose.Schema({
    // 内容引用
    contentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Content',
        required: true
    },
    
    // 创建者（内容所有者）
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // 协作者列表
    collaborators: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        role: {
            type: String,
            enum: ['editor', 'viewer', 'commenter'],
            default: 'viewer'
        },
        permissions: {
            canEdit: { type: Boolean, default: false },
            canDelete: { type: Boolean, default: false },
            canInvite: { type: Boolean, default: false },
            canPublish: { type: Boolean, default: false },
            canManageVersions: { type: Boolean, default: false }
        },
        invitedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        invitedAt: { type: Date, default: Date.now },
        acceptedAt: Date,
        lastActiveAt: Date,
        status: {
            type: String,
            enum: ['pending', 'accepted', 'declined', 'removed'],
            default: 'pending'
        }
    }],
    
    // 协作设置
    settings: {
        allowPublicView: { type: Boolean, default: false },
        allowComments: { type: Boolean, default: true },
        requireApprovalForChanges: { type: Boolean, default: false },
        autoSaveInterval: { type: Number, default: 30 }, // 秒
        maxCollaborators: { type: Number, default: 10 }
    },
    
    // 协作历史记录
    history: [{
        action: {
            type: String,
            enum: ['created', 'edited', 'invited', 'removed', 'permission_changed', 'published']
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        targetUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        details: mongoose.Schema.Types.Mixed,
        timestamp: { type: Date, default: Date.now }
    }],
    
    // 当前编辑状态
    editingStatus: {
        isLocked: { type: Boolean, default: false },
        lockedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        lockedAt: Date,
        activeEditors: [{
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            startedAt: Date,
            lastActiveAt: Date
        }]
    },
    
    // 通知设置
    notifications: {
        onEdit: { type: Boolean, default: true },
        onComment: { type: Boolean, default: true },
        onInvite: { type: Boolean, default: true },
        onPublish: { type: Boolean, default: true }
    },
    
    // 统计信息
    stats: {
        totalEdits: { type: Number, default: 0 },
        totalComments: { type: Number, default: 0 },
        totalVersions: { type: Number, default: 1 }
    },
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// 索引
collaborationSchema.index({ contentId: 1 });
collaborationSchema.index({ ownerId: 1 });
collaborationSchema.index({ 'collaborators.userId': 1 });

// 实例方法：添加协作者
collaborationSchema.methods.addCollaborator = async function(userId, role, permissions, invitedBy) {
    // 检查是否已经是协作者
    const existingCollaborator = this.collaborators.find(
        c => c.userId.toString() === userId.toString()
    );
    
    if (existingCollaborator) {
        throw new Error('该用户已经是协作者');
    }
    
    // 检查是否超过最大协作者数量
    if (this.collaborators.length >= this.settings.maxCollaborators) {
        throw new Error('已达到最大协作者数量限制');
    }
    
    // 添加协作者
    this.collaborators.push({
        userId,
        role,
        permissions,
        invitedBy,
        invitedAt: new Date()
    });
    
    // 添加历史记录
    this.history.push({
        action: 'invited',
        userId: invitedBy,
        targetUserId: userId,
        details: { role, permissions }
    });
    
    await this.save();
};

// 实例方法：接受邀请
collaborationSchema.methods.acceptInvitation = async function(userId) {
    const collaborator = this.collaborators.find(
        c => c.userId.toString() === userId.toString() && c.status === 'pending'
    );
    
    if (!collaborator) {
        throw new Error('邀请不存在或已处理');
    }
    
    collaborator.status = 'accepted';
    collaborator.acceptedAt = new Date();
    collaborator.lastActiveAt = new Date();
    
    await this.save();
};

// 实例方法：检查用户权限
collaborationSchema.methods.checkPermission = function(userId, permission) {
    // 所有者拥有所有权限
    if (this.ownerId.toString() === userId.toString()) {
        return true;
    }
    
    // 查找协作者
    const collaborator = this.collaborators.find(
        c => c.userId.toString() === userId.toString() && c.status === 'accepted'
    );
    
    if (!collaborator) {
        return false;
    }
    
    // 检查特定权限
    return collaborator.permissions[permission] || false;
};

// 实例方法：更新协作者权限
collaborationSchema.methods.updateCollaboratorPermissions = async function(userId, targetUserId, newPermissions) {
    // 检查操作者是否有权限
    if (!this.checkPermission(userId, 'canInvite') && this.ownerId.toString() !== userId.toString()) {
        throw new Error('没有权限修改协作者权限');
    }
    
    const collaborator = this.collaborators.find(
        c => c.userId.toString() === targetUserId.toString()
    );
    
    if (!collaborator) {
        throw new Error('协作者不存在');
    }
    
    // 更新权限
    Object.assign(collaborator.permissions, newPermissions);
    
    // 添加历史记录
    this.history.push({
        action: 'permission_changed',
        userId: userId,
        targetUserId: targetUserId,
        details: { newPermissions }
    });
    
    await this.save();
};

// 实例方法：锁定编辑
collaborationSchema.methods.lockForEditing = async function(userId) {
    if (this.editingStatus.isLocked && this.editingStatus.lockedBy.toString() !== userId.toString()) {
        throw new Error('内容正在被其他用户编辑');
    }
    
    this.editingStatus.isLocked = true;
    this.editingStatus.lockedBy = userId;
    this.editingStatus.lockedAt = new Date();
    
    // 添加到活跃编辑者列表
    const editorIndex = this.editingStatus.activeEditors.findIndex(
        e => e.userId.toString() === userId.toString()
    );
    
    if (editorIndex >= 0) {
        this.editingStatus.activeEditors[editorIndex].lastActiveAt = new Date();
    } else {
        this.editingStatus.activeEditors.push({
            userId,
            startedAt: new Date(),
            lastActiveAt: new Date()
        });
    }
    
    await this.save();
};

// 实例方法：解锁编辑
collaborationSchema.methods.unlockEditing = async function(userId) {
    if (this.editingStatus.lockedBy?.toString() === userId.toString()) {
        this.editingStatus.isLocked = false;
        this.editingStatus.lockedBy = null;
        this.editingStatus.lockedAt = null;
        
        // 从活跃编辑者列表中移除
        this.editingStatus.activeEditors = this.editingStatus.activeEditors.filter(
            e => e.userId.toString() !== userId.toString()
        );
        
        await this.save();
    }
};

module.exports = mongoose.model('Collaboration', collaborationSchema);
