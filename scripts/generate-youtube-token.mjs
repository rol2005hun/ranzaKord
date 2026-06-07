import { Innertube } from 'youtubei.js';
import fs from 'fs';
import path from 'path';

console.log('Generating YouTube OAuth2 Token...\n');

try {
  const yt = await Innertube.create({ generate_session_locally: true });

  yt.session.on('auth-pending', (data) => {
    console.log(`\n1. Go to this URL: ${data.verification_url}`);
    console.log(`2. Enter this code: ${data.user_code}`);
    console.log('\nWaiting for you to authorize (the script will continue automatically)...\n');
  });

  yt.session.on('auth', (data) => {
    console.log('\n✅ Authorization successful!\n');

    const tokenPath = path.resolve(process.cwd(), 'youtube-oauth-token.json');
    const tokenStr = JSON.stringify(data.credentials);

    fs.writeFileSync(tokenPath, tokenStr, 'utf8');

    console.log(`✅ Token successfully saved to: ${tokenPath}`);
    console.log('\n⚠️ PLEASE OPEN THIS FILE in your editor and copy its entire contents.');
    console.log(
      'Do NOT copy it from the terminal directly, as terminals often insert hidden spaces or newlines that break the token!'
    );
    console.log(
      '\nPaste the contents of that file into your Netlify environment variables as NUXT_YOUTUBE_OAUTH_TOKEN.'
    );
    console.log(
      '🎉 Good news: Because of MongoDB integration, you only ever have to do this ONCE. The app will auto-refresh and save the token to the database before it expires!\n'
    );
    process.exit(0);
  });

  yt.session.on('auth-error', (err) => {
    console.error('\n❌ Authorization failed:', err.message);
    process.exit(1);
  });

  await yt.session.signIn();
} catch (err) {
  console.error('\n❌ Error creating Innertube session:', err.message);
}
