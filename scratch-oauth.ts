import { Innertube, UniversalCache } from 'youtubei.js';
import fs from 'fs';

async function run() {
  const yt = await Innertube.create({ cache: new UniversalCache(false) });

  yt.session.on('auth-pending', (data) => {
    console.log(`\n\n\n=== ACTION REQUIRED ===`);
    console.log(`Please go to ${data.verification_url} and enter code: ${data.user_code}`);
    console.log(`=======================\n\n\n`);
  });

  yt.session.on('auth', ({ credentials }) => {
    console.log('Successfully signed in!', credentials);
    fs.writeFileSync('yt-creds.json', JSON.stringify(credentials, null, 2));
  });

  yt.session.on('update-credentials', ({ credentials }) => {
    console.log('Credentials updated!', credentials);
    fs.writeFileSync('yt-creds.json', JSON.stringify(credentials, null, 2));
  });

  await yt.session.signIn();
}
run();
