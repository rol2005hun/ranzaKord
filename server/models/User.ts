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
    title?: string;
    artist?: string;
    thumbnailUrl?: string;
    durationSeconds?: number;
    updatedAt: Date;
  };
  settings?: {
    crossfadeEnabled?: boolean;
    crossfadeDuration?: number;
    crossfadeType?: string;
    isKaraoke?: boolean;
    isAudioReactiveLyrics?: boolean;
    isAdaptiveThemeEnabled?: boolean;
    theme?: string;
    customColor?: string;
    customColors?: Record<string, string>;
    visualizerStyle?: string;
    eqEnabled?: boolean;
    eqPreset?: string;
    eqBands?: number[];
    playbackOrder?: string;
    isSlowedReverb?: boolean;
    isNightcore?: boolean;
    reverbPreset?: string;
    isSpatialAudio?: boolean;
    isStereoWidener?: boolean;
    bassBoostEnabled?: boolean;
    playbackSpeed?: number;
    preservesPitch?: boolean;
    sponsorBlockEnabled?: boolean;
    globalShortcutsEnabled?: boolean;
  };
  roles?: string[];
  isPublicProfile?: boolean;
  showPlaylists?: boolean;
  followers?: string[];
  following?: string[];
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
      title: { type: String },
      artist: { type: String },
      thumbnailUrl: { type: String },
      durationSeconds: { type: Number },
      updatedAt: { type: Date }
    },
    settings: {
      crossfadeEnabled: { type: Boolean },
      crossfadeDuration: { type: Number },
      crossfadeType: { type: String },
      isKaraoke: { type: Boolean },
      isAudioReactiveLyrics: { type: Boolean },
      isAdaptiveThemeEnabled: { type: Boolean },
      theme: { type: String },
      customColor: { type: String },
      customColors: { type: Map, of: String },
      visualizerStyle: { type: String },
      eqEnabled: { type: Boolean },
      eqPreset: { type: String },
      eqBands: { type: [Number] },
      playbackOrder: { type: String, enum: ['sequential', 'random', 'reverse'] },
      isSlowedReverb: { type: Boolean },
      isNightcore: { type: Boolean },
      reverbPreset: { type: String },
      isSpatialAudio: { type: Boolean },
      isStereoWidener: { type: Boolean },
      bassBoostEnabled: { type: Boolean },
      playbackSpeed: { type: Number },
      preservesPitch: { type: Boolean },
      sponsorBlockEnabled: { type: Boolean },
      globalShortcutsEnabled: { type: Boolean }
    },
    roles: { type: [String], default: ['user'] },
    isPublicProfile: { type: Boolean, default: true },
    showPlaylists: { type: Boolean, default: true },
    followers: { type: [String], default: [] },
    following: { type: [String], default: [] }
  },
  { timestamps: true }
);

export const UserModel: Model<IUser> =
  mongoose.models['User'] ?? mongoose.model<IUser>('User', userSchema);
