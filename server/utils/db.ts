import mongoose from 'mongoose';

let isConnected = false;

export async function connectDb(): Promise<void> {
  if (isConnected) return;
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return;
  }

  const config = useRuntimeConfig();

  try {
    await mongoose.connect(config.mongodbUri as string);
    isConnected = true;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
  }
}
