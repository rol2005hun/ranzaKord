import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
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

  console.log('Opening browser for Google/YouTube login...');
  let browser;
  try {
    browser = await chromium.launch({
      headless: false,
      channel: 'chrome'
    });
  } catch {
    browser = await chromium.launch({
      headless: false,
      channel: 'msedge'
    });
  }

  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Please log into your Google account in the browser window...');
  await page.goto(
    'https://accounts.google.com/ServiceLogin?service=youtube&continue=https%3A%2F%2Fwww.youtube.com%2F'
  );

  let capturedCookieString = '';
  const pollInterval = 1000;
  const maxWaitMs = 300000;
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const cookies = await context.cookies([
      'https://www.youtube.com',
      'https://youtube.com',
      'https://accounts.google.com',
      'https://google.com'
    ]);

    const hasAuthCookie = cookies.some(
      (c) => c.name === 'SAPISID' || c.name === '__Secure-1PSID' || c.name === 'LOGIN_INFO'
    );

    if (hasAuthCookie) {
      await page.waitForTimeout(2500);
      const finalCookies = await context.cookies([
        'https://www.youtube.com',
        'https://youtube.com',
        'https://accounts.google.com',
        'https://google.com'
      ]);
      capturedCookieString = finalCookies.map((c) => `${c.name}=${c.value}`).join('; ');
      break;
    }

    await new Promise((r) => setTimeout(r, pollInterval));
  }

  if (!capturedCookieString) {
    console.error('Authentication timed out or closed before completion.');
    await browser.close();
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log('Authentication detected! Saving session to database (youtube_cookies)...');
  await SystemConfig.findOneAndUpdate(
    { key: 'youtube_cookies' },
    { value: capturedCookieString },
    { upsert: true, returnDocument: 'after' }
  );
  console.log('Saved YouTube authentication to MongoDB.');

  await browser.close();

  console.log('Verifying session with YouTube Innertube...');
  try {
    const yt = await Innertube.create({
      cookie: capturedCookieString,
      cache: new UniversalCache(false)
    });
    console.log(`Innertube verification finished. Logged in status: ${yt.session.logged_in}`);
  } catch (err) {
    console.warn('Innertube test check returned:', err);
  }

  await mongoose.disconnect();
  console.log('Setup finished successfully!');
  process.exit(0);
}

run();
