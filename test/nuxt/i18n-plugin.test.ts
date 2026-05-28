import { describe, it, expect, vi } from 'vitest';
import i18nPlugin from '@/plugins/i18n-locales';

describe('i18n-locales plugin', () => {
  it('merges locale messages correctly', () => {
    const mergeLocaleMessage = vi.fn();
    const nuxtApp = {
      $i18n: {
        mergeLocaleMessage
      }
    };

    if (typeof i18nPlugin === 'function') {
      (i18nPlugin as any)(nuxtApp as any);
    } else if (i18nPlugin && typeof i18nPlugin === 'object' && (i18nPlugin as any).setup) {
      (i18nPlugin as any).setup(nuxtApp as any);
    }

    expect(mergeLocaleMessage).toHaveBeenCalled();
    expect(mergeLocaleMessage).toHaveBeenCalledWith('en', expect.any(Object));
  });
});
