import express from 'express';
import { createIncident, getIncidents, updateIncidentStatus } from '../controllers/incidentController';
import { protect } from '../middlewares/auth';
import { requireProjectAccess, requireRole } from '../middlewares/rbac';

const router = express.Router();

router.post('/', protect, requireRole(['Owner', 'Admin', 'Member']), createIncident);
router.get('/:projectId', protect, requireProjectAccess, getIncidents);
router.patch('/:incidentId/status', protect, requireRole(['Owner', 'Admin', 'Member']), updateIncidentStatus); // Needs manual org check inside controller

export default router;
