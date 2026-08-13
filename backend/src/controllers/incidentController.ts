import { Request, Response } from 'express';
import Incident from '../models/Incident';
import Project from '../models/Project';

export const createIncident = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, title, description } = req.body;
    let organizationId = (req as any).user?.organizationId;
    
    // Fall back to project's organizationId if user doesn't have one
    if (!organizationId) {
      const project = await Project.findById(projectId);
      if (!project) {
        res.status(404).json({ message: 'Project not found' });
        return;
      }
      organizationId = project.organizationId;
    } else {
      const project = await Project.findOne({ _id: projectId, organizationId });
      if (!project) {
        res.status(404).json({ message: 'Project not found' });
        return;
      }
    }

    const incident = await Incident.create({
      organizationId,
      projectId,
      title,
      description,
      status: 'Investigating'
    });

    res.status(201).json(incident);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating incident' });
  }
};

export const getIncidents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    let organizationId = (req as any).user?.organizationId;

    // Fall back to project's organizationId
    if (!organizationId) {
      const project = await Project.findById(projectId);
      if (project) organizationId = project.organizationId;
    }

    const incidents = await Incident.find({ projectId }).sort({ createdAt: -1 });
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching incidents' });
  }
};

export const updateIncidentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { incidentId } = req.params;
    const { status } = req.body;

    if (!['Investigating', 'Resolved', 'Closed'].includes(status)) {
      res.status(400).json({ message: 'Invalid status. Must be: Investigating, Resolved, or Closed' });
      return;
    }

    const user = (req as any).user;
    
    const incident = await Incident.findById(incidentId);
    if (!incident) {
      res.status(404).json({ message: 'Incident not found' });
      return;
    }

    if (incident.organizationId.toString() !== user.organizationId?.toString()) {
      res.status(403).json({ message: 'Forbidden: You do not have access to this incident' });
      return;
    }

    incident.status = status;
    await incident.save();

    res.json(incident);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating incident status' });
  }
};
