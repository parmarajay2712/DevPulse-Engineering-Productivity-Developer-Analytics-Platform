import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';

export interface IProject extends Document {
  name: string;
  apiKeyHash: string;
  apiKeyPreview: string;
  lastUsedAt?: Date;
  environment: 'development' | 'staging' | 'production';
  slackWebhookUrl?: string;
  organizationId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true },
    apiKeyHash: { type: String, required: true },
    apiKeyPreview: { type: String, required: true },
    lastUsedAt: { type: Date },
    environment: { 
      type: String, 
      enum: ['development', 'staging', 'production'], 
      default: 'production' 
    },
    slackWebhookUrl: { type: String },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IProject>('Project', ProjectSchema);
