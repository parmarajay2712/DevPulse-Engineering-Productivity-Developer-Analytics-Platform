import { Request, Response } from 'express';
import Project from '../models/Project';
import { logAuditAction } from '../services/auditService';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export const createProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, environment } = req.body;
    const user = (req as any).user;

    if (!user.organizationId) {
      res.status(400).json({ message: 'User must belong to an organization to create a project' });
      return;
    }

    const rawApiKey = crypto.randomBytes(32).toString('hex');
    const salt = await bcrypt.genSalt(10);
    const apiKeyHash = await bcrypt.hash(rawApiKey, salt);
    const apiKeyPreview = rawApiKey.substring(0, 8);

    const project = await Project.create({
      name,
      environment: environment || 'production',
      organizationId: user.organizationId,
      ownerId: user._id,
      apiKeyHash,
      apiKeyPreview
    });

    // Audit log
    await logAuditAction(user.organizationId.toString(), user._id.toString(), 'created', 'Project', { projectName: name });

    // Return the raw API key only once
    const fullApiKey = `${project._id}.${rawApiKey}`;
    res.status(201).json({ ...project.toJSON(), apiKey: fullApiKey });
  } catch (error) {
    res.status(500).json({ message: 'Server error creating project' });
  }
};

import Organization from '../models/Organization';

export const getProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;

    if (!user.organizationId) {
      // Auto-create Organization for the user
      const organization = await Organization.create({
        name: `${user.name}'s Organization`,
        plan: 'Free',
      });

      const rawApiKey = crypto.randomBytes(32).toString('hex');
      const salt = await bcrypt.genSalt(10);
      const apiKeyHash = await bcrypt.hash(rawApiKey, salt);
      const apiKeyPreview = rawApiKey.substring(0, 8);

      // Auto-create Default Project
      const project = await Project.create({
        name: 'Default Project',
        environment: 'production',
        organizationId: organization._id,
        ownerId: user._id,
        apiKeyHash,
        apiKeyPreview
      });

      // Update user with organizationId
      user.organizationId = organization._id;
      user.role = 'Admin';
      await user.save();

      const fullApiKey = `${project._id}.${rawApiKey}`;
      res.json([{ ...project.toJSON(), apiKey: fullApiKey }]);
      return;
    }

    const projects = await Project.find({ organizationId: user.organizationId });
    // For existing projects, we don't have the raw API key.
    // The frontend should just use the preview or a placeholder.
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Server error fetching projects' });
  }
};

export const regenerateApiKey = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = req.params.projectId || req.params.id;
    const project = await Project.findById(projectId);

    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    const rawApiKey = crypto.randomBytes(32).toString('hex');
    const salt = await bcrypt.genSalt(10);
    const apiKeyHash = await bcrypt.hash(rawApiKey, salt);
    const apiKeyPreview = rawApiKey.substring(0, 8);

    project.apiKeyHash = apiKeyHash;
    project.apiKeyPreview = apiKeyPreview;
    await project.save();

    const fullApiKey = `${project._id}.${rawApiKey}`;
    res.json({ apiKey: fullApiKey });
  } catch (error) {
    console.error('Error regenerating API key:', error);
    res.status(500).json({ message: 'Server error regenerating API key' });
  }
};
