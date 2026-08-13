import { Request, Response, NextFunction } from 'express';
import Project from '../models/Project';
import bcrypt from 'bcryptjs';

export const verifyApiKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const apiKey = req.header('x-api-key');

  if (!apiKey) {
    res.status(401).json({ message: 'API key is missing' });
    return;
  }

  try {
    const parts = apiKey.split('.');
    if (parts.length !== 2) {
      res.status(401).json({ message: 'Invalid API key format' });
      return;
    }

    const projectId = parts[0];
    const rawApiKey = parts[1];

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(401).json({ message: 'Invalid project ID in API key' });
      return;
    }

    const isMatch = await bcrypt.compare(rawApiKey, project.apiKeyHash);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid API key' });
      return;
    }

    // Update lastUsedAt asynchronously
    project.lastUsedAt = new Date();
    project.save().catch(err => console.error('Failed to update lastUsedAt', err));

    (req as any).project = project;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error validating API key' });
  }
};
