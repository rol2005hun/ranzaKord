<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import changelogData from '~/data/changelog.json';
import roadmapData from '~/data/roadmap.json';

const { t, locale } = useI18n();
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

      <AppSettingsSection :title="t('settings.info.changelogTitle')">
        <div class="scrollable-list">
          <div v-for="(release, i) in changelogData" :key="i" class="list-card">
            <div class="list-card__header">
              <span class="list-card__title">{{ release.version }}</span>
              <span class="list-card__date">{{ release.date }}</span>
            </div>
            <ul class="list-card__items">
              <li
                v-for="(change, j) in release.changes[locale as keyof typeof release.changes]"
                :key="j">
                {{ change }}
              </li>
            </ul>
          </div>
        </div>
      </AppSettingsSection>

      <AppSettingsSection :title="t('settings.info.roadmapTitle')">
        <div class="scrollable-list">
          <div
            v-for="(item, i) in roadmapData"
            :key="i"
            class="list-card"
            :class="'list-card--' + item.status">
            <div class="list-card__header">
              <span class="list-card__title">
                {{ item.title[locale as keyof typeof item.title] }}
              </span>
              <span class="list-card__badge" :class="`list-card__badge--${item.status}`">
                {{ item.status }}
              </span>
            </div>
            <p class="list-card__desc">
              {{ item.description[locale as keyof typeof item.description] }}
            </p>
          </div>
        </div>
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

.settings-panel__content {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.shortcuts-list {
  display: flex;
  flex-direction: column;
  padding: var(--space-2) var(--space-4);
}

.shortcut-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--color-surface-raised);

  &:last-child {
    border-bottom: none;
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
  margin-top: var(--space-2);
  margin-bottom: var(--space-2);
  padding-left: var(--space-4);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.scrollable-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  max-height: 250px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--color-surface-raised);
    border-radius: var(--radius-full);
  }
}

.list-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-surface-raised);

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__title {
    font-weight: 600;
    color: var(--color-text-primary);
    font-size: var(--text-base);
  }

  &__date {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
  }

  &--critical {
    border-color: rgba(255, 60, 60, 0.4);
    background: rgba(255, 60, 60, 0.05);

    .list-card__title {
      color: #ff4d4d;
    }
  }

  &__badge {
    font-size: var(--text-xs);
    padding: 2px 6px;
    border-radius: var(--radius-sm);
    text-transform: uppercase;
    font-weight: 700;
    letter-spacing: 0.5px;

    &--planned {
      background: color-mix(in srgb, var(--color-primary) 20%, transparent);
      color: var(--color-primary);
    }

    &--in-progress {
      background: rgba(255, 165, 0, 0.2);
      color: orange;
    }

    &--critical {
      background: rgba(255, 60, 60, 0.2);
      color: #ff4d4d;
    }
  }

  &__items {
    margin: 0;
    padding-left: var(--space-4);
    font-size: var(--text-sm);
    color: var(--color-text-secondary);

    li {
      margin-bottom: 2px;
    }
  }

  &__desc {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }
}

.about-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-4);

  &__version {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin: 0;
  }
}
</style>
