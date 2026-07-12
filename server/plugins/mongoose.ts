import mongoose from 'mongoose';

export default defineNitroPlugin(async () => {
  if (import.meta.prerender) return;

  const config = useRuntimeConfig();

  if (!config.mongodbUri) throw new Error('MONGODB_URI is not set');

  try {
    await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    throw err;
  }
});
