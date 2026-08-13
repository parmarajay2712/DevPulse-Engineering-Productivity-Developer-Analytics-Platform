import mongoose, { Document, Schema } from 'mongoose';

export interface ITask extends Document {
  type: string;
  payload: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  maxAttempts: number;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    type: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 },
    error: { type: String },
  },
  { timestamps: true }
);

// Index for efficient polling
taskSchema.index({ status: 1, createdAt: 1 });

const Task = mongoose.models.Task || mongoose.model<ITask>('Task', taskSchema);

export default Task;
