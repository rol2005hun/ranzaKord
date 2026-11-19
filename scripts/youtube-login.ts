import fs from 'node:fs';
import path from 'node:path';
import { Innertube, UniversalCache } from 'youtubei.js';
import mongoose from 'mongoose';

const SystemConfigSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true }
});

const SystemConfig =
  mongoose.models.SystemConfig || mongoose.model('SystemConfig', SystemConfigSchema);

function getMongoUri(): string | undefined {
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

async function run(): Promise<void> {
  const uri = getMongoUri();
  if (!uri) {
    console.error('MONGODB_URI is not set in .env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('Connected to MongoDB.');

  const yt = await Innertube.create({
    cache: new UniversalCache(false)
  });

  yt.session.on('auth-pending', (data) => {
    console.log('\n' + '='.repeat(60));
    console.log(' YouTube Device Authorization');
    console.log('='.repeat(60));
    console.log(
      `\n 1. Open this URL in your browser:\n    \x1b[36m${data.verification_url}\x1b[0m\n`
    );
    console.log(` 2. Enter this code:\n    \x1b[32m\x1b[1m${data.user_code}\x1b[0m\n`);
    console.log('='.repeat(60) + '\n');
    console.log('Waiting for approval in browser...');
  });

  yt.session.on('auth', async ({ credentials }) => {
    console.log('\nAuthentication successful!');
    console.log('Saving YouTube OAuth tokens to MongoDB (youtube_oauth)...');
    await SystemConfig.findOneAndUpdate(
      { key: 'youtube_oauth' },
      { value: credentials },
      { upsert: true, returnDocument: 'after' }
    );
    console.log('Saved YouTube OAuth tokens to database!');
    await mongoose.disconnect();
    console.log('Setup finished successfully!');
    process.exit(0);
  });

  yt.session.on('auth-error', async (err) => {
    console.error('Authentication error:', err);
    await mongoose.disconnect();
    process.exit(1);
  });

  console.log('Requesting OAuth device code from YouTube...');
  await yt.session.signIn();
}

run();
