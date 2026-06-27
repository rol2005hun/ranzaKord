import type { Document } from 'mongoose';
import mongoose from 'mongoose';

export interface ISystemConfig extends Document {
  key: string;
  value: unknown;
}

const SystemConfigSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true }
  },
  { timestamps: true }
);

export const SystemConfig =
  (mongoose.models.SystemConfig as mongoose.Model<ISystemConfig>) ||
  mongoose.model<ISystemConfig>('SystemConfig', SystemConfigSchema);
