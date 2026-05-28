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
}

export interface ServerSession {
  oauthState: string | null;
  accessToken: string;
  expiresAt: number;
  user: OAuthUser;
}
