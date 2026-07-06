export interface OAuthTokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

export interface OAuthUser {
  sub: string;
  name: string;
  email: string;
  picture?: string;
  roles?: string | string[];
}

export interface ServerSession {
  oauthState: string | null;
  authSource: string | null;
  desktopAuth: boolean;
  accessToken: string;
  expiresAt: number;
  user: OAuthUser;
}
