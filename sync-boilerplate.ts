import { execSync } from 'node:child_process';

const TARGETS = [
  '.agent',
  '.cursor',
  '.github',
  '.husky',
  '.vscode',
  '.cursorrules',
  '.editorconfig',
  '.gitattributes',
  '.gitignore',
  '.nuxtrc',
  '.prettierrc',
  '.windsurfrules',
  'CLAUDE.md',
  'commitlint.config.ts',
  'eslint.config.mjs',
  'nuxt.config.ts',
  'package.json',
  'playwright.config.ts',
  'pnpm-workspace.yaml',
  'stylelint.config.mjs',
  'sync-boilerplate.ts',
  'tsconfig.json',
  'vitest.config.ts'
];

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

const log = {
  header: (msg: string) => console.log(`\n${c.bold}${c.cyan}=== ${msg} ===${c.reset}\n`),
  step: (msg: string) => console.log(`${c.blue}▶${c.reset} ${msg}`),
  success: (msg: string) => console.log(`\n${c.green}✔ ${msg}${c.reset}`),
  warn: (msg: string) => console.log(`\n${c.yellow}⚠️ ${msg}${c.reset}`),
  error: (msg: string) => console.error(`\n${c.red}✖ ${msg}${c.reset}`),
  info: (msg: string) => console.log(`${c.dim}${msg}${c.reset}`)
};

const exec = (cmd: string, ignoreError = false) => {
  try {
    return execSync(cmd, { stdio: 'pipe' }).toString().trim();
  } catch (err) {
    if (!ignoreError) {
      log.error(`Error executing: ${cmd}`);
      throw err;
    }
    return '';
  }
};

const run = () => {
  log.header('Sync Boilerplate (Git Merge)');

  log.step('Checking working directory status...');
  const status = exec('git status --porcelain');
  if (status !== '') {
    log.error('Working directory is not clean!');
    log.info('Please commit or stash all changes before synchronizing.');
    process.exit(1);
  }

  const remotes = exec('git remote');
  if (!remotes.split('\n').includes('boilerplate')) {
    log.step('Adding boilerplate remote...');
    exec('git remote add boilerplate https://github.com/rol2005hun/nuxt-boilerplate.git');
  }

  log.step('Fetching updates from boilerplate...');
  exec('git fetch boilerplate master', true);

  log.step('Merging changes...');
  console.log(''); // Empty line before Git output
  try {
    execSync('git merge boilerplate/master --no-commit --no-ff --allow-unrelated-histories', {
      stdio: 'inherit'
    });
  } catch {
    log.warn('Merge conflicts occurred (or successful merge in no-commit mode).');
  }
  console.log(''); // Empty line after Git output

  log.step('Discarding changes for files not in TARGETS...');
  const changedFiles = exec('git diff --name-only HEAD').split('\n').filter(Boolean);

  for (const file of changedFiles) {
    const isTarget = TARGETS.some((t) => file === t || file.startsWith(`${t}/`));
    if (!isTarget) {
      try {
        exec(`git reset HEAD "${file}"`, true);
        exec(`git checkout HEAD -- "${file}"`, true);
        exec(`git clean -fd "${file}"`, true);
      } catch {
        // ignore
      }
    }
  }

  log.success('Files have been successfully merged (Staged state).');
  console.log(`  ${c.cyan}1.${c.reset} Check the changes in the Source Control tab in VSCode.`);
  console.log(`  ${c.cyan}2.${c.reset} If there are conflicts, resolve them.`);
  console.log(`  ${c.cyan}3.${c.reset} If everything looks good, commit the changes:`);
  console.log(`\n     ${c.bold}git commit -m "chore: sync boilerplate"${c.reset}\n`);
};

try {
  run();
} catch (error) {
  console.error(error);
  process.exit(1);
}
