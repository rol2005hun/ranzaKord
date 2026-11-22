import type { ComputedRef } from 'vue';

export interface UserSettings {
  theme?: string;
  customColor?: string;
  customColors?: Record<string, string>;
  crossfadeEnabled?: boolean;
  crossfadeDuration?: number;
  crossfadeType?: string;
  isKaraoke?: boolean;
  isAudioReactiveLyrics?: boolean;
  isAdaptiveThemeEnabled?: boolean;
  eqEnabled?: boolean;
  eqPreset?: string;
  eqBands?: number[];
  playbackOrder?: 'sequential' | 'random' | 'reverse';
  isSlowedReverb?: boolean;
  isNightcore?: boolean;
  reverbPreset?: 'none' | 'room' | 'hall' | 'cathedral' | 'shower' | 'muffled';
  isSpatialAudio?: boolean;
  isStereoWidener?: boolean;
  bassBoostEnabled?: boolean;
  playbackSpeed?: number;
  preservesPitch?: boolean;
  sponsorBlockEnabled?: boolean;
  globalShortcutsEnabled?: boolean;
}

export interface OAuthUser {
  sub: string;
  name: string;
  email: string;
  picture?: string;
  hasAccess: boolean;
  roles?: string[];
  isDemo?: boolean;
  isPublicProfile?: boolean;
  showPlaylists?: boolean;
  settings?: UserSettings;
  lastPlayback?: {
    videoId: string;
    currentTime: number;
    title?: string;
    artist?: string;
    thumbnailUrl?: string;
    durationSeconds?: number;
    updatedAt?: string;
  };
}

export interface OAuthSession {
  accessToken: string;
  idToken: string;
  expiresAt: number;
  user: OAuthUser;
}

export interface OAuthTokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

export interface OAuthCallbackQuery {
  code: string;
  state: string;
}

export interface UseAuthReturn {
  isAuthenticated: ComputedRef<boolean>;
  currentUser: ComputedRef<OAuthUser | null>;
  isTauri: ComputedRef<boolean>;
  loginWithRanzaKonnect: (rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
}
