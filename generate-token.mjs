import { Innertube, UniversalCache } from 'youtubei.js';

console.log('Starting YouTube OAuth flow...');

const yt = await Innertube.create({ 
  cache: new UniversalCache(false), 
  generate_session_locally: true 
});

yt.session.on('auth-pending', (data) => {
  console.log('\n=============================================');
  console.log(`1. Menj el erre a weboldalra: ${data.verification_url}`);
  console.log(`2. Írd be ezt a kódot: ${data.user_code}`);
  console.log('=============================================\n');
  console.log('Várakozás a bejelentkezésre...');
});

yt.session.on('auth', ({ credentials }) => {
  console.log('\n✅ SIKERES BEJELENTKEZÉS!\n');
  console.log('Másold ki az alábbi TELJES JSON szöveget (a { és } zárójelekkel együtt), és ezt illeszd be a Netlify-on a NUXT_YOUTUBE_OAUTH_TOKEN értékéhez:\n');
  console.log(JSON.stringify(credentials));
  console.log('\n');
  process.exit(0);
});

yt.session.on('update-credentials', ({ credentials }) => {
  console.log('\nCredentials updated:\n', JSON.stringify(credentials));
});

try {
  await yt.session.signIn();
} catch (err) {
  console.error('Hiba történt:', err);
}
