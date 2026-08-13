import mongoose, { Schema, Document } from 'mongoose';

export interface IErrorGroup extends Document {
  projectId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  fingerprint: string;
  errorType: string;
  message: string;
  stackTrace?: string;
  endpoint?: string;
  count: number;
  firstSeen: Date;
  lastSeen: Date;
  status: 'open' | 'acknowledged' | 'resolved' | 'ignored';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: mongoose.Types.ObjectId;
  source: 'frontend' | 'backend';
  metadata?: any;
  user?: string;
  environment?: string;
}

const ErrorGroupSchema = new Schema<IErrorGroup>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    fingerprint: { type: String, required: true }, // Hash of message + stack + endpoint
    errorType: { type: String, required: true },
    message: { type: String, required: true },
    stackTrace: { type: String },
    endpoint: { type: String },
    count: { type: Number, default: 1 },
    firstSeen: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now },
    status: { type: String, enum: ['open', 'acknowledged', 'resolved', 'ignored'], default: 'open' },
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    source: { type: String, enum: ['frontend', 'backend'], required: true, default: 'backend' },
    metadata: { type: Schema.Types.Mixed },
    user: { type: String },
    environment: { type: String },
  },
  { timestamps: true }
);

// Compound index for fast lookup of a specific error in a project
ErrorGroupSchema.index({ projectId: 1, fingerprint: 1 }, { unique: true });
ErrorGroupSchema.index({ projectId: 1, status: 1, lastSeen: -1 });

export default mongoose.model<IErrorGroup>('ErrorGroup', ErrorGroupSchema);
