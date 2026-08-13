import cron from 'node-cron';
import mongoose from 'mongoose';
import ApiMetric from '../models/ApiMetric';
import HourlyMetric from '../models/HourlyMetric';
import DailyMetric from '../models/DailyMetric';
import Project from '../models/Project';

const calculatePercentile = (values: number[], percentile: number) => {
  if (values.length === 0) return 0;
  values.sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * values.length) - 1;
  return values[index];
};

export const runHourlyRollup = async () => {
  console.log('[RollupJob] Starting hourly metric rollup...');
  try {
    // Determine the previous hour window
    const now = new Date();
    const startOfHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() - 1, 0, 0, 0);
    const endOfHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0);

    const projects = await Project.find({}, '_id organizationId');

    for (const project of projects) {
      // 1. Rollup specific endpoints
      const metrics = await ApiMetric.find({
        projectId: project._id,
        timestamp: { $gte: startOfHour, $lt: endOfHour }
      });

      if (metrics.length === 0) continue;

      const endpointMap = new Map<string, typeof metrics>();
      
      // Also calculate a global 'ALL' rollup
      endpointMap.set('ALL', metrics);

      for (const metric of metrics) {
        if (!endpointMap.has(metric.endpoint)) {
          endpointMap.set(metric.endpoint, []);
        }
        endpointMap.get(metric.endpoint)!.push(metric);
      }

      for (const [endpoint, groupMetrics] of endpointMap.entries()) {
        const responseTimes = groupMetrics.map(m => m.responseTime);
        const requestCount = groupMetrics.length;
        const errorCount = groupMetrics.filter(m => m.statusCode >= 400).length;
        const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / requestCount;
        const minResponseTime = Math.min(...responseTimes);
        const maxResponseTime = Math.max(...responseTimes);
        const p50 = calculatePercentile(responseTimes, 50);
        const p95 = calculatePercentile(responseTimes, 95);
        const p99 = calculatePercentile(responseTimes, 99);

        await HourlyMetric.findOneAndUpdate(
          { projectId: project._id, endpoint, timestamp: startOfHour },
          {
            organizationId: project.organizationId,
            requestCount,
            errorCount,
            avgResponseTime,
            minResponseTime,
            maxResponseTime,
            p50,
            p95,
            p99
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
    }
    console.log('[RollupJob] Hourly rollup complete.');
  } catch (error) {
    console.error('[RollupJob] Error running hourly rollup:', error);
  }
};

export const runDailyRollup = async () => {
  console.log('[RollupJob] Starting daily metric rollup...');
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    const projects = await Project.find({}, '_id organizationId');

    for (const project of projects) {
      const hourlyMetrics = await HourlyMetric.find({
        projectId: project._id,
        timestamp: { $gte: startOfDay, $lt: endOfDay }
      });

      if (hourlyMetrics.length === 0) continue;

      const endpointMap = new Map<string, typeof hourlyMetrics>();

      for (const metric of hourlyMetrics) {
        if (!endpointMap.has(metric.endpoint)) {
          endpointMap.set(metric.endpoint, []);
        }
        endpointMap.get(metric.endpoint)!.push(metric);
      }

      for (const [endpoint, groupMetrics] of endpointMap.entries()) {
        const requestCount = groupMetrics.reduce((sum, m) => sum + m.requestCount, 0);
        const errorCount = groupMetrics.reduce((sum, m) => sum + m.errorCount, 0);
        
        // Approximate averages from hourly aggregates
        const avgResponseTime = groupMetrics.reduce((sum, m) => sum + (m.avgResponseTime * m.requestCount), 0) / (requestCount || 1);
        const minResponseTime = Math.min(...groupMetrics.map(m => m.minResponseTime));
        const maxResponseTime = Math.max(...groupMetrics.map(m => m.maxResponseTime));
        
        // Percentiles are estimations when aggregating aggregates
        const p50 = groupMetrics.reduce((sum, m) => sum + (m.p50 * m.requestCount), 0) / (requestCount || 1);
        const p95 = groupMetrics.reduce((sum, m) => sum + (m.p95 * m.requestCount), 0) / (requestCount || 1);
        const p99 = groupMetrics.reduce((sum, m) => sum + (m.p99 * m.requestCount), 0) / (requestCount || 1);

        await DailyMetric.findOneAndUpdate(
          { projectId: project._id, endpoint, timestamp: startOfDay },
          {
            organizationId: project.organizationId,
            requestCount,
            errorCount,
            avgResponseTime,
            minResponseTime,
            maxResponseTime,
            p50,
            p95,
            p99
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
    }
    console.log('[RollupJob] Daily rollup complete.');
  } catch (error) {
    console.error('[RollupJob] Error running daily rollup:', error);
  }
};

export const startRollupJob = () => {
  // Run hourly rollup at minute 5 of every hour
  cron.schedule('5 * * * *', runHourlyRollup);
  
  // Run daily rollup at 1:10 AM
  cron.schedule('10 1 * * *', runDailyRollup);

  // console.log('[RollupJob] Scheduled metric rollups.');
};
