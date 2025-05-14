// controllers/collaborationController.js
const Collaboration = require('../models/Collaboration');
const Content = require('../models/Content');
const User = require('../models/User');

// 邀请协作者
const inviteCollaborator = async (req, res) => {
    try {
        const { contentId } = req.params;
        const { userId, role = 'viewer', permissions = {} } = req.body;

        // 获取内容
        const content = await Content.findById(contentId);
        if (!content) {
            return res.status(404).json({
                error: req.__('error.not_found'),
                message: '内容不存在'
            });
        }

        // 检查是否有权限邀请
        if (content.creatorId.toString() !== req.userId) {
            const collaboration = await Collaboration.findById(content.collaboration.collaborationId);
            
            if (!collaboration || !collaboration.checkPermission(req.userId, 'canInvite')) {
                return res.status(403).json({
                    error: req.__('error.unauthorized'),
                    message: '没有权限邀请协作者'
                });
            }
        }

        // 检查被邀请用户是否存在
        const invitedUser = await User.findById(userId);
        if (!invitedUser) {
            return res.status(404).json({
                error: req.__('error.not_found'),
                message: '用户不存在'
            });
        }

        // 获取或创建协作记录
        let collaboration = await Collaboration.findById(content.collaboration.collaborationId);
        
        if (!collaboration) {
            collaboration = new Collaboration({
                contentId: content._id,
                ownerId: content.creatorId
            });
            await collaboration.save();
            
            // 更新内容的协作信息
            content.collaboration.isCollaborative = true;
            content.collaboration.collaborationId = collaboration._id;
            await content.save();
        }

        // 添加协作者
        await collaboration.addCollaborator(userId, role, permissions, req.userId);

        // TODO: 发送邀请通知邮件或推送通知

        res.json({
            success: true,
            message: '邀请已发送',
            data: {
                collaborationId: collaboration._id,
                invitedUser: {
                    id: invitedUser._id,
                    username: invitedUser.username,
                    email: invitedUser.email
                }
            }
        });
    } catch (error) {
        console.error('邀请协作者错误:', error);
        res.status(400).json({
            error: req.__('error.validation_error'),
            message: error.message
        });
    }
};

// 接受邀请
const acceptInvitation = async (req, res) => {
    try {
        const { collaborationId } = req.params;

        const collaboration = await Collaboration.findById(collaborationId);
        if (!collaboration) {
            return res.status(404).json({
                error: req.__('error.not_found'),
                message: '协作邀请不存在'
            });
        }

        await collaboration.acceptInvitation(req.userId);

        res.json({
            success: true,
            message: '已接受邀请',
            data: { collaborationId }
        });
    } catch (error) {
        console.error('接受邀请错误:', error);
        res.status(400).json({
            error: req.__('error.validation_error'),
            message: error.message
        });
    }
};

// 拒绝邀请
const declineInvitation = async (req, res) => {
    try {
        const { collaborationId } = req.params;

        const collaboration = await Collaboration.findById(collaborationId);
        if (!collaboration) {
            return res.status(404).json({
                error: req.__('error.not_found'),
                message: '协作邀请不存在'
            });
        }

        const collaborator = collaboration.collaborators.find(
            c => c.userId.toString() === req.userId && c.status === 'pending'
        );

        if (!collaborator) {
            return res.status(404).json({
                error: req.__('error.not_found'),
                message: '邀请不存在或已处理'
            });
        }

        collaborator.status = 'declined';
        await collaboration.save();

        res.json({
            success: true,
            message: '已拒绝邀请',
            data: { collaborationId }
        });
    } catch (error) {
        console.error('拒绝邀请错误:', error);
        res.status(400).json({
            error: req.__('error.validation_error'),
            message: error.message
        });
    }
};

// 获取协作详情
const getCollaboration = async (req, res) => {
    try {
        const { collaborationId } = req.params;

        const collaboration = await Collaboration.findById(collaborationId)
            .populate('ownerId', 'username email profile')
            .populate('collaborators.userId', 'username email profile')
            .populate('contentId', 'title contentType status');

        if (!collaboration) {
            return res.status(404).json({
                error: req.__('error.not_found'),
                message: '协作不存在'
            });
        }

        // 检查访问权限
        const isOwner = collaboration.ownerId._id.toString() === req.userId;
        const isCollaborator = collaboration.collaborators.some(
            c => c.userId._id.toString() === req.userId && c.status === 'accepted'
        );
        const isPendingCollaborator = collaboration.collaborators.some(
            c => c.userId._id.toString() === req.userId && c.status === 'pending'
        );

        if (!isOwner && !isCollaborator && !isPendingCollaborator) {
            return res.status(403).json({
                error: req.__('error.unauthorized'),
                message: '没有权限访问此协作'
            });
        }

        res.json({
            success: true,
            data: {
                collaboration,
                userRole: isOwner ? 'owner' : 
                         isCollaborator ? 'collaborator' : 'pending'
            }
        });
    } catch (error) {
        console.error('获取协作详情错误:', error);
        res.status(500).json({
            error: req.__('error.server_error'),
            message: error.message
        });
    }
};

// 更新协作者权限
const updateCollaboratorPermissions = async (req, res) => {
    try {
        const { collaborationId, collaboratorId } = req.params;
        const { permissions } = req.body;

        const collaboration = await Collaboration.findById(collaborationId);
        if (!collaboration) {
            return res.status(404).json({
                error: req.__('error.not_found'),
                message: '协作不存在'
            });
        }

        await collaboration.updateCollaboratorPermissions(req.userId, collaboratorId, permissions);

        res.json({
            success: true,
            message: '权限已更新',
            data: { collaborationId }
        });
    } catch (error) {
        console.error('更新权限错误:', error);
        res.status(400).json({
            error: req.__('error.validation_error'),
            message: error.message
        });
    }
};

// 移除协作者
const removeCollaborator = async (req, res) => {
    try {
        const { collaborationId, collaboratorId } = req.params;

        const collaboration = await Collaboration.findById(collaborationId);
        if (!collaboration) {
            return res.status(404).json({
                error: req.__('error.not_found'),
                message: '协作不存在'
            });
        }

        // 检查权限
        const isOwner = collaboration.ownerId.toString() === req.userId;
        const canInvite = collaboration.checkPermission(req.userId, 'canInvite');

        if (!isOwner && !canInvite) {
            return res.status(403).json({
                error: req.__('error.unauthorized'),
                message: '没有权限移除协作者'
            });
        }

        // 找到并移除协作者
        const collaboratorIndex = collaboration.collaborators.findIndex(
            c => c.userId.toString() === collaboratorId
        );

        if (collaboratorIndex === -1) {
            return res.status(404).json({
                error: req.__('error.not_found'),
                message: '协作者不存在'
            });
        }

        collaboration.collaborators[collaboratorIndex].status = 'removed';
        
        // 添加历史记录
        collaboration.history.push({
            action: 'removed',
            userId: req.userId,
            targetUserId: collaboratorId
        });

        await collaboration.save();

        res.json({
            success: true,
            message: '协作者已移除',
            data: { collaborationId }
        });
    } catch (error) {
        console.error('移除协作者错误:', error);
        res.status(400).json({
            error: req.__('error.validation_error'),
            message: error.message
        });
    }
};

// 获取用户的协作列表
const getUserCollaborations = async (req, res) => {
    try {
        const { page = 1, limit = 20, status = 'accepted' } = req.query;

        // 查找用户参与的协作
        const collaborations = await Collaboration.find({
            $or: [
                { ownerId: req.userId },
                { 'collaborators.userId': req.userId, 'collaborators.status': status }
            ]
        })
        .populate('contentId', 'title contentType status')
        .populate('ownerId', 'username email')
        .sort({ updatedAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

        const total = await Collaboration.countDocuments({
            $or: [
                { ownerId: req.userId },
                { 'collaborators.userId': req.userId, 'collaborators.status': status }
            ]
        });

        res.json({
            success: true,
            data: {
                collaborations: collaborations.map(collab => ({
                    ...collab.toObject(),
                    userRole: collab.ownerId._id.toString() === req.userId ? 'owner' : 'collaborator'
                })),
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('获取协作列表错误:', error);
        res.status(500).json({
            error: req.__('error.server_error'),
            message: error.message
        });
    }
};

module.exports = {
    inviteCollaborator,
    acceptInvitation,
    declineInvitation,
    getCollaboration,
    updateCollaboratorPermissions,
    removeCollaborator,
    getUserCollaborations
};
