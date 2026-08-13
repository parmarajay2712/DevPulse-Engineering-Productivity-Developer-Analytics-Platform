import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { io } from '../index';

export const getSystemHealth = async (req: Request, res: Response): Promise<void> => {
  try {
    const mongoStatus = mongoose.connection.readyState === 1 ? 'Healthy' : 'Unhealthy';
    
    // In a real app we'd ping redis or check email transport, but for this portfolio piece we mock to Healthy if server is up
    const health = {
      api: 'Healthy',
      mongodb: mongoStatus,
      socketServer: io ? 'Healthy' : 'Offline',
      emailService: 'Healthy', // Mock
      uptime: process.uptime(),
      timestamp: new Date()
    };

    res.json(health);
  } catch (error) {
    res.status(500).json({ message: 'Error checking system health' });
  }
};
