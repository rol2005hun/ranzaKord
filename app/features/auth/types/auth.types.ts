import type { ComputedRef } from 'vue';

export interface OAuthUser {
  sub: string;
  name: string;
  email: string;
  picture?: string;
  hasAccess: boolean;
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
  loginWithRanzaKonnect: () => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
}
