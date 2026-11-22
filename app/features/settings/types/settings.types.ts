export type SettingsTabId = 'account' | 'appearance' | 'player' | 'audio' | 'info' | 'youtube';

export interface SettingsTab {
  id: SettingsTabId;
  label: string;
  icon: string;
}

export interface YouTubeDeviceAuthStatus {
  status: 'idle' | 'pending' | 'success' | 'error';
  userCode?: string;
  verificationUrl?: string;
  error?: string;
}

export interface YouTubeStatusResponse {
  hasCookies: boolean;
  hasPoToken: boolean;
  hasVisitorData: boolean;
  hasOauth: boolean;
  deviceAuth: YouTubeDeviceAuthStatus;
}

export interface YouTubeDeviceCodeResponse {
  status: string;
  userCode?: string;
  verificationUrl?: string;
  error?: string;
}
