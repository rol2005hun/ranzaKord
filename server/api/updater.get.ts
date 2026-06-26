interface GithubAsset {
  name: string;
  browser_download_url: string;
}

interface GithubRelease {
  assets: GithubAsset[];
}

export default defineEventHandler(async () => {
  try {
    const releases = await $fetch<GithubRelease[]>(
      'https://api.github.com/repos/rol2005hun/ranzaKord/releases'
    );
    if (!releases || !releases.length) {
      throw createError({ statusCode: 404, statusMessage: 'No releases found' });
    }

    const latestRelease = releases[0];
    if (!latestRelease) {
      throw createError({ statusCode: 404, statusMessage: 'No latest release found' });
    }

    const latestJsonAsset = latestRelease.assets.find((a: GithubAsset) => a.name === 'latest.json');
    if (!latestJsonAsset) {
      throw createError({
        statusCode: 404,
        statusMessage: 'latest.json not found in the latest release assets'
      });
    }

    const latestJson = await $fetch(latestJsonAsset.browser_download_url);
    return latestJson;
  } catch (e) {
    console.error('Updater proxy error:', e);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch latest.json from GitHub'
    });
  }
});
