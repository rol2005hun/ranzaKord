import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IUser extends Document {
  sub: string;
  name: string;
  email: string;
  picture: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    sub: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    picture: { type: String, default: '' }
  },
  { timestamps: true }
);

export const UserModel: Model<IUser> =
  mongoose.models['User'] ?? mongoose.model<IUser>('User', userSchema);
