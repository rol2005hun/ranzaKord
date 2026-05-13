// Auth feature types

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthSession {
  token: string;
  expiresAt: string;
}
