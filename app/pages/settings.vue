<script setup lang="ts">
definePageMeta({
  layout: 'music'
});

useHead({ title: 'Settings' });

const playerStore = usePlayerStore();
</script>

<template>
  <div class="settings-page">
    <h1 class="settings-page__title">{{ $t('nav.settings') }}</h1>

    <div class="settings-page__section">
      <h2 class="settings-page__section-title">Player Settings</h2>

      <div class="settings-page__item">
        <div class="settings-page__item-info">
          <span class="settings-page__item-title">
            {{ $t('core.settings.audioReactiveLyrics.title') }}
          </span>
          <span class="settings-page__item-desc">
            {{ $t('core.settings.audioReactiveLyrics.description') }}
          </span>
        </div>
        <AppToggle v-model="playerStore.isAudioReactiveLyrics" />
      </div>

      <div class="settings-page__item">
        <div class="settings-page__item-info">
          <span class="settings-page__item-title">{{ $t('core.settings.crossfade.title') }}</span>
          <span class="settings-page__item-desc">
            {{ $t('core.settings.crossfade.description') }}
          </span>
        </div>
        <AppToggle v-model="playerStore.crossfadeEnabled" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.settings-page {
  padding: var(--space-8);
  max-width: 800px;
  margin: 0 auto;

  &__title {
    font-size: var(--text-3xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin-bottom: var(--space-8);
  }

  &__section {
    background: var(--color-surface-hover);
    border-radius: var(--radius-xl);
    padding: var(--space-6);
    border: 1px solid var(--color-border);
  }

  &__section-title {
    font-size: var(--text-lg);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin-bottom: var(--space-6);
    padding-bottom: var(--space-4);
    border-bottom: 1px solid var(--color-border);
  }

  &__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4) 0;

    &:not(:last-child) {
      border-bottom: 1px solid var(--color-border);
    }
  }

  &__item-info {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  &__item-title {
    font-size: var(--text-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
  }

  &__item-desc {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }
}
</style>
