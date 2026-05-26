import { connectDb } from '../utils/db';

export default defineNitroPlugin(async () => {
  const config = useRuntimeConfig();

  if (!config.mongodbUri) return;

  await connectDb();
});
