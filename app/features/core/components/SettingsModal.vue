<script setup lang="ts">
const layoutStore = useLayoutStore();
const { themeId, themes, setTheme } = useTheme();
const { locale, setLocale } = useI18n();
const playerStore = usePlayerStore();

function handleClose() {
  layoutStore.closeSettings();
}
</script>

<template>
  <AppModal
    modal-class="settings-modal-override"
    :model-value="layoutStore.isSettingsOpen"
    :title="$t('core.actions.settings')"
    @update:model-value="
      (val) => {
        if (!val) handleClose();
      }
    ">
    <div class="settings-modal__content">
      <div class="settings-modal__grid">
        <!-- Language -->
        <div class="settings-modal__section">
          <h3 class="settings-modal__section-title">{{ $t('core.nav.language') }}</h3>
          <AppSelect
            :model-value="locale as string"
            :options="[
              { label: 'English', value: 'en', icon: 'flag:gb-1x1' },
              { label: 'Magyar', value: 'hu', icon: 'flag:hu-1x1' }
            ]"
            class="settings-modal__select"
            @update:model-value="setLocale($event as any)" />
        </div>

        <!-- Theme -->
        <div class="settings-modal__section">
          <h3 class="settings-modal__section-title">{{ $t('core.nav.theme') }}</h3>
          <AppSelect
            :model-value="themeId"
            :options="themes.map((t) => ({ label: t.label, value: t.id, icon: t.icon }))"
            class="settings-modal__select"
            @update:model-value="setTheme($event as any)" />
        </div>
      </div>

      <div class="settings-modal__divider"></div>

      <!-- Crossfade Settings -->
      <div class="settings-modal__section">
        <div class="settings-modal__flex-header">
          <div>
            <h3 class="settings-modal__section-title">{{ $t('core.settings.crossfade.title') }}</h3>
            <p class="settings-modal__section-desc">
              {{ $t('core.settings.crossfade.description') }}
            </p>
          </div>
          <label class="settings-modal__toggle">
            <input
              type="checkbox"
              :checked="playerStore.crossfadeEnabled"
              @change="
                playerStore.crossfadeEnabled = ($event.target as HTMLInputElement).checked
              " />
            <span class="settings-modal__toggle-slider"></span>
          </label>
        </div>

        <div v-if="playerStore.crossfadeEnabled" class="settings-modal__range-wrap">
          <div class="settings-modal__range-header">
            <span class="settings-modal__range-label">
              {{ $t('core.settings.crossfade.duration') }}
            </span>
            <span class="settings-modal__range-val">{{ playerStore.crossfadeDuration }}s</span>
          </div>
          <input
            type="range"
            min="1"
            max="12"
            step="1"
            :value="playerStore.crossfadeDuration"
            class="settings-modal__range"
            @input="
              playerStore.crossfadeDuration = parseInt(
                ($event.target as HTMLInputElement).value,
                10
              )
            " />
        </div>
      </div>
    </div>

    <template #footer>
      <button class="settings-modal__btn settings-modal__btn--primary" @click="handleClose">
        {{ $t('core.actions.close') }}
      </button>
    </template>
  </AppModal>
</template>

<style lang="scss">
.settings-modal-override {
  overflow: visible !important;

  .modal__body {
    overflow: visible !important;
  }
}
</style>

<style scoped lang="scss">
.settings-modal {
  &__content {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-4);
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  &__section-title {
    font-size: var(--text-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
  }

  &__section-desc {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    margin: 0;
  }

  &__select {
    width: 100%;
    max-width: 240px;
  }

  &__divider {
    height: 1px;
    background: var(--color-border);
    margin: 0;
  }

  &__flex-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__toggle {
    position: relative;
    display: inline-block;
    width: 44px;
    height: 24px;

    input {
      opacity: 0;
      width: 0;
      height: 0;

      &:checked + .settings-modal__toggle-slider {
        background-color: var(--color-primary);
      }

      &:focus-visible + .settings-modal__toggle-slider {
        box-shadow: 0 0 0 2px var(--color-ring);
      }

      &:checked + .settings-modal__toggle-slider:before {
        transform: translateX(20px);
      }
    }
  }

  &__toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--color-surface-hover);
    transition: 0.2s;
    border-radius: 24px;
    border: 1px solid var(--color-border);

    &:before {
      position: absolute;
      content: '';
      height: 18px;
      width: 18px;
      left: 2px;
      bottom: 2px;
      background-color: white;
      transition: 0.2s;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
  }

  &__range-wrap {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin-top: var(--space-2);
    padding: var(--space-3);
    background: var(--color-surface-hover);
    border-radius: var(--radius-md);
  }

  &__range-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__range-label {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
  }

  &__range-val {
    font-size: var(--text-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }

  &__range {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 4px;
    background: transparent;
    outline: none;
    cursor: pointer;
    margin-top: var(--space-2);
    margin-bottom: var(--space-2);

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background-color: var(--color-primary);
      cursor: pointer;
      transition: transform var(--transition-fast);
      margin-top: -6px; /* (4 - 16) / 2 */
    }

    &:hover::-webkit-slider-thumb {
      transform: scale(1.2);
    }

    &::-webkit-slider-runnable-track {
      width: 100%;
      height: 4px;
      background: var(--color-border);
      border-radius: var(--radius-full);
    }
  }

  &__btn {
    padding: var(--space-2) var(--space-6);
    border-radius: var(--radius-full);
    font-size: var(--text-sm);
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
    border: none;
    transition: all var(--transition-fast);

    &--primary {
      background: var(--color-text-primary);
      color: var(--color-bg);

      &:hover {
        transform: scale(1.03);
        opacity: 0.9;
      }
    }
  }
}
</style>
