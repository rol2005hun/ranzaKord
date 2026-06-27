export interface UpdateInfo {
  available: boolean;
  version: string;
  name: string;
  body: string;
  date?: string;
  isMandatory: boolean;
  downloading: boolean;
  readyToInstall: boolean;
  progress: number;
  total: number;
  error: string | null;
  externalDownloadUrl: string | null;
  downloadSize: number | null;
  assetCount: number | null;
}

export interface GithubReleaseAsset {
  name: string;
  browser_download_url: string;
  size: number;
}

export interface GithubRelease {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  html_url: string;
  assets: GithubReleaseAsset[];
}
