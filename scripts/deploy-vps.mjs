import { spawn } from 'node:child_process';
import { readFileSync, existsSync, appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';

function loadEnvFile() {
  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) return {};
  const content = readFileSync(envPath, 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed
        .slice(eqIdx + 1)
        .trim()
        .replace(/^["']|["']$/g, '');
      env[key] = val;
    }
  }
  return env;
}

async function promptInput(rl, query, defaultValue = '') {
  const promptText = defaultValue ? `${query} [${defaultValue}]: ` : `${query}: `;
  const answer = await rl.question(promptText);
  return answer.trim() || defaultValue;
}

async function main() {
  const fileEnv = loadEnvFile();
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  try {
    let host = process.env.VPS_HOST || fileEnv.VPS_HOST;
    let user = process.env.VPS_USER || fileEnv.VPS_USER;
    let path = process.env.VPS_PATH || fileEnv.VPS_PATH;
    const port = process.env.VPS_PORT || fileEnv.VPS_PORT || '22';
    const branch = process.env.VPS_BRANCH || fileEnv.VPS_BRANCH || 'dev';
    const service = process.env.VPS_SERVICE || fileEnv.VPS_SERVICE || 'ranzakord';

    if (!host) {
      host = await promptInput(rl, 'VPS Host / Tailscale IP');
    }
    if (!user) {
      user = await promptInput(rl, 'VPS SSH User', 'root');
    }
    if (!path) {
      path = await promptInput(rl, 'VPS Project Directory', '~/ranzaKord');
    }

    if (!host || !user || !path) {
      console.error('Missing required VPS connection details (VPS_HOST, VPS_USER, VPS_PATH).');
      process.exit(1);
    }

    if (!fileEnv.VPS_HOST && !process.env.VPS_HOST) {
      const saveChoice = await promptInput(
        rl,
        'Save these settings to .env for future deploys? (y/N)',
        'N'
      );
      if (saveChoice.toLowerCase() === 'y' || saveChoice.toLowerCase() === 'yes') {
        const envPath = resolve(process.cwd(), '.env');
        const appendData = `\nVPS_HOST=${host}\nVPS_USER=${user}\nVPS_PATH=${path}\nVPS_PORT=${port}\nVPS_BRANCH=${branch}\nVPS_SERVICE=${service}\n`;
        appendFileSync(envPath, appendData, 'utf-8');
        console.log('Saved VPS configuration to .env');
      }
    }

    rl.close();

    console.log(`\nConnecting to ${user}@${host}:${port} via SSH...`);

    const remoteCommands = [
      'set -e',
      `cd "${path}"`,
      'echo "==> [1/4] Pulling latest changes from git..."',
      `git pull origin "${branch}"`,
      'echo "==> [2/4] Installing dependencies with pnpm..."',
      'pnpm install',
      'echo "==> [3/4] Building production app..."',
      'pnpm run build',
      'echo "==> [4/4] Restarting PM2 process..."',
      `pm2 restart "${service}" || pm2 restart ranzakord || pm2 restart all`,
      'echo "==> Deployment successfully finished!"'
    ].join(' && ');

    const sshArgs = ['-t', '-p', port, `${user}@${host}`, remoteCommands];

    const child = spawn('ssh', sshArgs, { stdio: 'inherit', shell: false });

    child.on('close', (code) => {
      if (code === 0) {
        console.log('\nDeployment completed successfully.');
      } else {
        console.error(`\nDeployment exited with code ${code}.`);
        process.exit(code ?? 1);
      }
    });
  } catch (err) {
    rl.close();
    console.error(err);
    process.exit(1);
  }
}

main();
