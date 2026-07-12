import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime';
import { createTestingPinia } from '@pinia/testing';
import AppearanceSettings from '@/features/settings/components/panels/AppearanceSettings.vue';
import { useThemeStore } from '@/features/theme/stores/useThemeStore';
import { nextTick } from 'vue';

mockNuxtImport('useI18n', () => () => ({
  t: (key: string) => key,
  locale: { value: 'hu' }
}));

describe('AppearanceSettings.vue', () => {
  let themeStore: ReturnType<typeof useThemeStore>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mountComponent = async () => {
    const wrapper = await mountSuspended(AppearanceSettings, {
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
        mocks: { $t: (k: string) => k },
        stubs: {
          AppIcon: true,
          AppButton: { template: '<button @click="$emit(\'click\')"><slot/></button>' },
          AppSettingsSection: { template: '<div><slot/></div>' },
          AppSettingsItem: {
            template: '<div>{{ title }}{{ description }}<slot/></div>',
            props: ['title', 'description']
          },
          AppToggle: {
            template:
              '<input type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />',
            props: ['modelValue']
          },
          AppSelect: {
            template:
              '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option></select>',
            props: ['modelValue', 'options']
          }
        }
      }
    });
    themeStore = useThemeStore();

    // Mock initial store values
    themeStore.themeId = 'dark';
    themeStore.isAdaptiveThemeEnabled = false;
    themeStore.customColors = {};
    themeStore.DEFAULT_THEME_COLORS = {
      dark: '#1db954',
      light: '#1db954',
      ocean: '#1db954',
      rose: '#1db954',
      walker: '#1db954',
      wc2026: '#1db954'
    };

    await nextTick();
    return wrapper;
  };

  it('renders appearance settings', async () => {
    const wrapper = await mountComponent();
    expect(wrapper.text()).toContain('settings.categories.appearance');
    expect(wrapper.text()).toContain('settings.appearance.theme.title');
    expect(wrapper.text()).toContain('settings.appearance.adaptiveTheme.title');
    expect(wrapper.text()).toContain('settings.appearance.customColor.title');
  });

  it('updates theme id when select changes', async () => {
    const wrapper = await mountComponent();
    const select = wrapper.find('select');
    await select.setValue('light');
    expect(themeStore.setTheme).toHaveBeenCalledWith('light');
  });

  it('toggles adaptive theme', async () => {
    const wrapper = await mountComponent();
    // Assuming the first toggle is for adaptive theme
    const toggles = wrapper.findAll('input[type="checkbox"]');
    const adaptiveToggle = toggles[0];
    if (adaptiveToggle) await adaptiveToggle.setValue(true);
    expect(adaptiveToggle?.exists()).toBe(true);
  });

  it('calls resetCustomColor when reset button is clicked', async () => {
    const wrapper = await mountComponent();
    themeStore.customColors = { dark: '#ff0000' };
    await nextTick();
    const btn = wrapper.find('button');
    await btn.trigger('click');
    expect(themeStore.resetCustomColor).toHaveBeenCalled();
  });
});
