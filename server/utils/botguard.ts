import { Innertube } from 'youtubei.js';

import { SystemConfig } from '../models/SystemConfig';

import type { WebPoMinter } from 'bgutils-js/webpo';

interface CachedMinter {
  minter: WebPoMinter;
  visitorData: string;
  createdAt: number;
}

let cachedMinter: CachedMinter | null = null;
let minterPromise: Promise<CachedMinter | null> | null = null;
const MINTER_TTL_MS = 3 * 60 * 60 * 1000;

async function initMinter(): Promise<CachedMinter | null> {
  try {
    const [{ JSDOM }, { BotGuardClient }, { WebPoMinter }] = await Promise.all([
      import('jsdom'),
      import('bgutils-js/botguard'),
      import('bgutils-js/webpo')
    ]);
    const youtube = await Innertube.create({
      enable_session_cache: false,
      retrieve_player: false,
      generate_session_locally: true
    });

    const visitorData = youtube.session.context.client.visitorData;
    if (!visitorData) {
      return null;
    }

    const challengeResponse = await youtube.getAttestationChallenge('ENGAGEMENT_TYPE_UNBOUND');
    if (!challengeResponse.bg_challenge) {
      return null;
    }

    const bgChallenge = challengeResponse.bg_challenge;
    const dom = new JSDOM('<!doctype html><html><body></body></html>', {
      url: 'https://www.youtube.com/',
      referrer: 'https://www.youtube.com/'
    });

    const originalWindow = globalThis.window;
    const originalDocument = globalThis.document;
    const originalOrigin = globalThis.origin;

    Object.assign(globalThis, {
      window: dom.window,
      document: dom.window.document,
      origin: dom.window.origin
    });

    if (!Reflect.has(globalThis, 'navigator')) {
      Object.defineProperty(globalThis, 'navigator', {
        value: dom.window.navigator,
        configurable: true
      });
    }

    const interpreterUrl =
      bgChallenge.interpreter_url.private_do_not_access_or_else_trusted_resource_url_wrapped_value;
    const scriptText = await fetch(`https:${interpreterUrl}`).then((r) => r.text());
    new Function(scriptText)();

    const botguardClient = await BotGuardClient.create({
      program: bgChallenge.program,
      globalName: bgChallenge.global_name,
      globalObject: globalThis
    });

    const webPoSignalOutput: unknown[] = [];
    const snapshotArgs = { webPoSignalOutput } as unknown as Parameters<
      typeof botguardClient.snapshot
    >[0];
    const botguardResponse = await botguardClient.snapshot(snapshotArgs);

    const waaPayload = ['requestKeyHere', botguardResponse];
    const waaRes = await fetch(
      'https://jnn-pa.googleapis.com/$rpc/google.internal.waa.v1.Waa/GenerateIT',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json+protobuf',
          'x-goog-api-key': 'AIzaSyDyT5W0Jh49F30Pqqtyfdf7pDLFKLJoAnw',
          'x-user-agent': 'grpc-web-javascript/0.1'
        },
        body: JSON.stringify(waaPayload)
      }
    );

    const waaJson = (await waaRes.json()) as [string, number, number, string];
    const [integrityToken] = waaJson;
    if (!integrityToken) {
      return null;
    }

    const minter = await WebPoMinter.create(
      { integrityToken },
      webPoSignalOutput as unknown as Parameters<typeof WebPoMinter.create>[1]
    );

    if (originalWindow) globalThis.window = originalWindow;
    if (originalDocument) globalThis.document = originalDocument;
    if (originalOrigin) globalThis.origin = originalOrigin;

    try {
      await SystemConfig.findOneAndUpdate(
        { key: 'youtube_visitor_data' },
        { value: visitorData },
        { upsert: true }
      );
    } catch {
      void 0;
    }

    return {
      minter,
      visitorData,
      createdAt: Date.now()
    };
  } catch {
    return null;
  }
}

async function getOrRefreshMinter(): Promise<CachedMinter | null> {
  if (cachedMinter && Date.now() - cachedMinter.createdAt < MINTER_TTL_MS) {
    return cachedMinter;
  }

  if (minterPromise) {
    return minterPromise;
  }

  minterPromise = initMinter()
    .then((result) => {
      if (result) {
        cachedMinter = result;
      }
      return result;
    })
    .finally(() => {
      minterPromise = null;
    });

  return minterPromise;
}

export async function mintPoTokenForVideo(
  videoId: string
): Promise<{ poToken: string; visitorData: string } | null> {
  const minterData = await getOrRefreshMinter();
  if (!minterData) {
    return null;
  }

  try {
    const poToken = await minterData.minter.mintAsWebsafeString(videoId);
    return {
      poToken,
      visitorData: minterData.visitorData
    };
  } catch {
    return null;
  }
}
