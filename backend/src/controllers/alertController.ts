import { Request, Response } from 'express';
import AlertRule from '../models/AlertRule';
import { logAuditAction } from '../services/auditService';

export const createAlertRule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, name, condition, threshold, timeWindow, action } = req.body;
    
    // Fetch project to get organizationId
    const Project = require('../models/Project').default;
    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }
    const organizationId = project.organizationId;

    const user = (req as any).user;
    if (organizationId.toString() !== user?.organizationId?.toString()) {
      res.status(403).json({ message: 'Forbidden: You do not have access to this project' });
      return;
    }

    const rule = await AlertRule.create({
      projectId,
      organizationId,
      name,
      condition,
      threshold,
      timeWindow,
      action,
    });

    // Audit log
    if (user?.organizationId) {
      await logAuditAction(user.organizationId.toString(), user._id.toString(), 'created', 'AlertRule', { ruleName: name });
    }

    res.status(201).json(rule);
  } catch (error: any) {
    console.error('Error creating alert rule:', error);
    res.status(500).json({ message: error.message || 'Server error creating alert rule' });
  }
};

export const getAlerts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const alerts = await AlertRule.find({ projectId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
      
    const total = await AlertRule.countDocuments({ projectId });

    res.json({ alerts, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching alert rules' });
  }
};

export const deleteAlertRule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ruleId } = req.params;
    const rule = await AlertRule.findById(ruleId);
    if (!rule) {
      res.status(404).json({ message: 'Alert rule not found' });
      return;
    }

    const user = (req as any).user;
    if (rule.organizationId.toString() !== user?.organizationId?.toString()) {
      res.status(403).json({ message: 'Forbidden: You do not have access to this alert rule' });
      return;
    }

    await rule.deleteOne();

    // Audit log
    if (user?.organizationId && rule) {
      await logAuditAction(user.organizationId.toString(), user._id.toString(), 'deleted', 'AlertRule', { ruleName: rule.name });
    }

    res.json({ message: 'Alert rule removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting alert rule' });
  }
};
