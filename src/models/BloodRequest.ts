import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import {
  VALID_BLOOD_GROUPS,
  REQUEST_STATUSES,
  type BloodGroup,
  type RequestStatus,
} from '../lib/request-validator';

export interface IBloodRequest extends Document {
  patientId: Types.ObjectId;
  bloodGroup: BloodGroup;
  units: number;
  location: string;
  contactDetails?: string;
  status: RequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

const BloodRequestSchema = new Schema<IBloodRequest>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient reference is required'],
      index: true,
    },
    bloodGroup: {
      type: String,
      enum: VALID_BLOOD_GROUPS,
      required: [true, 'Blood group is required'],
      index: true,
    },
    units: {
      type: Number,
      required: [true, 'Units required'],
      min: [1, 'At least 1 unit of blood must be requested'],
      validate: {
        validator: Number.isInteger,
        message: 'Units must be an integer',
      },
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    contactDetails: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: REQUEST_STATUSES,
      default: 'PENDING',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for queries by status and date
BloodRequestSchema.index({ status: 1, createdAt: -1 });

export const BloodRequest: Model<IBloodRequest> =
  mongoose.models.BloodRequest ||
  mongoose.model<IBloodRequest>('BloodRequest', BloodRequestSchema);

export default BloodRequest;

