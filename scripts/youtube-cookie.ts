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

function extractFromJson(str: string): { poToken?: string; visitorData?: string } {
  try {
    const parsed = JSON.parse(str.trim());
    const poToken = parsed?.serviceIntegrityDimensions?.poToken;
    const visitorData = parsed?.context?.client?.visitorData;
    return { poToken, visitorData };
  } catch {
    return {};
  }
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
    console.log('='.repeat(60));
    console.log('\nHow to get the required values:');
    console.log('1. Open an Incognito browser window and go to youtube.com');
    console.log('2. Press F12 -> Network tab -> type "player" into the filter');
    console.log('3. Play any video, click on the "v1/player" POST request:');
    console.log('   - Cookie:  Under "Headers" -> "Request Headers" -> "cookie:"');
    console.log('   - Payload: You can copy and paste the entire "Payload" JSON,');
    console.log('              or individually copy poToken and visitorData.');
    console.log('='.repeat(60) + '\n');

    let cookie = process.argv[2];
    if (!cookie) {
      cookie = await rl.question('1. Paste YouTube Cookie string: ');
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

    if (!cookie) {
      console.error('No cookie provided. Aborting.');
      process.exit(1);
    }

    const payloadOrPo = await rl.question(
      '\n2. Optional: Paste entire Player Payload JSON (or just PO Token, or Enter to skip): '
    );

    let poToken: string | undefined;
    let visitorData: string | undefined;

    const extracted = extractFromJson(payloadOrPo);
    if (extracted.poToken || extracted.visitorData) {
      poToken = extracted.poToken;
      visitorData = extracted.visitorData;
      console.log(
        '\x1b[32mSuccessfully extracted poToken and visitorData from JSON payload!\x1b[0m'
      );
    } else {
      const candidatePo = payloadOrPo.trim();
      if (candidatePo && !candidatePo.startsWith('{') && candidatePo.length >= 20) {
        poToken = candidatePo;
      }
      const visitorInput = await rl.question(
        '3. Optional: Paste Visitor Data (press Enter to skip): '
      );
      const candidateVisitor = visitorInput.trim();
      if (candidateVisitor && !candidateVisitor.includes('{') && !candidateVisitor.includes('"')) {
        visitorData = candidateVisitor;
      }
    }

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
