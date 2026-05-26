import mongoose from 'mongoose';

export default defineNitroPlugin(async () => {
  if (import.meta.prerender) return;

  const config = useRuntimeConfig();

  if (!config.mongodbUri) throw new Error('MONGODB_URI is not set');

  await mongoose.connect(config.mongodbUri);
});
