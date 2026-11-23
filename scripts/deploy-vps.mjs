import { Client } from 'ssh2';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const content = readFileSync(filePath, 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let rawVal = trimmed.slice(eqIdx + 1).trim();
      if (
        (rawVal.startsWith('"') && rawVal.includes('"', 1)) ||
        (rawVal.startsWith("'") && rawVal.includes("'", 1))
      ) {
        const quote = rawVal[0];
        const endQuote = rawVal.indexOf(quote, 1);
        rawVal = rawVal.slice(1, endQuote);
      } else {
        const hashIdx = rawVal.indexOf('#');
        if (hashIdx !== -1) {
          rawVal = rawVal.slice(0, hashIdx).trim();
        }
      }
      env[key] = rawVal;
    }
  }
  return env;
}

function loadConfig() {
  const vpsEnv = parseEnvFile(resolve(process.cwd(), '.env.vps'));
  const baseEnv = parseEnvFile(resolve(process.cwd(), '.env'));
  const merged = { ...baseEnv, ...vpsEnv, ...process.env };

  return {
    host: merged.VPS_HOST || merged.VPS_IP || '',
    user: merged.VPS_USER || merged.VPS_USERNAME || '',
    password: merged.VPS_PASSWORD || merged.VPS_PASS || '',
    path: merged.VPS_PATH || '',
    port: parseInt(merged.VPS_PORT || '22', 10),
    branch: merged.VPS_BRANCH || 'dev',
    service: merged.VPS_SERVICE || 'ranzakord',
    keyPath: merged.VPS_KEY || merged.VPS_KEY_PATH || ''
  };
}

async function promptInput(rl, query, defaultValue = '') {
  const promptText = defaultValue ? `${query} [${defaultValue}]: ` : `${query}: `;
  const answer = await rl.question(promptText);
  return answer.trim() || defaultValue;
}

async function main() {
  const config = loadConfig();
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  try {
    if (!config.host) {
      config.host = await promptInput(rl, 'VPS Host / Tailscale IP');
    }
    if (!config.user) {
      config.user = await promptInput(rl, 'VPS SSH User', 'root');
    }
    if (!config.password && !config.keyPath) {
      config.password = await promptInput(rl, 'VPS SSH Password');
    }
    if (!config.path) {
      config.path = await promptInput(
        rl,
        'VPS Project Directory',
        `/home/${config.user}/ranzaKord`
      );
    }

    rl.close();

    if (!config.host || !config.user || !config.path) {
      console.error('Missing required VPS configuration. Please fill .env.vps or provide inputs.');
      process.exit(1);
    }

    console.log(`\nConnecting to ${config.user}@${config.host}:${config.port}...`);

    const client = new Client();

    const connectOptions = {
      host: config.host,
      port: config.port,
      username: config.user,
      readyTimeout: 20000
    };

    if (config.keyPath && existsSync(config.keyPath)) {
      connectOptions.privateKey = readFileSync(config.keyPath);
    } else if (config.password) {
      connectOptions.password = config.password;
    }

    client.on('ready', () => {
      console.log('Connected successfully via SSH.');
      console.log(`Starting deploy on branch "${config.branch}" at ${config.path}...\n`);

      const remoteCommand = [
        'set -e',
        `cd "${config.path}"`,
        'echo "==> [1/4] Pulling latest git changes..."',
        `git checkout "${config.branch}"`,
        `git pull origin "${config.branch}"`,
        'echo "==> [2/4] Installing dependencies..."',
        'pnpm install',
        'echo "==> [3/4] Building production application..."',
        'pnpm run build',
        'echo "==> [4/4] Restarting PM2 process..."',
        `(pm2 restart "${config.service}" || pm2 restart ranzakord || pm2 restart all)`,
        'echo "==> Deployment finished successfully!"'
      ].join(' && ');

      client.exec(remoteCommand, { pty: true }, (err, stream) => {
        if (err) {
          console.error('Execution error:', err);
          client.end();
          process.exit(1);
        }

        stream.on('close', (code) => {
          client.end();
          if (code === 0) {
            console.log('\nDeployment completed successfully.');
            process.exit(0);
          } else {
            console.error(`\nDeployment failed with exit code ${code}.`);
            process.exit(code ?? 1);
          }
        });

        stream.on('data', (data) => {
          process.stdout.write(data);
        });

        stream.stderr.on('data', (data) => {
          process.stderr.write(data);
        });
      });
    });

    client.on('error', (err) => {
      console.error('SSH connection error:', err.message);
      process.exit(1);
    });

    client.connect(connectOptions);
  } catch (err) {
    rl.close();
    console.error(err);
    process.exit(1);
  }
}

main();
