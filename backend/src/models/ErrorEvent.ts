import mongoose, { Schema, Document } from 'mongoose';

export interface IErrorEvent extends Document {
  eventId?: string;
  projectId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  errorType: string;
  message: string;
  stackTrace?: string;
  metadata?: any;
  user?: any;
  environment?: string;
  source: 'frontend' | 'backend';
  endpoint?: string;
  browser?: string;
  os?: string;
  userId?: string;
  timestamp: Date;
  resolved: boolean;
}

const ErrorEventSchema = new Schema<IErrorEvent>(
  {
    eventId: { type: String, unique: true, sparse: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    groupId: { type: Schema.Types.ObjectId, ref: 'ErrorGroup', required: true },
    errorType: { type: String, required: true },
    message: { type: String, required: true },
    stackTrace: { type: String },
    source: { type: String, enum: ['frontend', 'backend'], required: true },
    endpoint: { type: String },
    browser: { type: String },
    os: { type: String },
    userId: { type: String },
    timestamp: { type: Date, default: Date.now },
    resolved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Index for faster queries on dashboards
ErrorEventSchema.index({ projectId: 1, timestamp: -1 });
ErrorEventSchema.index({ groupId: 1, timestamp: -1 });

export default mongoose.model<IErrorEvent>('ErrorEvent', ErrorEventSchema);
