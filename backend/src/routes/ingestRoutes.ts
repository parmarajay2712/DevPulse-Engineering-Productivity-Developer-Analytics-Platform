import express from 'express';
import { ingestError, ingestMetric, ingestPerformance, ingestLog } from '../controllers/ingestController';
import { verifyApiKey } from '../middlewares/apiKey';
import { validate } from '../middlewares/validate';
import { rateLimit } from '../middlewares/rateLimit';
import { ingestErrorSchema, ingestPerformanceSchema, ingestMetricSchema, ingestLogSchema } from '../validators/ingest';

const router = express.Router();

// Limit to 1000 requests per minute per project
const ingestLimiter = rateLimit(1000, 60 * 1000);

router.post('/errors', verifyApiKey, ingestLimiter, validate(ingestErrorSchema), ingestError);
router.post('/performance', verifyApiKey, ingestLimiter, validate(ingestPerformanceSchema), ingestPerformance);
router.post('/metrics', verifyApiKey, ingestLimiter, validate(ingestMetricSchema), ingestMetric);
router.post('/logs', verifyApiKey, ingestLimiter, validate(ingestLogSchema), ingestLog);

export default router;
