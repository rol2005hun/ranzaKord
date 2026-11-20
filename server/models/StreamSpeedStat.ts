import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IStreamSpeedStat extends Document {
  videoId: string;
  client: string;
  durationMs: number;
  status: 'hit' | 'resolved' | 'failed';
  isDeciphered: boolean;
  formatsCount: number;
  contentLength?: number;
  errorMessage?: string;
  createdAt: Date;
}

const streamSpeedStatSchema = new Schema<IStreamSpeedStat>(
  {
    videoId: { type: String, required: true, index: true },
    client: { type: String, required: true, index: true },
    durationMs: { type: Number, required: true },
    status: { type: String, enum: ['hit', 'resolved', 'failed'], required: true },
    isDeciphered: { type: Boolean, default: false },
    formatsCount: { type: Number, default: 0 },
    contentLength: { type: Number },
    errorMessage: { type: String }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

streamSpeedStatSchema.index({ createdAt: -1 });

export const StreamSpeedStat: Model<IStreamSpeedStat> =
  mongoose.models['StreamSpeedStat'] ??
  mongoose.model<IStreamSpeedStat>('StreamSpeedStat', streamSpeedStatSchema);
