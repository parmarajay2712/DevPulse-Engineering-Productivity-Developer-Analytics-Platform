import mongoose, { Schema, Document } from 'mongoose';

export interface IHourlyMetric extends Document {
  projectId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  endpoint: string; // The endpoint, or 'ALL' for a global project rollup
  timestamp: Date; // The hour boundary (e.g., 2026-08-13T10:00:00.000Z)
  requestCount: number;
  errorCount: number;
  avgResponseTime: number;
  p50: number;
  p95: number;
  p99: number;
  minResponseTime: number;
  maxResponseTime: number;
}

const HourlyMetricSchema = new Schema<IHourlyMetric>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    endpoint: { type: String, required: true },
    timestamp: { type: Date, required: true },
    requestCount: { type: Number, default: 0 },
    errorCount: { type: Number, default: 0 },
    avgResponseTime: { type: Number, default: 0 },
    p50: { type: Number, default: 0 },
    p95: { type: Number, default: 0 },
    p99: { type: Number, default: 0 },
    minResponseTime: { type: Number, default: 0 },
    maxResponseTime: { type: Number, default: 0 },
  },
  { timestamps: true }
);

HourlyMetricSchema.index({ projectId: 1, endpoint: 1, timestamp: -1 }, { unique: true });

export default mongoose.model<IHourlyMetric>('HourlyMetric', HourlyMetricSchema);
