import mongoose, { Schema, Document } from 'mongoose';

export interface IAlertRule extends Document {
  projectId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  name: string;
  condition: 'count' | 'percentage' | 'latency' | 'throughput';
  threshold: number;
  timeWindow: number; // in minutes
  action: 'log' | 'email' | 'webhook' | 'slack';
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AlertRuleSchema = new Schema<IAlertRule>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    name: { type: String, required: true },
    condition: { type: String, enum: ['count', 'percentage', 'latency', 'throughput'], required: true },
    threshold: { type: Number, required: true },
    timeWindow: { type: Number, required: true, default: 5 },
    action: { type: String, enum: ['log', 'email', 'webhook', 'slack'], default: 'log' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

AlertRuleSchema.index({ projectId: 1, active: 1 });

export default mongoose.model<IAlertRule>('AlertRule', AlertRuleSchema);
