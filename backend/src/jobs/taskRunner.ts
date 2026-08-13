import Task from '../models/Task';
import { sendEmail } from '../utils/mailer';

const POLL_INTERVAL_MS = 5000; // Poll every 5 seconds

// Helper to execute different task types
const executeTask = async (task: any) => {
  const { type, payload } = task;

  switch (type) {
    case 'email':
      await sendEmail(payload.to, payload.subject, payload.html, payload.text);
      break;

    case 'webhook':
      const response = await fetch(payload.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(payload.headers || {}) },
        body: JSON.stringify(payload.body),
      });
      if (!response.ok) {
        throw new Error(`Webhook failed with status ${response.status}: ${response.statusText}`);
      }
      break;

    default:
      throw new Error(`Unknown task type: ${type}`);
  }
};

const processPendingTasks = async () => {
  try {
    // Find one pending task and atomically set it to processing
    // Sorting by createdAt ensures FIFO queue
    const task = await Task.findOneAndUpdate(
      { status: 'pending' },
      { $set: { status: 'processing', updatedAt: new Date() } },
      { sort: { createdAt: 1 }, returnDocument: 'after' }
    );

    if (!task) return; // No pending tasks

    console.log(`[TaskRunner] Processing task ${task._id} of type ${task.type}`);

    try {
      await executeTask(task);
      // Mark as completed
      await Task.findByIdAndUpdate(task._id, {
        $set: { status: 'completed', updatedAt: new Date() },
      });
      console.log(`[TaskRunner] Task ${task._id} completed successfully`);
    } catch (error: any) {
      console.error(`[TaskRunner] Task ${task._id} failed:`, error.message);
      
      const nextAttempt = task.attempts + 1;
      const status = nextAttempt >= task.maxAttempts ? 'failed' : 'pending';
      
      await Task.findByIdAndUpdate(task._id, {
        $set: { 
          status, 
          attempts: nextAttempt, 
          error: error.message,
          updatedAt: new Date()
        },
      });

      if (status === 'failed') {
        console.error(`[TaskRunner] Task ${task._id} permanently failed after ${nextAttempt} attempts.`);
      }
    }
    
    // Process next task immediately if there was one (avoid waiting for interval)
    // We only process one at a time per loop to avoid overloading, but trigger next right away.
    setImmediate(processPendingTasks);
    
  } catch (error) {
    console.error('[TaskRunner] Error processing tasks:', error);
  }
};

export const startTaskRunner = () => {
  setInterval(processPendingTasks, POLL_INTERVAL_MS);
  
  // Also kick off immediately
  processPendingTasks();
};
