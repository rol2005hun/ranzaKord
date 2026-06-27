import { Innertube, UniversalCache } from 'youtubei.js';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

async function getMongoUri() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/^(?:NUXT_)?MONGODB_URI=(.*)$/m);
    if (match) {
      return match[1].trim();
    }
  }
  return process.env.NUXT_MONGODB_URI || process.env.MONGODB_URI;
}

// Simple schema just for the script
const SystemConfigSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true }
});
const SystemConfig =
  mongoose.models.SystemConfig || mongoose.model('SystemConfig', SystemConfigSchema);

async function run() {
  const uri = await getMongoUri();
  if (!uri) {
    console.error('❌ MONGODB_URI is not set in .env');
    process.exit(1);
  }

  console.log('🔗 Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB.');

  console.log('🚀 Initializing YouTube client...');
  const yt = await Innertube.create({ cache: new UniversalCache(false) });

  yt.session.on('auth-pending', (data) => {
    console.log(`\n\n======================================================`);
    console.log(`⚠️  ACTION REQUIRED:`);
    console.log(`Please go to: ${data.verification_url}`);
    console.log(`And enter the code: ${data.user_code}`);
    console.log(`======================================================\n\n`);
  });

  yt.session.on('auth', async ({ credentials }) => {
    console.log('✅ Successfully signed in!');
    await SystemConfig.findOneAndUpdate(
      { key: 'youtube_oauth' },
      { value: credentials },
      { upsert: true, returnDocument: 'after' }
    );
    console.log('💾 Credentials saved to MongoDB (youtube_oauth).');

    await mongoose.disconnect();
    process.exit(0);
  });

  yt.session.on('update-credentials', async ({ credentials }) => {
    console.log('🔄 Credentials updated in background, saving...');
    await SystemConfig.findOneAndUpdate(
      { key: 'youtube_oauth' },
      { value: credentials },
      { upsert: true, returnDocument: 'after' }
    );
  });

  try {
    await yt.session.signIn();
  } catch (err) {
    console.error('❌ Sign in failed:', err);
    process.exit(1);
  }
}

run();
