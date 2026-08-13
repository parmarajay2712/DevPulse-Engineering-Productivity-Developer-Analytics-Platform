import express from 'express';
import { getApiLogs, getSystemLogs } from '../controllers/logController';
import { protect } from '../middlewares/auth';
import { requireProjectAccess } from '../middlewares/rbac';

const router = express.Router();

router.get('/api/:projectId', protect, requireProjectAccess, getApiLogs);
router.get('/system/:projectId', protect, requireProjectAccess, getSystemLogs);

export default router;
