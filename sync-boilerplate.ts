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

const exec = (cmd: string, ignoreError = false) => {
  try {
    return execSync(cmd, { stdio: 'pipe' }).toString().trim();
  } catch (err) {
    if (!ignoreError) {
      console.error(`Error executing: ${cmd}`);
      throw err;
    }
    return '';
  }
};

const run = () => {
  console.log('Starting synchronization using Git Merge...\n');

  const status = exec('git status --porcelain');
  if (status !== '') {
    console.error('Error: Working directory is not clean!');
    console.error('Please commit or stash all changes before synchronizing.');
    process.exit(1);
  }

  const remotes = exec('git remote');
  if (!remotes.split('\n').includes('boilerplate')) {
    console.log('Adding boilerplate remote...');
    exec('git remote add boilerplate https://github.com/rol2005hun/nuxt-boilerplate.git');
  }

  console.log('Fetching updates from boilerplate...');
  exec('git fetch boilerplate master', true);

  console.log('Merging changes...');
  try {
    execSync('git merge boilerplate/master --no-commit --no-ff --allow-unrelated-histories', {
      stdio: 'inherit'
    });
  } catch {
    console.log('\nMerge conflicts occurred (or successful merge in no-commit mode).');
  }

  console.log('Discarding changes for files not in TARGETS...');
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

  console.log('\nDone! Files have been successfully merged (Staged state).');
  console.log('Check the changes in the Source Control tab in VSCode.');
  console.log('If there are conflicts, resolve them.');
  console.log(
    'If everything looks good, commit the changes: git commit -m "chore: sync boilerplate"'
  );
};

try {
  run();
} catch (error) {
  console.error(error);
  process.exit(1);
}
