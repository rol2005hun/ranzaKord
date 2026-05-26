import mongoose from 'mongoose';

let isConnected = false;

export async function connectDb(): Promise<void> {
  if (isConnected) return;

  const config = useRuntimeConfig();

  await mongoose.connect(config.mongodbUri as string, {
    bufferCommands: false,
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 5000
  });

  isConnected = true;
}
