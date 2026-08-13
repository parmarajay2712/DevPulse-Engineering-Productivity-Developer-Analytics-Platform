import mongoose, { Schema, Document } from 'mongoose';

export interface IPerformanceMetric extends Document {
  eventId?: string;
  projectId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  url: string;
  pageLoadTime: number;
  cls: number;
  lcp: number;
  createdAt: Date;
}

const PerformanceMetricSchema = new Schema<IPerformanceMetric>(
  {
    eventId: { type: String, unique: true, sparse: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    url: { type: String, required: true },
    pageLoadTime: { type: Number, required: true },
    cls: { type: Number, required: true },
    lcp: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model<IPerformanceMetric>('PerformanceMetric', PerformanceMetricSchema);
