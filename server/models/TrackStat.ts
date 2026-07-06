import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface ITrackStat extends Document {
  userId: string;
  trackId: string;
  playCount: number;
  totalListening: number;
  lastPlayedAt: Date;
  skipCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const trackStatSchema = new Schema<ITrackStat>(
  {
    userId: { type: String, required: true, index: true },
    trackId: { type: String, required: true, index: true },
    playCount: { type: Number, default: 0 },
    totalListening: { type: Number, default: 0 },
    lastPlayedAt: { type: Date, required: true },
    skipCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

trackStatSchema.index({ userId: 1, trackId: 1 }, { unique: true });

export const TrackStatModel: Model<ITrackStat> =
  mongoose.models['TrackStat'] ?? mongoose.model<ITrackStat>('TrackStat', trackStatSchema);
