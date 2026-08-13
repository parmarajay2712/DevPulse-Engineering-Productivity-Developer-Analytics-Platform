import { Request, Response } from 'express';
import ErrorEvent from '../models/ErrorEvent';
import ErrorGroup from '../models/ErrorGroup';
import ApiMetric from '../models/ApiMetric';
import Organization from '../models/Organization';
import PerformanceMetric from '../models/PerformanceMetric';
import Log from '../models/Log';
import crypto from 'crypto';
import { io } from '../index';

export const ingestError = async (req: Request, res: Response): Promise<void> => {
  try {
    const project = (req as any).project;
    
    // Check usage limits
    const org = await Organization.findById(project.organizationId);
    if (!org) {
      res.status(404).json({ message: 'Organization not found' });
      return;
    }
    if (org.eventsUsed >= org.eventLimit) {
      res.status(429).json({ message: 'Monthly event limit exceeded. Please upgrade your plan.' });
      return;
    }

    const { errorType, message, stackTrace, metadata, user, environment, endpoint, source = 'backend' } = req.body;

    // Generate Fingerprint
    const hash = crypto.createHash('sha256');
    hash.update(`${message}-${stackTrace || ''}-${endpoint || ''}`);
    const fingerprint = hash.digest('hex');

    // 1. Update or Create ErrorGroup
    const errorGroup = await ErrorGroup.findOneAndUpdate(
      { projectId: project._id, fingerprint },
      {
        $set: { 
          organizationId: project.organizationId, 
          errorType, 
          message, 
          stackTrace, 
          endpoint, 
          source, 
          status: 'open', 
          lastSeen: new Date(),
          ...(metadata && { metadata }),
          ...(user && { user }),
          ...(environment && { environment })
        },
        $inc: { count: 1 },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    // 2. Save the individual ErrorEvent
    const errorEvent = await ErrorEvent.create({
      eventId: req.body.eventId,
      projectId: project._id,
      organizationId: project.organizationId,
      groupId: errorGroup._id,
      errorType,
      message,
      stackTrace,
      metadata,
      user,
      environment,
      source,
    });

    if (io) {
      io.to(project._id.toString()).emit('new-error', { errorEvent, errorGroup });
    }

    // Increment usage
    await Organization.findByIdAndUpdate(project.organizationId, { $inc: { eventsUsed: 1 } });

    res.status(201).json({ message: 'Error ingested', eventId: errorEvent._id, groupId: errorGroup._id });
  } catch (error: any) {
    if (error.code === 11000) {
      // Idempotency: duplicate eventId
      res.status(200).json({ message: 'Error already ingested', duplicate: true });
      return;
    }
    console.error(error);
    res.status(500).json({ message: 'Server error ingesting event' });
  }
};

export const ingestPerformance = async (req: Request, res: Response): Promise<void> => {
  try {
    const project = (req as any).project;
    const { url, pageLoadTime, cls, lcp } = req.body;

    await PerformanceMetric.create({
      eventId: req.body.eventId,
      projectId: project._id,
      organizationId: project.organizationId,
      url,
      pageLoadTime,
      cls,
      lcp,
    });

    res.status(201).json({ message: 'Performance metrics ingested' });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(200).json({ message: 'Performance metrics already ingested', duplicate: true });
      return;
    }
    res.status(500).json({ message: 'Server error ingesting performance' });
  }
};

export const ingestMetric = async (req: Request, res: Response): Promise<void> => {
  try {
    const project = (req as any).project;
    const { endpoint, method, statusCode, responseTime, user, environment, ip, headers, body, response } = req.body;

    await ApiMetric.create({
      eventId: req.body.eventId,
      projectId: project._id,
      organizationId: project.organizationId,
      endpoint,
      method,
      statusCode,
      responseTime,
      user,
      environment,
      ip: ip || req.ip,
      headers,
      body,
      response
    });

    res.status(201).json({ success: true });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(200).json({ message: 'Api metric already ingested', duplicate: true });
      return;
    }
    console.error('Ingest Metric failed:', error);
    res.status(500).json({ message: 'Server error ingesting api metric' });
  }
};

export const ingestLog = async (req: Request, res: Response): Promise<void> => {
  try {
    const project = (req as any).project;
    const { level, message, service, metadata } = req.body;

    if (!level || !message || !service) {
      res.status(400).json({ message: 'level, message, and service are required' });
      return;
    }

    const log = await Log.create({
      eventId: req.body.eventId,
      projectId: project._id,
      organizationId: project.organizationId,
      level,
      message,
      service,
      metadata,
    });

    res.status(201).json({ message: 'Log ingested', logId: log._id });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(200).json({ message: 'Log already ingested', duplicate: true });
      return;
    }
    console.error('Ingest Log failed:', error);
    res.status(500).json({ message: 'Server error ingesting log' });
  }
};
