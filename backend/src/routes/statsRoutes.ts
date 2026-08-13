import express from 'express';
import { getProjectStats } from '../controllers/statsController';
import { protect } from '../middlewares/auth';

import { requireProjectAccess } from '../middlewares/rbac';

const router = express.Router();

router.get('/:projectId', protect, requireProjectAccess, getProjectStats);

export default router;
