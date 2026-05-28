import { describe, it, expect, vi } from 'vitest';
import i18nPlugin from '@/plugins/i18n-locales';

describe('i18n-locales plugin', () => {
  it('merges locale messages correctly', () => {
    const mergeLocaleMessage = vi.fn();

    type NuxtAppWithI18n = {
      $i18n: {
        mergeLocaleMessage: (locale: string, messages: Record<string, unknown>) => void;
      };
    };

    const nuxtApp: NuxtAppWithI18n = {
      $i18n: {
        mergeLocaleMessage
      }
    };

    type PluginFn = (nuxtApp: NuxtAppWithI18n) => void;
    type PluginWithSetup = { setup: (nuxtApp: NuxtAppWithI18n) => void };

    const plugin = i18nPlugin as unknown as PluginFn | PluginWithSetup;

    if (typeof plugin === 'function') {
      plugin(nuxtApp);
    } else if (plugin && typeof plugin === 'object' && 'setup' in plugin) {
      plugin.setup(nuxtApp);
    }

    expect(mergeLocaleMessage).toHaveBeenCalled();
    expect(mergeLocaleMessage).toHaveBeenCalledWith('en', expect.any(Object));
  });
});
