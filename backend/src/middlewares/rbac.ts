import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import Project from '../models/Project';

export const requireOrgAccess = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const { orgId } = req.params;
  
  if (req.user.organizationId?.toString() !== orgId) {
    res.status(403).json({ message: 'Forbidden: You do not have access to this organization' });
    return;
  }
  
  next();
};

export const requireProjectAccess = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const projectId = req.params.projectId || req.params.id;
  
  try {
    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    if (req.user.organizationId?.toString() !== project.organizationId.toString()) {
      res.status(403).json({ message: 'Forbidden: You do not have access to this project' });
      return;
    }
    
    // Attach project for downstream use
    (req as any).project = project;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error checking project access' });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ message: `Forbidden: Requires one of roles: ${allowedRoles.join(', ')}` });
      return;
    }
    next();
  };
};
