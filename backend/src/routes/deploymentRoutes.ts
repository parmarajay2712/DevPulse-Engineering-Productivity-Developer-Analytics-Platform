import express from 'express';
import { createDeployment, getDeployments, getProjectHealth } from '../controllers/deploymentController';
import { protect } from '../middlewares/auth';
import { requireProjectAccess, requireRole } from '../middlewares/rbac';

const router = express.Router();

router.get('/health/:projectId', protect, requireProjectAccess, getProjectHealth);
router.post('/:projectId', protect, requireProjectAccess, requireRole(['Owner', 'Admin', 'Member']), createDeployment);
router.get('/:projectId', protect, requireProjectAccess, getDeployments);

export default router;
