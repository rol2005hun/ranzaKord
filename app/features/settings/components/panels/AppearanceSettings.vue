<script setup lang="ts">
import { useThemeStore } from '../../../theme/stores/useThemeStore';
import type { ThemeId } from '../../../theme/types/theme.types';

const themeStore = useThemeStore();
const { locale } = useI18n({ useScope: 'global' });

const THEME_OPTIONS: ThemeId[] = ['dark', 'light', 'ocean', 'rose', 'walker', 'wc2026'];

const getThemeIcon = (theme: ThemeId) => {
  switch (theme) {
    case 'dark':
      return 'ph:moon-fill';
    case 'light':
      return 'ph:sun-fill';
    case 'ocean':
      return 'ph:waves-bold';
    case 'rose':
      return 'ph:flower-lotus-bold';
    case 'walker':
      return 'ph:headphones-bold';
    case 'wc2026':
      return 'ph:soccer-ball-fill';
    default:
      return 'ph:palette-fill';
  }
};

const themes = THEME_OPTIONS.map((theme: ThemeId) => ({
  label: `theme.${theme}`,
  value: theme,
  icon: getThemeIcon(theme)
}));

const customColorValue = computed({
  get: () =>
    themeStore.currentCustomColor?.hex || themeStore.DEFAULT_THEME_COLORS[themeStore.themeId],
  set: (val: string) => themeStore.setCustomColor(val)
});
</script>

<template>
  <div class="settings-panel">
    <h2 class="settings-panel__title">{{ $t('settings.categories.appearance') }}</h2>

    <AppSettingsSection>
      <AppSettingsItem
        :title="$t('settings.appearance.theme.title')"
        :description="$t('settings.appearance.theme.description')">
        <div class="theme-options">
          <button
            v-for="theme in themes"
            :key="theme.value"
            class="theme-btn"
            :class="{ 'theme-btn--active': themeStore.themeId === theme.value }"
            @click="themeStore.setTheme(theme.value)">
            <AppIcon :name="theme.icon" />
            <span>{{ $t(theme.label) }}</span>
          </button>
        </div>
      </AppSettingsItem>

      <AppSettingsItem
        v-if="themeStore.themeId === 'dark' || themeStore.themeId === 'light'"
        :title="$t('settings.appearance.customColor.title')"
        :description="$t('settings.appearance.customColor.description')"
        border>
        <template #info>
          <div class="color-picker-wrap">
            <input
              v-model="customColorValue"
              type="color"
              class="color-picker"
              :class="{
                'color-picker--unselected': !themeStore.customColors[themeStore.themeId]
              }" />
            <button
              v-if="themeStore.customColors[themeStore.themeId]"
              class="reset-color-btn"
              @click="themeStore.resetCustomColor()">
              <AppIcon name="ph:arrow-counter-clockwise" />
              {{ $t('settings.appearance.customColor.reset') }}
            </button>
            <span v-else class="color-picker-hint">
              {{ $t('settings.appearance.customColor.hint') }}
            </span>
          </div>
        </template>
      </AppSettingsItem>

      <AppSettingsItem
        :title="$t('settings.appearance.language.title')"
        :description="$t('settings.appearance.language.description')"
        border>
        <AppSelect
          v-model="locale"
          class="settings-select"
          :options="[
            { label: 'English', value: 'en', icon: 'twemoji:flag-united-states' },
            { label: 'Magyar', value: 'hu', icon: 'twemoji:flag-hungary' }
          ]" />
      </AppSettingsItem>
    </AppSettingsSection>
  </div>
</template>

<style lang="scss" scoped>
.settings-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);

  &__title {
    font-size: var(--text-2xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin-bottom: var(--space-4);
  }
}

.theme-options {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.theme-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  cursor: pointer;

  &--active {
    border-color: var(--color-primary);
    background: var(--color-primary-light);
  }
}

.color-picker-wrap {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.color-picker {
  width: 40px;
  height: 40px;
  padding: 0;
  border: none;
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;
  background: transparent;

  &::-webkit-color-swatch-wrapper {
    padding: 0;
  }
  &::-webkit-color-swatch {
    border: none;
    border-radius: var(--radius-md);
  }
}

.color-reset-btn {
  color: var(--color-text-secondary);

  &:hover {
    color: var(--color-text-primary);
  }
}
</style>
