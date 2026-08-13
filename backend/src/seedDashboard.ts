import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from './models/Project';
import ApiMetric from './models/ApiMetric';
import HourlyMetric from './models/HourlyMetric';
import DailyMetric from './models/DailyMetric';
import ErrorEvent from './models/ErrorEvent';
import ErrorGroup from './models/ErrorGroup';
import crypto from 'crypto';

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || '');
    console.log('Connected to MongoDB for seeding...');

    const project = await Project.findOne({ name: 'Default Project' });
    if (!project) {
      console.log('No project found');
      process.exit(1);
    }
    
    console.log(`Seeding data for project: ${project._id}`);

    const now = new Date();
    
    // Clear old data for a clean slate if needed, or just insert new ones
    // Let's insert 30 days of data
    
    const endpoints = ['/api/auth/login', '/api/users/profile', '/api/products', '/api/checkout'];
    
    let totalErrors = 0;
    
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      
      let dailyTotalReq = 0;
      let dailyErrReq = 0;
      let dailySumTime = 0;
      
      // Hourly data for the last 7 days
      if (i < 7) {
        for (let h = 0; h < 24; h++) {
          const hd = new Date(d);
          hd.setUTCHours(h, 0, 0, 0);
          
          const requests = Math.floor(Math.random() * 500) + 100;
          const errors = Math.floor(Math.random() * (requests * 0.05));
          const avgTime = Math.floor(Math.random() * 100) + 50;
          
          dailyTotalReq += requests;
          dailyErrReq += errors;
          dailySumTime += avgTime * requests;
          
          await HourlyMetric.findOneAndUpdate(
            { projectId: project._id, timestamp: hd, endpoint: 'ALL' },
            { 
              $set: { 
                organizationId: project.organizationId,
                requestCount: requests,
                errorCount: errors,
                avgResponseTime: avgTime
              }
            },
            { upsert: true }
          );
          
          // Seed some raw ApiMetrics for Logs Explorer
          if (i < 2 && h === 12) {
             for (let m = 0; m < 5; m++) {
                await ApiMetric.create({
                  eventId: crypto.randomUUID(),
                  projectId: project._id,
                  organizationId: project.organizationId,
                  endpoint: endpoints[Math.floor(Math.random() * endpoints.length)],
                  method: ['GET', 'POST'][Math.floor(Math.random() * 2)],
                  statusCode: Math.random() > 0.9 ? 500 : 200,
                  responseTime: Math.floor(Math.random() * 200) + 20,
                  timestamp: new Date(hd.getTime() + m * 60 * 1000)
                });
             }
          }
        }
      } else {
         // Older than 7 days, just generate daily aggregates
         dailyTotalReq = Math.floor(Math.random() * 10000) + 2000;
         dailyErrReq = Math.floor(Math.random() * (dailyTotalReq * 0.05));
         dailySumTime = (Math.floor(Math.random() * 100) + 50) * dailyTotalReq;
      }
      
      // Daily Metric
      const dailyTime = new Date(d);
      dailyTime.setUTCHours(0, 0, 0, 0);
      await DailyMetric.findOneAndUpdate(
        { projectId: project._id, timestamp: dailyTime, endpoint: 'ALL' },
        { 
          $set: { 
            organizationId: project.organizationId,
            requestCount: dailyTotalReq,
            errorCount: dailyErrReq,
            avgResponseTime: Math.round(dailySumTime / dailyTotalReq)
          }
        },
        { upsert: true }
      );
      
      // Add ErrorEvents
      const errorCount = Math.floor(Math.random() * 5);
      totalErrors += errorCount;
      for (let e = 0; e < errorCount; e++) {
         const message = ['Null pointer exception', 'Timeout connecting to DB', 'Cannot read property undefined', 'Invalid credentials'][Math.floor(Math.random() * 4)];
         const fingerprint = crypto.createHash('sha256').update(message).digest('hex');
         
         const group = await ErrorGroup.findOneAndUpdate(
           { projectId: project._id, fingerprint },
           {
             $set: { 
               organizationId: project.organizationId, 
               errorType: 'UnhandledException', 
               message, 
               source: 'backend', 
               status: 'open', 
               lastSeen: d,
             },
             $inc: { count: 1 },
           },
           { upsert: true, returnDocument: 'after' }
         );
         
         await ErrorEvent.create({
           eventId: crypto.randomUUID(),
           projectId: project._id,
           organizationId: project.organizationId,
           groupId: group._id,
           errorType: 'UnhandledException',
           message,
           source: 'backend',
           timestamp: new Date(d.getTime() + Math.random() * 1000 * 60 * 60)
         });
      }
    }
    
    console.log(`Seeded 30 days of data successfully!`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seed();
