import { Request, Response, NextFunction } from 'express';
import RateLimit from '../models/RateLimit';

export const rateLimit = (limit: number, windowMs: number) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Use project ID if authenticated, else IP address
      const identifier = (req as any).project?._id || req.ip || req.connection.remoteAddress || 'unknown';
      const endpoint = req.route?.path || req.path;
      
      const key = `${identifier}:${endpoint}`;
      
      // Attempt to increment the count
      const record = await RateLimit.findOneAndUpdate(
        { key },
        { 
          $inc: { count: 1 },
          $setOnInsert: { expiresAt: new Date(Date.now() + windowMs) }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      
      const remaining = Math.max(0, limit - record.count);
      
      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', new Date(record.expiresAt).getTime());

      if (record.count > limit) {
        res.status(429).json({ message: 'Too many requests, please try again later.' });
        return;
      }
      
      next();
    } catch (error) {
      console.error('Rate limit error:', error);
      // Fail open to avoid blocking legitimate requests during DB issues
      next();
    }
  };
};
