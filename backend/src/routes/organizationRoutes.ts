import express from 'express';
import { createOrganization, getMyOrganization, getMembers, inviteMember, getAuditLogs } from '../controllers/organizationController';
import { protect } from '../middlewares/auth';
import { requireRole } from '../middlewares/rbac';

const router = express.Router();

router.post('/', protect, createOrganization);
router.get('/me', protect, getMyOrganization);
router.get('/members', protect, getMembers);
router.post('/invite', protect, requireRole(['Owner', 'Admin']), inviteMember);
router.get('/audit-logs', protect, requireRole(['Owner', 'Admin', 'Member']), getAuditLogs);

export default router;
