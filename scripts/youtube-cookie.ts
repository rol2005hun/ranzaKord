import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { Innertube, UniversalCache, Platform } from 'youtubei.js';
import mongoose from 'mongoose';

Platform.shim.eval = (d) => new Function(d.output)();

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

  const rl = readline.createInterface({ input, output });

  try {
    console.log('\n' + '='.repeat(60));
    console.log(' YouTube Cookie & Session Setup for Production (MongoDB)');
    console.log('='.repeat(60) + '\n');

    let cookie = process.argv[2];
    if (!cookie) {
      console.log('Open YouTube in your browser (preferably Incognito), open DevTools (F12),');
      console.log('copy the Cookie header from any youtube.com request, and paste it here:\n');
      cookie = await rl.question('Paste YouTube Cookie string: ');
    }

    cookie = cookie.trim();
    if (!cookie) {
      console.error('No cookie provided. Aborting.');
      process.exit(1);
    }

    const poTokenInput = await rl.question('\nOptional: Paste PO Token (press Enter to skip): ');
    const poToken = poTokenInput.trim() || undefined;

    const visitorDataInput = await rl.question(
      'Optional: Paste Visitor Data (press Enter to skip): '
    );
    const visitorData = visitorDataInput.trim() || undefined;

    console.log('\nValidating credentials with YouTube...');
    try {
      const yt = await Innertube.create({
        cache: new UniversalCache(false),
        retrieve_player: true,
        cookie,
        po_token: poToken,
        visitor_data: visitorData,
        generate_session_locally: Boolean(poToken && visitorData)
      });

      const testInfo = await yt.getBasicInfo('uKN8nzH41r8', { client: 'TV_SIMPLY' });
      const status = testInfo.playability_status?.status;
      const formatsCount = [
        ...(testInfo.streaming_data?.formats || []),
        ...(testInfo.streaming_data?.adaptive_formats || [])
      ].length;

      if (status === 'OK' && formatsCount > 0) {
        console.log(
          `\x1b[32mVerification successful! Status: OK (${formatsCount} formats available)\x1b[0m`
        );
      } else {
        console.log(
          `\x1b[33mWarning: YouTube returned status: ${status} (${formatsCount} formats)\x1b[0m`
        );
      }
    } catch (testErr) {
      console.log('\x1b[33mValidation check encountered an error, saving anyway:\x1b[0m', testErr);
    }

    console.log('\nConnecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('Connected to MongoDB.');

    await SystemConfig.findOneAndUpdate(
      { key: 'youtube_cookies' },
      { value: cookie },
      { upsert: true, returnDocument: 'after' }
    );
    console.log('\x1b[32mSaved YouTube cookies to MongoDB (youtube_cookies)!\x1b[0m');

    if (poToken) {
      await SystemConfig.findOneAndUpdate(
        { key: 'youtube_po_token' },
        { value: poToken },
        { upsert: true, returnDocument: 'after' }
      );
      console.log('\x1b[32mSaved PO Token to MongoDB (youtube_po_token)!\x1b[0m');
    }

    if (visitorData) {
      await SystemConfig.findOneAndUpdate(
        { key: 'youtube_visitor_data' },
        { value: visitorData },
        { upsert: true, returnDocument: 'after' }
      );
      console.log('\x1b[32mSaved Visitor Data to MongoDB (youtube_visitor_data)!\x1b[0m');
    }

    await mongoose.disconnect();
    console.log(
      '\nSetup finished successfully! Your production server can now use these credentials.'
    );
    process.exit(0);
  } catch (err) {
    console.error('Failed to save YouTube credentials:', err);
    process.exit(1);
  } finally {
    rl.close();
  }
}

run();
