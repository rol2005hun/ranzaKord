import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface ISystemConfig extends Document {
  key: string;
  value: unknown;
  createdAt: Date;
  updatedAt: Date;
}

const systemConfigSchema = new Schema<ISystemConfig>(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: Schema.Types.Mixed, required: true }
  },
  { timestamps: true }
);

export const SystemConfigModel: Model<ISystemConfig> =
  mongoose.models['SystemConfig'] ??
  mongoose.model<ISystemConfig>('SystemConfig', systemConfigSchema);
