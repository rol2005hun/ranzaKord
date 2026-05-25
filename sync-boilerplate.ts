import { execSync } from 'node:child_process';

const PRESERVE_PATHS = [
  'README.md',
  'app/app.vue',
  'app/pages',
  'app/layouts',
  'public',
  'server',
  'nuxt.config.ts',
  'pnpm-workspace.yaml',
  'sync-boilerplate.ts'
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

  console.log('Restoring preserved paths (PRESERVE_PATHS)...');
  for (const path of PRESERVE_PATHS) {
    try {
      exec(`git reset HEAD "${path}"`, true);
      exec(`git checkout HEAD -- "${path}"`, true);
      exec(`git clean -fd "${path}"`, true);
    } catch {
      // ignore
    }
  }

  console.log('\nDone! Files have been successfully merged (Staged state).');
  console.log('Check the changes in the Source Control tab in VSCode.');
  console.log('If there are conflicts, resolve them.');
  console.log('If everything looks good, commit the changes: git commit -m "chore: sync boilerplate"');
};

try {
  run();
} catch (error) {
  console.error(error);
  process.exit(1);
}
