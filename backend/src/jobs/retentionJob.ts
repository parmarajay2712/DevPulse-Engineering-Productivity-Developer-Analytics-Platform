import Organization from '../models/Organization';
import ErrorEvent from '../models/ErrorEvent';
import ApiMetric from '../models/ApiMetric';
import PerformanceMetric from '../models/PerformanceMetric';
import Log from '../models/Log';
import cron from 'node-cron';

export const runRetentionPolicy = async () => {
  console.log('[RetentionJob] Starting data retention cleanup...');
  try {
    const orgs = await Organization.find({}, '_id retentionDays');
    
    for (const org of orgs) {
      const retentionDays = org.retentionDays || 30;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const query = {
        organizationId: org._id,
        timestamp: { $lt: cutoffDate }
      };

      const [errors, metrics, perf, logs] = await Promise.all([
        ErrorEvent.deleteMany(query),
        ApiMetric.deleteMany(query),
        PerformanceMetric.deleteMany(query),
        Log.deleteMany(query)
      ]);

      const totalDeleted = errors.deletedCount + metrics.deletedCount + perf.deletedCount + logs.deletedCount;
      if (totalDeleted > 0) {
        console.log(`[RetentionJob] Org ${org._id} (Retention: ${retentionDays}d): Deleted ${totalDeleted} expired events.`);
      }
    }
    
    console.log('[RetentionJob] Data retention cleanup complete.');
  } catch (error) {
    console.error('[RetentionJob] Error running retention policy:', error);
  }
};

export const startRetentionJob = () => {
  // Run every day at 3:00 AM
  cron.schedule('0 3 * * *', () => {
    runRetentionPolicy();
  });
  
  // Also run immediately on startup if needed, but let's just schedule it
  // console.log('[RetentionJob] Scheduled daily retention cleanup at 3:00 AM.');
};