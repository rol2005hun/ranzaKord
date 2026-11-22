import { describe, it, expect, vi } from 'vitest';
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime';
import { createTestingPinia } from '@pinia/testing';

import HomeMixCard from '@/features/home/components/HomeMixCard.vue';
import HomeRadioCard from '@/features/home/components/HomeRadioCard.vue';
import HomeSectionSlider from '@/features/home/components/HomeSectionSlider.vue';
import type { DailyMix, RecommendedRadio } from '@/features/home/types/home.types';

mockNuxtImport('useI18n', () => () => ({
  t: (key: string) => key
}));

mockNuxtImport('usePlayer', () => () => ({
  currentTrack: { value: null },
  isPlaying: { value: false },
  isLoading: { value: false }
}));

describe('HomeMixCard.vue', () => {
  const sampleMix: DailyMix = {
    id: 'mix-1',
    title: 'Napi mix 1',
    artistsSummary: 'Dzsúdló, DESH, Manuel',
    thumbnailUrl: 'https://test.com/mix.jpg',
    color: '#10b981',
    tracks: [
      {
        id: 'track-1',
        type: 'song',
        title: 'Song 1',
        artist: 'Dzsúdló',
        thumbnailUrl: 'https://test.com/s1.jpg',
        durationSeconds: 180
      }
    ]
  };

  it('renders mix title and artist summary properly', async () => {
    const wrapper = await mountSuspended(HomeMixCard, {
      props: { mix: sampleMix },
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
        stubs: {
          AppIcon: true,
          AppSpinner: true
        }
      }
    });

    expect(wrapper.text()).toContain('Napi mix 1');
    expect(wrapper.text()).toContain('Dzsúdló, DESH, Manuel');
  });

  it('emits play event when clicked', async () => {
    const wrapper = await mountSuspended(HomeMixCard, {
      props: { mix: sampleMix },
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
        stubs: {
          AppIcon: true,
          AppSpinner: true
        }
      }
    });

    await wrapper.trigger('click');
    expect(wrapper.emitted('play')).toBeTruthy();
    expect(wrapper.emitted('play')?.[0]?.[0]).toEqual(sampleMix);
  });
});

describe('HomeRadioCard.vue', () => {
  const sampleRadio: RecommendedRadio = {
    id: 'radio-dzsudlo',
    title: 'Dzsúdló rádió',
    artist: 'Dzsúdló',
    subtitle: 'DESH, Azahriah és továbbiak...',
    thumbnailUrl: 'https://test.com/dzsudlo.jpg',
    color: '#ef4444',
    seedVideoId: 'track-1',
    tracks: [
      {
        id: 'track-1',
        type: 'song',
        title: 'Song 1',
        artist: 'Dzsúdló',
        thumbnailUrl: 'https://test.com/s1.jpg',
        durationSeconds: 180
      }
    ]
  };

  it('renders radio title and subtitle properly', async () => {
    const wrapper = await mountSuspended(HomeRadioCard, {
      props: { radio: sampleRadio },
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
        stubs: {
          AppIcon: true,
          AppSpinner: true
        }
      }
    });

    expect(wrapper.text()).toContain('Dzsúdló rádió');
    expect(wrapper.text()).toContain('DESH, Azahriah és továbbiak...');
  });

  it('emits play event when clicked', async () => {
    const wrapper = await mountSuspended(HomeRadioCard, {
      props: { radio: sampleRadio },
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
        stubs: {
          AppIcon: true,
          AppSpinner: true
        }
      }
    });

    await wrapper.trigger('click');
    expect(wrapper.emitted('play')).toBeTruthy();
    expect(wrapper.emitted('play')?.[0]?.[0]).toEqual(sampleRadio);
  });
});

describe('HomeSectionSlider.vue', () => {
  it('renders slot content correctly', async () => {
    const wrapper = await mountSuspended(HomeSectionSlider, {
      props: { variant: 'tracks' },
      slots: {
        default: () => '<div class="test-item">Test Track Item</div>'
      },
      global: {
        stubs: {
          AppIcon: true
        }
      }
    });

    expect(wrapper.find('.home-slider--tracks').exists()).toBe(true);
    expect(wrapper.text()).toContain('Test Track Item');
  });
});
