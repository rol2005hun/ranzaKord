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

function extractCredentials(raw: string): {
  cookie?: string;
  poToken?: string;
  visitorData?: string;
} {
  let cookie: string | undefined;
  let poToken: string | undefined;
  let visitorData: string | undefined;

  const cookieMatch = raw.match(/cookie:\s*([^\r\n]+)/i);
  if (cookieMatch?.[1]) {
    cookie = cookieMatch[1].trim();
  }

  const poMatch = raw.match(/"poToken"\s*:\s*"([^"]+)"/i);
  if (poMatch?.[1]) {
    poToken = poMatch[1].trim();
  }

  const visitorMatch = raw.match(/"visitorData"\s*:\s*"([^"]+)"/i);
  if (visitorMatch?.[1]) {
    visitorData = visitorMatch[1].trim();
  }

  if (visitorData && visitorData.includes('%')) {
    try {
      visitorData = decodeURIComponent(visitorData);
    } catch {
      void 0;
    }
  }

  return { cookie, poToken, visitorData };
}

async function readMultilineInput(rl: readline.Interface, promptText: string): Promise<string> {
  console.log(promptText);
  return new Promise((resolve) => {
    let accumulated = '';
    let timeout: NodeJS.Timeout | null = null;

    const onLine = (line: string) => {
      accumulated += (accumulated ? '\n' : '') + line;
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        rl.removeListener('line', onLine);
        resolve(accumulated.trim());
      }, 350);
    };

    rl.on('line', onLine);
  });
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
    console.log(' YouTube Cookie Setup for Production (MongoDB)');
    console.log('='.repeat(60));
    console.log('\nHow to get the credentials:');
    console.log('1. Open an Incognito browser window and go to youtube.com');
    console.log('2. Press F12 -> Network tab -> type "player" into the filter');
    console.log('3. Play any video, click on the "v1/player" POST request:');
    console.log('   - Headers tab: Copy the "cookie:" value');
    console.log('   - Payload tab: Find "serviceIntegrityDimensions" -> "poToken"');
    console.log('   - Payload tab: Find "context" -> "client" -> "visitorData"');
    console.log('='.repeat(60) + '\n');

    let cookie = process.argv[2];
    if (!cookie) {
      cookie = await rl.question(
        '1. Paste YouTube Cookie string (from Headers, or press Enter if already in MongoDB): '
      );
    }

    cookie = cookie.trim();
    if (cookie.toLowerCase().startsWith('cookie:')) {
      cookie = cookie.slice(7).trim();
    }
    if (
      (cookie.startsWith('"') && cookie.endsWith('"')) ||
      (cookie.startsWith("'") && cookie.endsWith("'"))
    ) {
      cookie = cookie.slice(1, -1).trim();
    }

    let poToken = process.argv[3] || '';
    let visitorData = process.argv[4] || '';

    if (!poToken || !visitorData) {
      const payloadInput = await readMultilineInput(
        rl,
        '\n2. Paste Payload (you can paste the ENTIRE JSON from the Payload tab, or press Enter to skip):'
      );
      if (payloadInput) {
        const extracted = extractCredentials(payloadInput);
        if (extracted.cookie && !cookie) {
          cookie = extracted.cookie;
        }
        if (extracted.poToken) {
          poToken = extracted.poToken;
          console.log('\x1b[32m✔ Auto-extracted poToken from payload!\x1b[0m');
        }
        if (extracted.visitorData) {
          visitorData = extracted.visitorData;
          console.log('\x1b[32m✔ Auto-extracted visitorData from payload!\x1b[0m');
        }
        if (!extracted.poToken && !extracted.visitorData && payloadInput.length > 20) {
          if (payloadInput.includes('.')) {
            poToken = payloadInput;
          } else {
            visitorData = payloadInput;
          }
        }
      }
    }

    console.log('\nConnecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('Connected to MongoDB.');

    if (!cookie) {
      const existing = await SystemConfig.findOne({ key: 'youtube_cookies' });
      if (existing?.value) {
        cookie = String(existing.value);
        console.log('Using existing YouTube cookies from MongoDB.');
      }
    }

    if (!cookie) {
      console.error('No cookie provided and none found in MongoDB. Aborting.');
      process.exit(1);
    }

    console.log('\nValidating credentials with YouTube (WEB client)...');
    try {
      const yt = await Innertube.create({
        cache: new UniversalCache(false),
        retrieve_player: true,
        cookie,
        po_token: poToken || undefined,
        visitor_data: visitorData || undefined,
        generate_session_locally: Boolean(poToken && visitorData)
      });

      const testInfo = await yt.getBasicInfo('vz6y3DDBTXA', { client: 'WEB' });
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
        { upsert: true }
      );
      console.log('\x1b[32mSaved PO Token to MongoDB (youtube_po_token)!\x1b[0m');
    }

    if (visitorData) {
      await SystemConfig.findOneAndUpdate(
        { key: 'youtube_visitor_data' },
        { value: visitorData },
        { upsert: true }
      );
      console.log('\x1b[32mSaved Visitor Data to MongoDB (youtube_visitor_data)!\x1b[0m');
    }

    await mongoose.disconnect();
    console.log(
      '\nSetup finished successfully! Your production server can now stream video and audio using these credentials.'
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
