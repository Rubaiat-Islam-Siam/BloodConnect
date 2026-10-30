import mongoose, { Document, Model, Schema } from 'mongoose';
import { VALID_BLOOD_GROUPS, type BloodGroup } from '../lib/request-validator';
import { USER_ROLES, type UserRole } from '../lib/auth';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  bloodGroup?: BloodGroup;
  location?: string;
  availableToDonate?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: 'PATIENT',
      required: true,
    },
    bloodGroup: {
      type: String,
      enum: VALID_BLOOD_GROUPS,
      required: function (this: IUser) {
        return this.role === 'DONOR';
      },
    },
    location: {
      type: String,
      trim: true,
      default: '',
      required: function (this: IUser) {
        return this.role === 'DONOR';
      },
    },
    availableToDonate: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model recompilation during Next.js hot-reloads
export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;

