import { Request, Response } from 'express';
import ErrorEvent from '../models/ErrorEvent';
import ErrorGroup from '../models/ErrorGroup';
import ApiMetric from '../models/ApiMetric';
import Log from '../models/Log';
import HourlyMetric from '../models/HourlyMetric';
import DailyMetric from '../models/DailyMetric';

export const getProjectStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const range = (req.query.range as string) || '24h';

    // Calculate time boundary
    let msAgo: number;
    const now = new Date();
    switch (range) {
      case '7d': msAgo = 7 * 24 * 60 * 60 * 1000; break;
      case '30d': msAgo = 30 * 24 * 60 * 60 * 1000; break;
      case '24h':
      default: msAgo = 24 * 60 * 60 * 1000; break;
    }
    const since = new Date(now.getTime() - msAgo);

    // Helper to generate time slots for padding
    const generateTimeSlots = (r: string) => {
      const slots: string[] = [];
      if (r === '24h') {
        for (let i = 23; i >= 0; i--) {
          const d = new Date(now.getTime() - i * 60 * 60 * 1000);
          slots.push(`${d.getUTCHours()}:00`);
        }
      } else {
        const days = r === '7d' ? 7 : 30;
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          slots.push(d.toISOString().split('T')[0]);
        }
      }
      return slots;
    };
    const timeSlots = generateTimeSlots(range);

    // --- Stat Cards ---
    const totalErrors = await ErrorEvent.countDocuments({ projectId, timestamp: { $gte: since } });

    // --- API Metrics (from Rollups) ---
    
    let totalApiCalls = 0;
    let failedApiCalls = 0;
    let avgResponseTime = 0;
    let requestVolume = timeSlots.map(slot => ({ time: slot, count: 0 }));

    if (range === '24h' || range === '7d') {
      const hourlyStats = await HourlyMetric.find({ projectId, endpoint: 'ALL', timestamp: { $gte: since } });
      
      let sumAvg = 0;
      hourlyStats.forEach((stat: any) => {
        totalApiCalls += stat.requestCount;
        failedApiCalls += stat.errorCount;
        sumAvg += stat.avgResponseTime * stat.requestCount;
      });
      avgResponseTime = totalApiCalls > 0 ? Math.round(sumAvg / totalApiCalls) : 0;

      // Group request volume
      const volumeMap = new Map();
      hourlyStats.forEach((stat: any) => {
        const slotKey = range === '24h' 
          ? `${stat.timestamp.getUTCHours()}:00` 
          : stat.timestamp.toISOString().split('T')[0];
        
        volumeMap.set(slotKey, (volumeMap.get(slotKey) || 0) + stat.requestCount);
      });

      requestVolume = timeSlots.map(slot => ({
        time: slot,
        count: volumeMap.get(slot) || 0,
      }));
    } else {
      // 30d range uses DailyMetrics
      const dailyStats = await DailyMetric.find({ projectId, endpoint: 'ALL', timestamp: { $gte: since } });
      
      let sumAvg = 0;
      dailyStats.forEach((stat: any) => {
        totalApiCalls += stat.requestCount;
        failedApiCalls += stat.errorCount;
        sumAvg += stat.avgResponseTime * stat.requestCount;
      });
      avgResponseTime = totalApiCalls > 0 ? Math.round(sumAvg / totalApiCalls) : 0;

      const volumeMap = new Map();
      dailyStats.forEach((stat: any) => {
        const slotKey = stat.timestamp.toISOString().split('T')[0];
        volumeMap.set(slotKey, stat.requestCount);
      });

      requestVolume = timeSlots.map(slot => ({
        time: slot,
        count: volumeMap.get(slot) || 0,
      }));
    }

    const successRate = totalApiCalls > 0
      ? ((totalApiCalls - failedApiCalls) / totalApiCalls * 100).toFixed(1)
      : '100.0';

    // --- Error Trend (grouped by day/hour) ---
    let errorTrendGroupBy: any;
    if (range === '24h') {
      errorTrendGroupBy = { $hour: '$timestamp' };
    } else {
      errorTrendGroupBy = { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } };
    }

    const errorTrendRaw = await ErrorEvent.aggregate([
      { $match: { projectId: require('mongoose').Types.ObjectId.createFromHexString(projectId), timestamp: { $gte: since } } },
      { $group: { _id: errorTrendGroupBy, errors: { $sum: 1 } } },
    ]);

    const errorMap = new Map();
    errorTrendRaw.forEach(item => {
      const key = range === '24h' ? `${item._id}:00` : item._id;
      errorMap.set(key, item.errors);
    });

    const errorTrend = timeSlots.map(slot => ({
      day: slot,
      errors: errorMap.get(slot) || 0,
    }));

    // --- Active error groups (unique users who triggered errors - approximate) ---
    const activeErrorGroups = await ErrorGroup.countDocuments({ projectId, status: 'open' });

    // --- Last Event Time ---
    const lastError = await ErrorEvent.findOne({ projectId }).sort({ timestamp: -1 }).select('timestamp');
    const lastMetric = await ApiMetric.findOne({ projectId }).sort({ timestamp: -1 }).select('timestamp');
    const lastLog = await Log.findOne({ projectId }).sort({ timestamp: -1 }).select('timestamp');

    const timestamps = [
      lastError?.timestamp,
      lastMetric?.timestamp,
      lastLog?.timestamp
    ].filter(Boolean) as Date[];

    const lastEventTime = timestamps.length > 0 
      ? new Date(Math.max(...timestamps.map(d => d.getTime())))
      : null;

    res.json({
      stats: {
        errors: totalErrors.toString(),
        successRate: `${successRate}%`,
        avgResponseTime: `${avgResponseTime}ms`,
        activeIssues: activeErrorGroups.toString(),
        totalRequests: totalApiCalls,
      },
      errorTrend: errorTrend.length > 0 ? errorTrend : [{ day: 'Now', errors: 0 }],
      requestVolume: requestVolume.length > 0 ? requestVolume : [{ time: 'Now', count: 0 }],
      lastEventTime,
    });
  } catch (error) {
    console.error('Error fetching project stats:', error);
    res.status(500).json({ message: 'Server error fetching stats' });
  }
};
