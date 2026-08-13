import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import Project from '../models/Project';
import ErrorEvent from '../models/ErrorEvent';
import ErrorGroup from '../models/ErrorGroup';
import ApiMetric from '../models/ApiMetric';
import Log from '../models/Log';
import Incident from '../models/Incident';
import AlertRule from '../models/AlertRule';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/devpulse');
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedData = async () => {
  await connectDB();

  try {
    // Find a project to seed
    const project = await Project.findOne();
    if (!project) {
      console.log('No projects found. Please create a project first or start the app to auto-create one.');
      process.exit(0);
    }

    console.log(`Seeding data for project: ${project.name} (${project._id})`);

    const projectId = project._id;
    const organizationId = project.organizationId;

    // Clear existing data for this project (optional, but good for a clean state)
    console.log('Clearing old data...');
    await ErrorEvent.deleteMany({ projectId });
    await ErrorGroup.deleteMany({ projectId });
    await ApiMetric.deleteMany({ projectId });
    await Log.deleteMany({ projectId });

    const now = Date.now();
    const msInHour = 60 * 60 * 1000;
    const msInDay = 24 * msInHour;

    console.log('Generating API Metrics...');
    const apiMetrics = [];
    // Generate ~500 API metrics over the last 24 hours
    for (let i = 0; i < 500; i++) {
      const timeOffset = Math.random() * msInDay; // random time in last 24 hours
      const timestamp = new Date(now - timeOffset);
      
      const isError = Math.random() > 0.95; // 5% error rate
      const statusCode = isError ? (Math.random() > 0.5 ? 500 : 400) : 200;
      
      let endpoint = '/api/users';
      const rand = Math.random();
      if (rand > 0.7) endpoint = '/api/products';
      else if (rand > 0.4) endpoint = '/api/orders';

      const environments = ['production', 'development', 'staging'];
      const users = ['ajay@example.com', 'anonymous', 'test@gmail.com', 'admin@devpulse.com'];
      const ips = ['192.168.1.1', '10.0.0.5', '172.16.254.1', '8.8.8.8'];
      
      const method = Math.random() > 0.8 ? 'POST' : 'GET';
      const bodyPayload = method === 'POST' ? { action: 'submit', data: { items: [1, 2, 3] } } : undefined;
      const respPayload = isError ? { success: false, error: 'Validation failed' } : { success: true, count: 42, data: [{ id: 1, name: 'Test' }] };

      apiMetrics.push({
        projectId,
        organizationId,
        endpoint,
        method,
        statusCode,
        responseTime: Math.floor(Math.random() * 200) + (isError ? 300 : 50), // slower if error
        timestamp,
        environment: environments[Math.floor(Math.random() * environments.length)],
        user: users[Math.floor(Math.random() * users.length)],
        ip: ips[Math.floor(Math.random() * ips.length)],
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'accept': 'application/json',
          'content-type': 'application/json'
        },
        body: bodyPayload,
        response: respPayload
      });
    }
    await ApiMetric.insertMany(apiMetrics);

    console.log('Generating Errors...');
    // Create a few error groups
    const errorTypes = [
      { type: 'TypeError', msg: 'Cannot read properties of undefined (reading "map")' },
      { type: 'ReferenceError', msg: 'process is not defined' },
      { type: 'NetworkError', msg: 'Failed to connect to database' }
    ];

    for (const err of errorTypes) {
      const fingerprint = crypto.createHash('sha256').update(`${err.msg}-stack-/api/users`).digest('hex');
      const firstSeen = new Date(now - Math.random() * msInDay * 7 - msInDay); // 1-8 days ago
      const lastSeen = new Date(now - Math.random() * msInHour * 5); // recent

      const group = await ErrorGroup.create({
        projectId,
        organizationId,
        fingerprint,
        errorType: err.type,
        message: err.msg,
        stackTrace: 'Error\n  at /app/src/index.js:10:5',
        endpoint: '/api/users',
        source: 'backend',
        status: 'open',
        count: Math.floor(Math.random() * 20) + 5,
        firstSeen,
        lastSeen,
        user: 'ajay@example.com',
        environment: 'production',
        metadata: {
          browser: 'Chrome 114',
          os: 'Windows 11'
        }
      });

      const errorEvents = [];
      // Generate events for this group
      for (let i = 0; i < group.count; i++) {
        const timeOffset = Math.random() * msInDay;
        errorEvents.push({
          projectId,
          organizationId,
          groupId: group._id,
          errorType: err.type,
          message: err.msg,
          stackTrace: group.stackTrace,
          source: 'backend',
          timestamp: new Date(now - timeOffset)
        });
      }
      await ErrorEvent.insertMany(errorEvents);
    }

    console.log('Generating Logs...');
    const logs = [];
    for (let i = 0; i < 50; i++) {
      const timeOffset = Math.random() * msInDay;
      const isError = Math.random() > 0.8;
      logs.push({
        projectId,
        organizationId,
        level: isError ? 'error' : 'info',
        message: isError ? 'Failed to process job' : 'Job processed successfully',
        service: 'worker',
        timestamp: new Date(now - timeOffset)
      });
    }
    await Log.insertMany(logs);

    console.log('Generating Incidents...');
    const incidents = [];
    const incidentTypes = [
      { title: 'Payment Gateway Timeout', desc: 'High latency observed in Stripe API integration causing checkout failures for 5% of users.', status: 'Resolved' },
      { title: 'Database High CPU', desc: 'Primary database cluster hit 99% CPU utilization due to a missing index on the users collection.', status: 'Closed' },
      { title: 'Authentication Service Degraded', desc: 'Users experiencing intermittent 500 errors when attempting to log in via OAuth.', status: 'Investigating' },
      { title: 'Memory Leak in Worker Node', desc: 'Background jobs processing slowly due to memory exhaustion on worker-pool-3.', status: 'Investigating' }
    ];

    for (let i = 0; i < incidentTypes.length; i++) {
      const timeOffset = Math.random() * msInDay * (i + 1);
      incidents.push({
        projectId,
        organizationId,
        title: incidentTypes[i].title,
        description: incidentTypes[i].desc,
        status: incidentTypes[i].status,
        createdAt: new Date(now - timeOffset),
        updatedAt: new Date(now - timeOffset + Math.random() * msInHour * 2)
      });
    }
    await Incident.deleteMany({ projectId });
    await Incident.insertMany(incidents);

    console.log('Generating Deployments...');
    const deployments = [];
    for (let i = 0; i < 5; i++) {
      const timeOffset = Math.random() * msInDay * 7; // Last 7 days
      deployments.push({
        projectId,
        organizationId,
        version: `v1.2.${5-i}`,
        environment: 'production',
        status: i === 0 ? 'success' : (Math.random() > 0.8 ? 'failed' : 'success'),
        healthScore: Math.floor(Math.random() * 20) + 80,
        createdAt: new Date(now - timeOffset),
        updatedAt: new Date(now - timeOffset + msInHour),
      });
    }
    const Deployment = require('../models/Deployment').default;
    await Deployment.deleteMany({ projectId });
    await Deployment.insertMany(deployments);

    console.log('Generating Alert Rules...');
    const alertRules = [
      { projectId, organizationId, name: 'API Error Rate Spikes', condition: 'percentage', threshold: 5, timeWindow: 5, action: 'email' },
      { projectId, organizationId, name: 'Slow API Endpoints', condition: 'latency', threshold: 1000, timeWindow: 5, action: 'slack' },
      { projectId, organizationId, name: 'Deployment Regression', condition: 'count', threshold: 20, timeWindow: 5, action: 'email' },
      { projectId, organizationId, name: 'High Request Volume', condition: 'throughput', threshold: 10000, timeWindow: 1, action: 'log' }
    ];
    await AlertRule.deleteMany({ projectId });
    await AlertRule.insertMany(alertRules);

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
