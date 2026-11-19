import mongoose from 'mongoose';

export default defineNitroPlugin(async () => {
  if (import.meta.prerender) return;

  const config = useRuntimeConfig();

  if (!config.mongodbUri || config.mongodbUri === 'your_mongo_uri') {
    throw new Error('[ranzaKord] MONGODB_URI is not configured in .env');
  }

  try {
    await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
  } catch (err) {
    console.error('[ranzaKord] Failed to connect to MongoDB. Is MongoDB running?', err);
    throw err;
  }
});
