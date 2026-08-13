import { Request, Response } from 'express';
import ErrorGroup from '../models/ErrorGroup';
import Project from '../models/Project';

export const getProjectErrors = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Verify the project exists (don't rely on user.organizationId)
    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const errorGroups = await ErrorGroup.find({ projectId })
      .sort({ lastSeen: -1 })
      .skip(skip)
      .limit(Number(limit));
      
    const total = await ErrorGroup.countDocuments({ projectId });

    res.json({ errorGroups, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error('Error fetching errors:', error);
    res.status(500).json({ message: 'Server error fetching errors' });
  }
};

export const updateErrorStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { groupId } = req.params;
    const { status, priority, assignedTo } = req.body;

    if (status && !['open', 'acknowledged', 'resolved', 'ignored'].includes(status)) {
      res.status(400).json({ message: 'Invalid status. Must be: open, acknowledged, resolved, or ignored' });
      return;
    }

    if (priority && !['low', 'medium', 'high', 'critical'].includes(priority)) {
      res.status(400).json({ message: 'Invalid priority. Must be: low, medium, high, or critical' });
      return;
    }

    const errorGroup = await ErrorGroup.findById(groupId);
    if (!errorGroup) {
      res.status(404).json({ message: 'Error group not found' });
      return;
    }

    const user = (req as any).user;
    if (errorGroup.organizationId.toString() !== user.organizationId?.toString()) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    
    // Check role manually for now since we are not using the middleware here
    if (user.role !== 'Admin' && user.role !== 'Owner' && user.role !== 'Member') {
       res.status(403).json({ message: 'Forbidden: Insufficient role' });
       return;
    }

    const oldStatus = errorGroup.status;

    if (status) errorGroup.status = status;
    if (priority) errorGroup.priority = priority;
    if (assignedTo !== undefined) errorGroup.assignedTo = assignedTo;
    
    await errorGroup.save();

    if (status && oldStatus !== status) {
      const AuditLog = require('../models/AuditLog').default;
      await AuditLog.create({
        organizationId: user.organizationId,
        projectId: errorGroup.projectId,
        userId: user._id,
        action: 'error_status_changed',
        entityId: errorGroup._id,
        entityType: 'ErrorGroup',
        metadata: { oldStatus, newStatus: status }
      });
    }

    res.json(errorGroup);
  } catch (error) {
    console.error('Error updating error status:', error);
    res.status(500).json({ message: 'Server error updating error status' });
  }
};
