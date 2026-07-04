<script setup lang="ts">
import { usePlayerStore } from '../../../player/stores/usePlayerStore';
import { usePlayer } from '../../../player/composables/usePlayer';

const playerStore = usePlayerStore();
const player = usePlayer();
</script>

<template>
  <div class="settings-panel">
    <h2 class="settings-panel__title">{{ $t('settings.categories.player') }}</h2>

    <AppSettingsSection>
      <AppSettingsItem
        :title="$t('core.settings.audioReactiveLyrics.title')"
        :description="$t('core.settings.audioReactiveLyrics.description')">
        <AppToggle v-model="playerStore.isAudioReactiveLyrics" />
      </AppSettingsItem>

      <AppSettingsItem
        :title="$t('player.karaokeMode')"
        description="Vocal remover using phase cancellation"
        border>
        <AppToggle
          :model-value="player.isKaraoke.value"
          @update:model-value="player.toggleKaraoke()" />
      </AppSettingsItem>

      <AppSettingsItem
        :title="$t('core.settings.globalShortcuts.title')"
        :description="$t('core.settings.globalShortcuts.description')"
        border>
        <AppToggle v-model="playerStore.globalShortcutsEnabled" />
      </AppSettingsItem>

      <AppSettingsItem
        :title="$t('core.settings.crossfade.title')"
        :description="$t('core.settings.crossfade.description')"
        border>
        <AppToggle v-model="playerStore.crossfadeEnabled" />
      </AppSettingsItem>

      <AppSettingsItem
        v-if="playerStore.crossfadeEnabled"
        :title="$t('core.settings.crossfade.duration')"
        sub>
        <AppSelect
          v-model="playerStore.crossfadeDuration"
          :options="[
            { label: '3s', value: 3 },
            { label: '5s', value: 5 },
            { label: '8s', value: 8 },
            { label: '10s', value: 10 }
          ]" />
      </AppSettingsItem>

      <AppSettingsItem
        v-if="playerStore.crossfadeEnabled"
        :title="$t('core.settings.crossfade.type')"
        sub>
        <AppSelect
          v-model="playerStore.crossfadeType"
          :options="[
            { label: $t('core.settings.crossfade.types.linear'), value: 'linear' },
            { label: $t('core.settings.crossfade.types.dj'), value: 'dj' }
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
</style>
