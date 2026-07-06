import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface ITrack extends Document {
  trackId: string;
  title: string;
  artist: string;
  thumbnailUrl: string;
  durationSeconds: number;
  globalPlayCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const trackSchema = new Schema<ITrack>(
  {
    trackId: { type: String, required: true, unique: true, index: true },
    title: { type: String, default: '' },
    artist: { type: String, default: '' },
    thumbnailUrl: { type: String, default: '' },
    durationSeconds: { type: Number, default: 0 },
    globalPlayCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const TrackModel: Model<ITrack> =
  mongoose.models['Track'] ?? mongoose.model<ITrack>('Track', trackSchema);
