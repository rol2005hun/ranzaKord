// working :D
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';

interface GithubContent {
  name: string;
  path: string;
  type: 'file' | 'dir';
  download_url: string | null;
}

interface PackageJson {
  name?: string;
  version?: string;
  private?: boolean;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
}

const OWNER = process.env.BOILERPLATE_OWNER ?? 'rol2005hun';
const REPO = process.env.BOILERPLATE_REPO ?? 'nuxt-boilerplate';
const REF = process.env.BOILERPLATE_REF ?? 'master';
const SELF_PATH = 'sync-boilerplate.ts';
const TARGETS = [
  '.cursor',
  '.cursorrules',
  '.editorconfig',
  '.gitattributes',
  '.github',
  '.gitignore',
  '.husky',
  '.nuxtrc',
  '.prettierrc',
  '.vscode',
  '.windsurfrules',
  'CLAUDE.md',
  'README.md',
  'app',
  'commitlint.config.ts',
  'eslint.config.mjs',
  'nuxt.config.ts',
  'playwright.config.ts',
  'pnpm-workspace.yaml',
  'public',
  'server',
  'stylelint.config.mjs',
  'test',
  'tests',
  'tsconfig.json',
  'vitest.config.ts'
];

const skipSelfUpdate = process.argv.includes('--skip-self-update');
const token = process.env.GITHUB_TOKEN;
const apiHeaders: Record<string, string> = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'nuxt-boilerplate-sync'
};

if (token) {
  apiHeaders.Authorization = 'Bearer ' + token;
}

const buildContentsUrl = (path: string) => {
  const encodedPath = path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return `https://api.github.com/repos/${OWNER}/${REPO}/contents/${encodedPath}?ref=${REF}`;
};

const resolveSafePath = (relativePath: string) => {
  const cwd = process.cwd();
  const resolvedPath = resolve(cwd, relativePath);
  const prefix = cwd.endsWith(sep) ? cwd : `${cwd}${sep}`;
  if (!resolvedPath.startsWith(prefix)) {
    throw new Error(`Unsafe path: ${relativePath}`);
  }
  return resolvedPath;
};

const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url, { headers: apiHeaders });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API request failed (${response.status}): ${body}`);
  }
  return response.json() as Promise<T>;
};

const fetchBuffer = async (url: string): Promise<Buffer> => {
  const response = await fetch(url, { headers: apiHeaders });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Download failed (${response.status}): ${body}`);
  }
  const data = await response.arrayBuffer();
  return Buffer.from(data);
};

const getRemoteFileBuffer = async (path: string) => {
  const content = await fetchJson<GithubContent>(buildContentsUrl(path));
  if (Array.isArray(content) || content.type !== 'file') {
    throw new Error(`Expected file at ${path}`);
  }
  if (!content.download_url) {
    throw new Error(`Missing download URL for ${path}`);
  }
  return fetchBuffer(content.download_url);
};

const writeRemoteFile = async (content: GithubContent) => {
  if (!content.download_url) {
    throw new Error(`Missing download URL for ${content.path}`);
  }
  const localPath = resolveSafePath(content.path);
  mkdirSync(dirname(localPath), { recursive: true });
  const data = await fetchBuffer(content.download_url);
  writeFileSync(localPath, data);
};

const syncPath = async (path: string): Promise<void> => {
  const content = await fetchJson<GithubContent | GithubContent[]>(buildContentsUrl(path));
  if (Array.isArray(content)) {
    const localDir = resolveSafePath(path);
    if (existsSync(localDir)) {
      rmSync(localDir, { recursive: true, force: true });
    }
    mkdirSync(localDir, { recursive: true });
    for (const item of content) {
      await syncPath(item.path);
    }
    return;
  }
  if (content.type !== 'file') {
    throw new Error(`Unsupported content type for ${content.path}: ${content.type}`);
  }
  await writeRemoteFile(content);
};

const syncPackageJson = async () => {
  const localPath = resolveSafePath('package.json');
  const localData = readFileSync(localPath, 'utf8');
  const localJson = JSON.parse(localData) as PackageJson;
  const remoteData = await getRemoteFileBuffer('package.json');
  const remoteJson = JSON.parse(remoteData.toString('utf8')) as PackageJson;
  const mergedScripts = {
    ...(localJson.scripts ?? {}),
    ...(remoteJson.scripts ?? {})
  };
  const mergedDependencies = {
    ...(localJson.dependencies ?? {}),
    ...(remoteJson.dependencies ?? {})
  };
  const mergedDevDependencies = {
    ...(localJson.devDependencies ?? {}),
    ...(remoteJson.devDependencies ?? {})
  };
  const mergedPackage: PackageJson = {
    ...localJson,
    scripts: mergedScripts,
    dependencies: mergedDependencies,
    devDependencies: mergedDevDependencies
  };
  writeFileSync(localPath, `${JSON.stringify(mergedPackage, null, 2)}\n`);
};

const selfUpdate = async () => {
  if (skipSelfUpdate) {
    return false;
  }
  const remoteData = await getRemoteFileBuffer(SELF_PATH);
  const localPath = resolveSafePath(SELF_PATH);
  const localData = existsSync(localPath) ? readFileSync(localPath) : Buffer.from('');
  if (localData.equals(remoteData)) {
    return false;
  }
  writeFileSync(localPath, remoteData);
  const child = spawn(
    process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
    ['exec', 'tsx', SELF_PATH, '--skip-self-update'],
    {
      stdio: 'inherit',
      detached: true,
      env: process.env
    }
  );
  child.unref();
  return true;
};

const run = async () => {
  const updated = await selfUpdate();
  if (updated) {
    process.exit(0);
  }
  await syncPackageJson();
  for (const target of TARGETS) {
    await syncPath(target);
  }
};

void run().catch((error) => {
  console.error(error);
  process.exit(1);
});
