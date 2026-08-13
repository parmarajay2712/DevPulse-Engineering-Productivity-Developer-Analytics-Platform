import mongoose, { Schema, Document } from 'mongoose';

export interface IIncident extends Document {
  organizationId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  status: 'Investigating' | 'Resolved' | 'Closed';
  createdAt: Date;
  updatedAt: Date;
}

const IncidentSchema = new Schema<IIncident>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ['Investigating', 'Resolved', 'Closed'], default: 'Investigating' },
  },
  { timestamps: true }
);

export default mongoose.model<IIncident>('Incident', IncidentSchema);
