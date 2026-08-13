import mongoose, { Schema, Document } from 'mongoose';

export interface IApiMetric extends Document {
  eventId?: string;
  projectId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number; // in milliseconds
  timestamp: Date;
  user?: string;
  environment?: string;
  ip?: string;
  headers?: any;
  body?: any;
  response?: any;
}

const ApiMetricSchema = new Schema<IApiMetric>(
  {
    eventId: { type: String, unique: true, sparse: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    endpoint: { type: String, required: true },
    method: { type: String, required: true },
    statusCode: { type: Number, required: true },
    responseTime: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
    user: { type: String },
    environment: { type: String },
    ip: { type: String },
    headers: { type: Schema.Types.Mixed },
    body: { type: Schema.Types.Mixed },
    response: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Indexes for performance analytics
ApiMetricSchema.index({ projectId: 1, timestamp: -1 });
ApiMetricSchema.index({ projectId: 1, endpoint: 1, timestamp: -1 });

export default mongoose.model<IApiMetric>('ApiMetric', ApiMetricSchema);
