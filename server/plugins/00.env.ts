import fs from 'node:fs';
import path from 'node:path';

export default defineNitroPlugin(() => {
  if (import.meta.prerender || process.env.VITEST || process.env.NODE_ENV === 'test') {
    return;
  }

  const envPath = path.resolve(process.cwd(), '.env');
  const envExists = fs.existsSync(envPath);
  const config = useRuntimeConfig();

  const missing: string[] = [];
  const warnings: string[] = [];

  if (!envExists) {
    missing.push('.env file is missing in the project root');
  }

  if (!config.mongodbUri || config.mongodbUri === 'your_mongo_uri') {
    missing.push('NUXT_MONGODB_URI is missing or set to placeholder "your_mongo_uri"');
  }

  const sessionSecret = (config.sessionSecret as string) || process.env.NUXT_SESSION_SECRET || '';
  if (!sessionSecret || sessionSecret.length < 32) {
    missing.push('NUXT_SESSION_SECRET is missing or shorter than 32 characters');
  }

  if (!config.ranzakonnectDomain) {
    missing.push('NUXT_RANZAKONNECT_DOMAIN is missing');
  }

  const isDev = process.env.NODE_ENV !== 'production';

  if (!config.ranzakonnectClientId) {
    missing.push('NUXT_RANZAKONNECT_CLIENT_ID is missing');
  } else if (config.ranzakonnectClientId === 'your_client_id') {
    if (isDev) {
      warnings.push('NUXT_RANZAKONNECT_CLIENT_ID is set to placeholder "your_client_id"');
    } else {
      missing.push('NUXT_RANZAKONNECT_CLIENT_ID must not be placeholder in production');
    }
  }

  if (!config.ranzakonnectClientSecret) {
    missing.push('NUXT_RANZAKONNECT_CLIENT_SECRET is missing');
  } else if (config.ranzakonnectClientSecret === 'your_client_secret') {
    if (isDev) {
      warnings.push('NUXT_RANZAKONNECT_CLIENT_SECRET is set to placeholder "your_client_secret"');
    } else {
      missing.push('NUXT_RANZAKONNECT_CLIENT_SECRET must not be placeholder in production');
    }
  }

  if (warnings.length > 0 && missing.length === 0) {
    const divider = '='.repeat(78);
    const warningMessage = [
      '',
      divider,
      ' [ranzaKord] ENVIRONMENT WARNING',
      divider,
      ...warnings.map((w) => `  ! ${w}`),
      divider,
      ''
    ].join('\n');
    console.warn(warningMessage);
  }

  if (missing.length > 0) {
    const divider = '='.repeat(78);
    const errorMessage = [
      '',
      divider,
      ' [ranzaKord] ENVIRONMENT CONFIGURATION ERROR',
      divider,
      'The application cannot start because required .env variables are missing:',
      '',
      ...missing.map((err) => `  - ${err}`),
      '',
      'Please create or update your .env file based on .env.example:',
      '  cp .env.example .env',
      divider,
      ''
    ].join('\n');

    console.error(errorMessage);
    throw new Error(
      `[ranzaKord] Missing required environment variables:\n${missing.map((item) => ` - ${item}`).join('\n')}`
    );
  }
});
