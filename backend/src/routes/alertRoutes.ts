import express from 'express';
import { createAlertRule, getAlerts, deleteAlertRule } from '../controllers/alertController';
import { protect } from '../middlewares/auth';
import { requireProjectAccess, requireRole } from '../middlewares/rbac';

const router = express.Router();

router.post('/', protect, requireRole(['Owner', 'Admin']), createAlertRule);
router.get('/:projectId', protect, requireProjectAccess, getAlerts);
router.delete('/:ruleId', protect, requireRole(['Owner', 'Admin']), deleteAlertRule); // Need manual org check in controller

export default router;
