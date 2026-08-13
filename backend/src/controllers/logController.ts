import { Request, Response } from 'express';
import ApiMetric from '../models/ApiMetric';
import Log from '../models/Log';

export const getApiLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { status, method, search, environment, page = 1, limit = 20 } = req.query;

    const query: any = { projectId };
    if (status) {
      const statusCode = Number(status);
      query.statusCode = { $gte: statusCode, $lt: statusCode + 100 };
    }
    if (method) query.method = method;
    if (environment) query.environment = environment;
    if (search) {
      query.$or = [
        { endpoint: { $regex: search, $options: 'i' } },
        { user: { $regex: search, $options: 'i' } },
        { ip: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    // Fetch paginated logs for the explorer
    const logs = await ApiMetric.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(Number(limit));
      
    const total = await ApiMetric.countDocuments(query);
    
    res.json({ logs, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching API logs' });
  }
};

export const getSystemLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { level, page = 1, limit = 20 } = req.query;

    const query: any = { projectId };
    if (level) query.level = level;

    const skip = (Number(page) - 1) * Number(limit);

    const logs = await Log.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(Number(limit));
      
    const total = await Log.countDocuments(query);
    
    res.json({ logs, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching system logs' });
  }
};
