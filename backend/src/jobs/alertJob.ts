import cron from 'node-cron';
import AlertRule from '../models/AlertRule';
import ErrorEvent from '../models/ErrorEvent';
import ApiMetric from '../models/ApiMetric';
import { io } from '../index';
import { enqueueTask } from '../utils/taskQueue';

// Run every minute
cron.schedule('* * * * *', async () => {
  try {
    const rules = await AlertRule.find({ active: true });

    for (const rule of rules) {
      const timeLimit = new Date(Date.now() - rule.timeWindow * 60 * 1000);
      let triggered = false;
      let metricValue = 0;

      switch (rule.condition) {
        case 'count': {
          // Count of errors in the time window
          metricValue = await ErrorEvent.countDocuments({
            projectId: rule.projectId,
            timestamp: { $gte: timeLimit },
          });
          triggered = metricValue > rule.threshold;
          break;
        }
        case 'percentage': {
          // Error rate = (failed API calls / total API calls) * 100
          const totalCalls = await ApiMetric.countDocuments({
            projectId: rule.projectId,
            timestamp: { $gte: timeLimit },
          });
          const failedCalls = await ApiMetric.countDocuments({
            projectId: rule.projectId,
            statusCode: { $gte: 400 },
            timestamp: { $gte: timeLimit },
          });
          metricValue = totalCalls > 0 ? (failedCalls / totalCalls) * 100 : 0;
          triggered = metricValue > rule.threshold;
          break;
        }
        case 'latency': {
          // Average response time in the time window
          const avgAgg = await ApiMetric.aggregate([
            { $match: { projectId: rule.projectId, timestamp: { $gte: timeLimit } } },
            { $group: { _id: null, avg: { $avg: '$responseTime' } } }
          ]);
          metricValue = avgAgg.length > 0 ? Math.round(avgAgg[0].avg) : 0;
          triggered = metricValue > rule.threshold;
          break;
        }
        case 'throughput': {
          // Total request count in the time window
          metricValue = await ApiMetric.countDocuments({
            projectId: rule.projectId,
            timestamp: { $gte: timeLimit },
          });
          triggered = metricValue > rule.threshold;
          break;
        }
      }

      if (triggered) {
        console.log(`[ALERT TRIGGERED]: Rule "${rule.name}" — ${rule.condition} = ${metricValue} (threshold: ${rule.threshold}) in last ${rule.timeWindow}m.`);
        
        // Emit via socket for real-time alert
        if (io) {
          io.to(rule.projectId.toString()).emit('alert-triggered', {
            ruleName: rule.name,
            condition: rule.condition,
            metricValue,
            threshold: rule.threshold,
            timeWindow: rule.timeWindow,
          });
        }

        // Populate project to get webhook URL and owner email
        const project = await require('../models/Project').default.findById(rule.projectId).populate('ownerId');

        // Webhook Integration
        if (rule.action === 'webhook' && project && project.slackWebhookUrl) {
          await enqueueTask('webhook', {
            url: project.slackWebhookUrl,
            body: { text: `🚨 DevPulse Alert: ${rule.name} triggered — ${rule.condition} = ${metricValue}.` }
          });
        }

        // Email Integration
        if (rule.action === 'email' && project && project.ownerId) {
          const ownerEmail = (project.ownerId as any).email;
          if (ownerEmail) {
            await enqueueTask('email', {
              to: ownerEmail,
              subject: `🚨 DevPulse Alert: ${rule.name}`,
              html: `<h3>Alert Triggered</h3><p>Rule: <b>${rule.name}</b></p><p>Condition: ${rule.condition} = ${metricValue} (Threshold: ${rule.threshold})</p><p>Time Window: Last ${rule.timeWindow} minutes</p>`,
              text: `Alert Triggered\nRule: ${rule.name}\nCondition: ${rule.condition} = ${metricValue} (Threshold: ${rule.threshold})\nTime Window: Last ${rule.timeWindow} minutes`
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in alert job:', error);
  }
});
