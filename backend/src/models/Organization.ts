import mongoose, { Schema, Document } from 'mongoose';

export interface IOrganization extends Document {
  name: string;
  plan: 'Free' | 'Pro' | 'Enterprise';
  eventLimit: number;
  eventsUsed: number;
  retentionDays: number;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true },
    plan: { type: String, enum: ['Free', 'Pro', 'Enterprise'], default: 'Free' },
    eventLimit: { type: Number, default: 10000 },
    eventsUsed: { type: Number, default: 0 },
    retentionDays: { type: Number, default: 30 },
  },
  { timestamps: true }
);

export default mongoose.model<IOrganization>('Organization', OrganizationSchema);
