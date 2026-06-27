import { Innertube, UniversalCache } from 'youtubei.js';
import fs from 'fs';

async function run() {
  const yt = await Innertube.create({ cache: new UniversalCache(false) });

  if (fs.existsSync('yt-creds.json')) {
    const creds = JSON.parse(fs.readFileSync('yt-creds.json', 'utf-8'));
    console.log('Loading saved creds');
    await yt.session.signIn(creds);
    console.log('Sign in complete!');
    const info = await yt.getBasicInfo('lFQdcPTTzSg');
    console.log(info.basic_info.title);
  } else {
    console.log('No creds found.');
  }
}
run();
