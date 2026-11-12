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

function cleanString(val?: string): string {
  if (!val) return '';
  const trimmed = val.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

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

function getCookieFromArgsOrEnv(): string {
  const cliArg = process.argv[2];
  if (cliArg && cliArg.trim().length > 0) {
    return cleanString(cliArg);
  }

  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/^(?:NUXT_)?YOUTUBE_COOKIES=(.*)$/m);
    if (match) {
      return cleanString(match[1]);
    }
  }

  return cleanString(process.env.NUXT_YOUTUBE_COOKIES || process.env.YOUTUBE_COOKIES);
}

async function run(): Promise<void> {
  const uri = getMongoUri();
  if (!uri) {
    console.error('MONGODB_URI is not set in .env');
    process.exit(1);
  }

  const cookie = getCookieFromArgsOrEnv();
  if (!cookie) {
    console.error('Usage: pnpm youtube:cookie "<cookie_string>"');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('Connected to MongoDB.');

  console.log('Saving YouTube cookies to MongoDB (youtube_cookies)...');
  await SystemConfig.findOneAndUpdate(
    { key: 'youtube_cookies' },
    { value: cookie },
    { upsert: true, returnDocument: 'after' }
  );
  console.log('Saved YouTube cookies to MongoDB successfully.');

  console.log('Verifying cookies with YouTube Innertube...');
  try {
    const yt = await Innertube.create({
      cookie,
      cache: new UniversalCache(false)
    });
    console.log(`Innertube verification finished. Logged in status: ${yt.session.logged_in}`);
  } catch (err) {
    console.warn('Innertube validation check failed:', err);
  }

  await mongoose.disconnect();
  process.exit(0);
}

run();
