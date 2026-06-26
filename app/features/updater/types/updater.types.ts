export interface UpdateInfo {
  available: boolean;
  version: string;
  body: string;
  date?: string;
  isMandatory: boolean;
  downloading: boolean;
  progress: number;
  total: number;
  error: string | null;
  apkDownloadUrl: string | null;
}

export interface GithubReleaseAsset {
  name: string;
  browser_download_url: string;
}

export interface GithubRelease {
  tag_name: string;
  body: string;
  published_at: string;
  assets: GithubReleaseAsset[];
}
