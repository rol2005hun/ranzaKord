import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IUser extends Document {
  sub: string;
  name: string;
  email: string;
  picture: string;
  hasAccess: boolean;
  lastPlayback?: {
    videoId: string;
    currentTime: number;
    updatedAt: Date;
  };
  settings?: {
    crossfadeEnabled?: boolean;
    crossfadeDuration?: number;
    crossfadeType?: string;
    isKaraoke?: boolean;
    isAudioReactiveLyrics?: boolean;
    theme?: string;
    customColor?: string;
    customColors?: Record<string, string>;
    visualizerStyle?: string;
    eqEnabled?: boolean;
    eqPreset?: string;
    eqBands?: number[];
    playbackOrder?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    sub: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    picture: { type: String, default: '' },
    hasAccess: { type: Boolean, default: false },
    lastPlayback: {
      videoId: { type: String },
      currentTime: { type: Number },
      updatedAt: { type: Date }
    },
    settings: {
      crossfadeEnabled: { type: Boolean },
      crossfadeDuration: { type: Number },
      crossfadeType: { type: String },
      isKaraoke: { type: Boolean },
      isAudioReactiveLyrics: { type: Boolean },
      theme: { type: String },
      customColor: { type: String },
      customColors: { type: Map, of: String },
      visualizerStyle: { type: String },
      eqEnabled: { type: Boolean },
      eqPreset: { type: String },
      eqBands: { type: [Number] },
      playbackOrder: { type: String, enum: ['sequential', 'random', 'reverse'] }
    }
  },
  { timestamps: true }
);

export const UserModel: Model<IUser> =
  mongoose.models['User'] ?? mongoose.model<IUser>('User', userSchema);
