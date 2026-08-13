import mongoose, { Schema, Document } from 'mongoose';

export enum UserRole {
  OWNER = 'Owner',
  ADMIN = 'Admin',
  MEMBER = 'Member',
  VIEWER = 'Viewer',
}

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  role: UserRole;
  organizationId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Optional for OAuth users
    googleId: { type: String },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.MEMBER },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
