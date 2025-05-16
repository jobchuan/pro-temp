// routes/collaborationRoutes.js
const express = require('express');
const router = express.Router();
const collaborationController = require('../controllers/collaborationController');
const { authenticate } = require('../middleware/auth');

// 协作相关路由
router.post('/content/:contentId/invite', authenticate, collaborationController.inviteCollaborator);
router.post('/:collaborationId/accept', authenticate, collaborationController.acceptInvitation);
router.post('/:collaborationId/decline', authenticate, collaborationController.declineInvitation);
router.get('/:collaborationId', authenticate, collaborationController.getCollaboration);
router.put('/:collaborationId/collaborator/:collaboratorId/permissions', authenticate, collaborationController.updateCollaboratorPermissions);
router.delete('/:collaborationId/collaborator/:collaboratorId', authenticate, collaborationController.removeCollaborator);
router.get('/user/list', authenticate, collaborationController.getUserCollaborations);

module.exports = router;
