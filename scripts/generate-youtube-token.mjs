import { Innertube } from 'youtubei.js';

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
    console.log('Copy the following JSON string and paste it into your Netlify environment variables as NUXT_YOUTUBE_OAUTH_TOKEN (or add it to your local .env file):\n');
    console.log('----------------------------------------------------');
    console.log(JSON.stringify(data.credentials));
    console.log('----------------------------------------------------\n');
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
