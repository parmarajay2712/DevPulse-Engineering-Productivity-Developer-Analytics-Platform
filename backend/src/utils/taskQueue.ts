import Task from '../models/Task';

export const enqueueTask = async (type: string, payload: any, maxAttempts: number = 3) => {
  try {
    const task = await Task.create({
      type,
      payload,
      status: 'pending',
      attempts: 0,
      maxAttempts,
    });
    console.log(`Enqueued task [${type}] with ID: ${task._id}`);
    return task;
  } catch (error) {
    console.error(`Failed to enqueue task [${type}]:`, error);
    throw error;
  }
};
