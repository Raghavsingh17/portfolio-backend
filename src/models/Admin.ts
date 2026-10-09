import mongoose, { Document, Schema, Model } from "mongoose";

export interface IAdmin extends Document {
  name: string;
  email: string;
  password: string;
  role: string;
  failedLoginAttempts: number;
  lockUntil?: Date | null;
  lastLoginAt?: Date | null;
  lastLoginIP?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const adminSchema = new Schema<IAdmin>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email address is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    role: {
      type: String,
      default: "admin",
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    lastLoginIP: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Admin: Model<IAdmin> = mongoose.models.Admin || mongoose.model<IAdmin>("Admin", adminSchema);

