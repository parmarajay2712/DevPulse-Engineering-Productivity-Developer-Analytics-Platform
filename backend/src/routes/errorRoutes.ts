import express from 'express';
import { getProjectErrors, updateErrorStatus } from '../controllers/errorController';
import { protect } from '../middlewares/auth';
import { requireProjectAccess, requireRole } from '../middlewares/rbac';

const router = express.Router();

router.use(protect);
router.get('/:projectId', requireProjectAccess, getProjectErrors);
router.patch('/:groupId/status', updateErrorStatus); // We need to check project access in the controller for this, since projectId is not in URL, or change the URL to include projectId.

export default router;
