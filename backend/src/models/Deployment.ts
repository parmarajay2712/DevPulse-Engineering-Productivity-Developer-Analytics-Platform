import mongoose, { Schema, Document } from 'mongoose';

export interface IDeployment extends Document {
  projectId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  version: string;
  environment: string;
  status: 'pending' | 'success' | 'failed';
  healthScore?: number; // e.g. 0-100
  createdAt: Date;
  updatedAt: Date;
}

const DeploymentSchema = new Schema<IDeployment>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    version: { type: String, required: true },
    environment: { type: String, required: true },
    status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
    healthScore: { type: Number },
  },
  { timestamps: true }
);

DeploymentSchema.index({ projectId: 1, createdAt: -1 });

export default mongoose.model<IDeployment>('Deployment', DeploymentSchema);
