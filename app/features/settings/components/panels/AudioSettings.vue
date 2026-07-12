<script setup lang="ts">
import { usePlayerStore } from '../../../player/stores/usePlayerStore';

const playerStore = usePlayerStore();

const presets = {
  flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  bassBoost: [6, 5, 4, 2, 0, 0, 0, 0, 0, 0],
  electronic: [5, 4, 1, 0, -2, -1, 1, 3, 4, 5],
  acoustic: [2, 2, 1, 1, 1, 0, 2, 2, 2, 1],
  pop: [-1, -1, 0, 2, 3, 3, 2, 1, 0, -1],
  rock: [4, 3, 1, -1, -2, -1, 1, 2, 3, 4]
};

const bands = [32, 64, 125, 250, 500, '1k', '2k', '4k', '8k', '16k'];

function setPreset(preset: keyof typeof presets) {
  if (presets[preset]) {
    playerStore.eqBands = [...presets[preset]];
  }
}

watch(
  () => playerStore.eqPreset,
  (newVal) => {
    if (newVal !== 'custom') {
      setPreset(newVal as keyof typeof presets);
    }
  }
);

function onSliderChange() {
  playerStore.eqPreset = 'custom';
}
</script>

<template>
  <div class="settings-panel">
    <h2 class="settings-panel__title">{{ $t('settings.categories.audio') }}</h2>

    <AppSettingsSection>
      <AppSettingsItem
        :title="$t('settings.audio.spatialAudio.title')"
        :description="$t('settings.audio.spatialAudio.description')">
        <AppToggle v-model="playerStore.isSpatialAudio" />
      </AppSettingsItem>

      <AppSettingsItem
        :title="$t('settings.audio.eq.title')"
        :description="$t('settings.audio.eq.description')">
        <AppToggle v-model="playerStore.eqEnabled" />
      </AppSettingsItem>

      <div v-if="playerStore.eqEnabled" class="eq-container">
        <div class="eq-header">
          <label class="eq-header__label">{{ $t('settings.audio.eq.preset') }}</label>
          <AppSelect
            v-model="playerStore.eqPreset"
            class="settings-select"
            :options="[
              { label: $t('settings.audio.eq.presets.flat'), value: 'flat', icon: 'ph:minus-bold' },
              {
                label: $t('settings.audio.eq.presets.bassBoost'),
                value: 'bassBoost',
                icon: 'ph:speaker-hifi-bold'
              },
              {
                label: $t('settings.audio.eq.presets.electronic'),
                value: 'electronic',
                icon: 'ph:lightning-bold'
              },
              {
                label: $t('settings.audio.eq.presets.acoustic'),
                value: 'acoustic',
                icon: 'ph:guitar-bold'
              },
              {
                label: $t('settings.audio.eq.presets.pop'),
                value: 'pop',
                icon: 'ph:microphone-stage-bold'
              },
              { label: $t('settings.audio.eq.presets.rock'), value: 'rock', icon: 'ph:fire-bold' },
              {
                label: $t('settings.audio.eq.presets.custom'),
                value: 'custom',
                icon: 'ph:sliders-horizontal-bold'
              }
            ]" />
        </div>

        <div class="eq-sliders">
          <div v-for="(val, idx) in playerStore.eqBands" :key="idx" class="eq-slider-col">
            <span class="eq-slider-val">{{ (val ?? 0) > 0 ? '+' : '' }}{{ val ?? 0 }}</span>
            <input
              v-model.number="playerStore.eqBands[idx]"
              type="range"
              min="-12"
              max="12"
              step="1"
              class="eq-slider"
              :style="{ '--val': `${(((playerStore.eqBands[idx] || 0) + 12) / 24) * 100}%` }"
              :aria-label="`EQ Band ${bands[idx]}`"
              @input="onSliderChange" />
            <span class="eq-slider-label">{{ bands[idx] }}</span>
          </div>
        </div>
      </div>
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

.eq-container {
  padding: var(--space-6);
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.eq-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  &__label {
    font-size: var(--text-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
  }
}

.eq-sliders {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 200px;
  gap: var(--space-2);
  padding-top: var(--space-4);
}

.eq-slider-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  height: 100%;
}

.eq-slider-val {
  font-size: 11px;
  color: var(--color-text-secondary);
  font-variant-numeric: tabular-nums;
}

.eq-slider-label {
  font-size: 11px;
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
}

.eq-slider {
  writing-mode: vertical-lr;
  direction: rtl;
  width: 16px;
  height: 140px;
  cursor: pointer;

  /* Vertical slider: swap the thumb offsets to center horizontally instead of vertically */
  --thumb-offset-x: -4px;
  --thumb-offset-y: 0px;

  &::-webkit-slider-runnable-track {
    box-sizing: border-box;
    background: linear-gradient(
      to top,
      var(--color-primary) var(--val, 50%),
      var(--color-surface-hover) var(--val, 50%)
    );
    border-radius: var(--radius-full);
    width: 4px; /* Thickness of the track */
    height: 100%; /* Length of the track */
    border: 1px solid var(--color-border);
  }

  &::-webkit-slider-thumb {
    box-sizing: border-box;
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #ffffff;
    border: 2px solid var(--color-primary);
    margin: 0;
    transform: translateX(
      var(--thumb-offset-x, -4px)
    ); /* Move left to center exactly on the 4px track */
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  }

  &:hover::-webkit-slider-thumb {
    transform: translateX(var(--thumb-offset-x, -4px)) scale(1.2);
  }
}

.settings-select {
  min-width: 190px;
}
</style>
