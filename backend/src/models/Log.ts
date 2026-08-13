import mongoose, { Schema, Document } from 'mongoose';

export interface ILog extends Document {
  eventId?: string;
  projectId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  service: string;
  metadata?: any;
  timestamp: Date;
}

const LogSchema = new Schema<ILog>(
  {
    eventId: { type: String, unique: true, sparse: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    level: { type: String, enum: ['info', 'warn', 'error', 'debug'], required: true },
    message: { type: String, required: true },
    service: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

LogSchema.index({ projectId: 1, timestamp: -1 });
LogSchema.index({ projectId: 1, level: 1, timestamp: -1 });

export default mongoose.model<ILog>('Log', LogSchema);
