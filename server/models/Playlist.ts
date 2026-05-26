import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IPlaylistItem {
  videoId: string;
  title: string;
  artist: string;
  thumbnailUrl: string;
  durationMs: number;
  addedAt: Date;
}

export interface IPlaylist extends Document {
  userId: string;
  name: string;
  description: string;
  imageUrl: string;
  items: IPlaylistItem[];
  createdAt: Date;
  updatedAt: Date;
}

const playlistItemSchema = new Schema<IPlaylistItem>(
  {
    videoId: { type: String, required: true },
    title: { type: String, required: true },
    artist: { type: String, default: '' },
    thumbnailUrl: { type: String, default: '' },
    durationMs: { type: Number, default: 0 },
    addedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const playlistSchema = new Schema<IPlaylist>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    items: { type: [playlistItemSchema], default: [] }
  },
  { timestamps: true }
);

export const PlaylistModel: Model<IPlaylist> =
  mongoose.models['Playlist'] ?? mongoose.model<IPlaylist>('Playlist', playlistSchema);
