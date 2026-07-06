<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const config = useRuntimeConfig();
const version = config.public.appVersion;

const shortcuts = [
  { action: t('settings.info.shortcuts.playPause'), key: 'Ctrl + Alt + Space' },
  { action: t('settings.info.shortcuts.next'), key: 'Ctrl + Alt + Right Arrow' },
  { action: t('settings.info.shortcuts.prev'), key: 'Ctrl + Alt + Left Arrow' }
];
</script>

<template>
  <div class="info-settings">
    <div class="settings-panel__header">
      <h2 class="settings-panel__title">
        <AppIcon name="ph:info-duotone" />
        {{ t('settings.categories.info') }}
      </h2>
      <p class="settings-panel__description">{{ t('settings.info.description') }}</p>
    </div>

    <div class="settings-panel__content">
      <AppSettingsSection :title="t('settings.info.shortcutsTitle')">
        <div class="shortcuts-list">
          <div v-for="shortcut in shortcuts" :key="shortcut.action" class="shortcut-item">
            <span class="shortcut-item__action">{{ shortcut.action }}</span>
            <kbd class="shortcut-item__key">{{ shortcut.key }}</kbd>
          </div>
        </div>
        <p class="shortcuts-note">{{ t('settings.info.shortcutsNote') }}</p>
      </AppSettingsSection>

      <AppSettingsSection :title="t('settings.info.aboutTitle')">
        <div class="about-info">
          <AppBrand />
          <p class="about-info__version">v{{ version }}</p>
        </div>
      </AppSettingsSection>
    </div>
  </div>
</template>

<style scoped lang="scss">
.info-settings {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  height: 100%;
}

.shortcuts-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  background: var(--color-bg);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  border: 1px solid var(--color-surface-raised);
}

.shortcut-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--color-surface-raised);

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  &__action {
    font-size: var(--text-base);
    color: var(--color-text-primary);
  }

  &__key {
    background: var(--color-surface-hover);
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-family: monospace;
    font-weight: 600;
    color: var(--color-primary);
    border: 1px solid var(--color-border);
  }
}

.shortcuts-note {
  margin-top: var(--space-3);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.about-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-4);
  background: var(--color-bg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-surface-raised);

  &__version {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin: 0;
  }
}
</style>
