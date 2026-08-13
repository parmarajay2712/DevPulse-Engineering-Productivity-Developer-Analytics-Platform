import express from 'express';
import { createProject, getProjects, regenerateApiKey } from '../controllers/projectController';
import { protect } from '../middlewares/auth';
import { requireRole, requireProjectAccess } from '../middlewares/rbac';

const router = express.Router();

router.post('/', protect, requireRole(['Owner', 'Admin']), createProject);
router.get('/', protect, getProjects);
router.post('/:projectId/regenerate-key', protect, requireProjectAccess, requireRole(['Owner', 'Admin']), regenerateApiKey);

export default router;
