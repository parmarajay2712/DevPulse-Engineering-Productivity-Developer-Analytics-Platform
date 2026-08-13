import { Request, Response } from 'express';
import Deployment from '../models/Deployment';
import ApiMetric from '../models/ApiMetric';
import ErrorEvent from '../models/ErrorEvent';

export const createDeployment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { version, environment } = req.body;

    const organizationId = (req as any).user?.organizationId;

    const deployment = await Deployment.create({
      projectId: projectId as unknown as any, // Bypass strict ObjectId typing
      organizationId,
      version,
      environment,
      status: 'success',
      healthScore: 100, // Starts at 100, degraded if errors found later
    });

    res.status(201).json(deployment);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating deployment' });
  }
};

export const getDeployments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    
    // Mongoose Types strictly expects an ObjectId here, but Express params are strings
    const filter = { projectId: projectId as unknown as any };

    const deployments = await Deployment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit) + 1); // Get one extra for the time window calculation
      
    const total = await Deployment.countDocuments(filter);

    const deploymentsWithStats = await Promise.all(deployments.slice(0, Number(limit)).map(async (dep, index) => {
      const currentCreatedAt = dep.createdAt;
      const nextDep = deployments[index - 1]; // Newer deployment
      const prevDep = deployments[index + 1]; // Older deployment

      const afterEnd = nextDep ? nextDep.createdAt : new Date();
      const beforeStart = prevDep ? prevDep.createdAt : new Date(currentCreatedAt.getTime() - 7 * 24 * 60 * 60 * 1000); // fallback to 7 days before

      const afterErrors = await ErrorEvent.countDocuments({
        projectId,
        timestamp: { $gte: currentCreatedAt, $lt: afterEnd }
      });

      const beforeErrors = await ErrorEvent.countDocuments({
        projectId,
        timestamp: { $gte: beforeStart, $lt: currentCreatedAt }
      });

      return {
        ...dep.toObject(),
        beforeErrors,
        afterErrors
      };
    }));

    res.json({ deployments: deploymentsWithStats, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching deployments' });
  }
};

export const getProjectHealth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    
    // Calculate health based on last 24 hours
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const totalRequests = await ApiMetric.countDocuments({ projectId, timestamp: { $gte: last24h } });
    const failedRequests = await ApiMetric.countDocuments({ projectId, statusCode: { $gte: 500 }, timestamp: { $gte: last24h } });
    
    const errorEvents = await ErrorEvent.countDocuments({ projectId, timestamp: { $gte: last24h } });

    // Mock logic for MVP: start at 100%, subtract for failures
    let healthScore = 100;
    if (totalRequests > 0) {
      const errorRate = failedRequests / totalRequests;
      healthScore = Math.max(0, 100 - (errorRate * 100) - (errorEvents * 0.1));
    }

    res.json({ healthScore: parseFloat(healthScore.toFixed(1)) });
  } catch (error) {
    res.status(500).json({ message: 'Server error calculating health' });
  }
};
