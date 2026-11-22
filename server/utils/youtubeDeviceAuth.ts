import { Innertube, UniversalCache } from 'youtubei.js';

import { SystemConfig } from '../models/SystemConfig';

export interface DeviceAuthStatus {
  status: 'idle' | 'pending' | 'success' | 'error';
  userCode?: string;
  verificationUrl?: string;
  error?: string;
  updatedAt?: number;
}

let activeSession: DeviceAuthStatus = { status: 'idle' };
let activeYt: Innertube | null = null;

export function getDeviceAuthStatus(): DeviceAuthStatus {
  return activeSession;
}

export function resetDeviceAuth(): void {
  activeSession = { status: 'idle' };
  activeYt = null;
}

export async function startDeviceAuth(): Promise<DeviceAuthStatus> {
  resetDeviceAuth();
  activeSession = { status: 'pending', updatedAt: Date.now() };

  try {
    activeYt = await Innertube.create({
      cache: new UniversalCache(false)
    });

    activeYt.session.on('auth-pending', (data) => {
      activeSession = {
        status: 'pending',
        userCode: data.user_code,
        verificationUrl: data.verification_url,
        updatedAt: Date.now()
      };
    });

    activeYt.session.on('auth', async ({ credentials }) => {
      await SystemConfig.findOneAndUpdate(
        { key: 'youtube_oauth' },
        { value: credentials },
        { upsert: true, returnDocument: 'after' }
      );
      activeSession = {
        status: 'success',
        updatedAt: Date.now()
      };
      activeYt = null;
    });

    activeYt.session.on('auth-error', (err) => {
      activeSession = {
        status: 'error',
        error: String(err),
        updatedAt: Date.now()
      };
      activeYt = null;
    });

    activeYt.session.signIn().catch((err) => {
      activeSession = {
        status: 'error',
        error: String(err),
        updatedAt: Date.now()
      };
      activeYt = null;
    });

    const start = Date.now();
    while (Date.now() - start < 4000) {
      if (activeSession.userCode) {
        return activeSession;
      }
      await new Promise((r) => setTimeout(r, 100));
    }

    return activeSession;
  } catch (err) {
    activeSession = {
      status: 'error',
      error: String(err),
      updatedAt: Date.now()
    };
    return activeSession;
  }
}
