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
