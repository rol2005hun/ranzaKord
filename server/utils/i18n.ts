import type { H3Event } from 'h3';

import authEn from '../locales/auth/en.json';
import authHu from '../locales/auth/hu.json';
import coreEn from '../locales/core/en.json';
import coreHu from '../locales/core/hu.json';
import playerEn from '../locales/player/en.json';
import playerHu from '../locales/player/hu.json';
import playlistsEn from '../locales/playlists/en.json';
import playlistsHu from '../locales/playlists/hu.json';
import searchEn from '../locales/search/en.json';
import searchHu from '../locales/search/hu.json';
import uploadEn from '../locales/upload/en.json';
import uploadHu from '../locales/upload/hu.json';

const translations: Record<string, Record<string, unknown>> = {
  en: {
    auth: authEn,
    core: coreEn,
    player: playerEn,
    playlists: playlistsEn,
    search: searchEn,
    upload: uploadEn
  },
  hu: {
    auth: authHu,
    core: coreHu,
    player: playerHu,
    playlists: playlistsHu,
    search: searchHu,
    upload: uploadHu
  }
};

export function useServerTranslation(event: H3Event) {
  let locale = getCookie(event, 'i18n_locale') || 'en';

  if (!translations[locale]) {
    locale = 'en';
  }

  return {
    t: (key: string, variables?: Record<string, string | number>) => {
      const keys = key.split('.');
      let val: unknown = translations[locale];

      for (const k of keys) {
        if (!val || typeof val !== 'object' || val === null) {
          return key;
        }
        val = (val as Record<string, unknown>)[k];
      }

      if (typeof val === 'string') {
        if (!variables) return val;

        return val.replace(/\{([^}]+)\}/g, (_: string, varName: string) => {
          return variables[varName] !== undefined ? String(variables[varName]) : `{${varName}}`;
        });
      }

      return key;
    }
  };
}
