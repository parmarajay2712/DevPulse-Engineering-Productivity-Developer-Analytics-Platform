import express from 'express';
import { getSystemHealth } from '../controllers/systemController';

const router = express.Router();

router.get('/health', getSystemHealth);

export default router;
