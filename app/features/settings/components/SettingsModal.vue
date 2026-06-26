<script setup lang="ts">
const layoutStore = useLayoutStore();
const activeTab = ref<'account' | 'appearance' | 'player' | 'audio'>('account');

const tabs = [
  { id: 'account', label: 'settings.categories.account', icon: 'ph:user' },
  { id: 'appearance', label: 'settings.categories.appearance', icon: 'ph:palette' },
  { id: 'player', label: 'settings.categories.player', icon: 'ph:play-circle' },
  { id: 'audio', label: 'settings.categories.audio', icon: 'ph:sliders-horizontal' }
] as const;
</script>

<template>
  <AppModal
    :model-value="layoutStore.isSettingsOpen"
    size="full"
    modal-class="settings-modal-override"
    @update:model-value="
      (val) => {
        if (!val) layoutStore.closeSettings();
      }
    ">
    <div class="settings-modal__container">
      <button
        class="settings-modal__close"
        aria-label="Close Settings"
        @click="layoutStore.closeSettings()">
        <AppIcon name="ph:x-bold" />
      </button>

      <div class="settings-modal__sidebar">
        <h2 class="settings-modal__sidebar-title">{{ $t('settings.title') }}</h2>
        <nav class="settings-modal__nav">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="settings-modal__tab"
            :class="{ 'settings-modal__tab--active': activeTab === tab.id }"
            @click="activeTab = tab.id">
            <AppIcon :name="tab.icon" />
            <span>{{ $t(tab.label) }}</span>
          </button>
        </nav>
      </div>

      <div class="settings-modal__content-wrap">
        <div class="settings-modal__content">
          <AccountSettings v-if="activeTab === 'account'" />
          <AppearanceSettings v-else-if="activeTab === 'appearance'" />
          <PlayerSettings v-else-if="activeTab === 'player'" />
          <AudioSettings v-else-if="activeTab === 'audio'" />
        </div>
      </div>
    </div>
  </AppModal>
</template>

<style lang="scss" scoped>
.settings-modal {
  &__container {
    display: flex;
    width: 100%;
    height: 100%;
    position: relative;
  }

  &__sidebar {
    width: 240px;
    background-color: var(--color-surface);
    padding: var(--space-6) var(--space-4);
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--color-border);
  }

  &__sidebar-title {
    font-size: var(--text-xs);
    font-weight: var(--font-weight-bold);
    text-transform: uppercase;
    color: var(--color-text-secondary);
    letter-spacing: 0.05em;
    margin-bottom: var(--space-4);
    padding: 0 var(--space-4);
  }

  &__nav {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  &__tab {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-md);
    color: var(--color-text-secondary);
    font-weight: var(--font-weight-medium);
    font-size: var(--text-base);
    transition: all 0.2s ease;
    border: none;
    background: transparent;
    cursor: pointer;
    text-align: left;

    &:hover {
      background-color: var(--color-surface-hover);
      color: var(--color-text-primary);
    }

    &--active {
      background-color: hsla(
        var(--color-primary-h),
        var(--color-primary-s),
        var(--color-primary-l),
        0.15
      );
      color: var(--color-primary);

      &:hover {
        background-color: hsla(
          var(--color-primary-h),
          var(--color-primary-s),
          var(--color-primary-l),
          0.2
        );
        color: var(--color-primary);
      }
    }
  }

  &__content-wrap {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-8);
    position: relative;
  }

  &__content {
    max-width: 680px;
  }

  &__close {
    position: absolute;
    top: var(--space-8);
    right: var(--space-8);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-1);
    color: var(--color-text-secondary);
    background: transparent;
    border: none;
    cursor: pointer;
    z-index: 10;
    transition: color 0.2s ease;

    .icon {
      width: 32px;
      height: 32px;
      padding: var(--space-1);
      border-radius: 50%;
      border: 2px solid transparent;
      transition: all 0.2s ease;
    }

    &:hover {
      color: var(--color-text-primary);

      .icon {
        border-color: var(--color-border);
      }
    }
  }

  &__close-text {
    font-size: 11px;
    font-weight: var(--font-weight-bold);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(1.02);
}

@media (max-width: 768px) {
  .settings-modal {
    &__container {
      flex-direction: column;
    }

    &__sidebar {
      width: 100%;
      height: auto;
      border-right: none;
      border-bottom: 1px solid var(--color-border);
      padding: var(--space-4);
      padding-right: 60px; /* Leave space for close button */
    }

    &__sidebar-title {
      margin-bottom: var(--space-2);
    }

    &__nav {
      flex-direction: row;
      overflow-x: auto;
      gap: var(--space-2);
      padding-bottom: var(--space-1);

      &::-webkit-scrollbar {
        display: none;
      }
      -ms-overflow-style: none;
      scrollbar-width: none;
    }

    &__tab {
      flex: 0 0 auto;
      padding: var(--space-2) var(--space-3);

      span {
        display: none;
      }

      &--active span {
        display: inline-block;
      }
    }

    &__content-wrap {
      padding: var(--space-4);
    }

    &__close {
      top: var(--space-3);
      right: var(--space-3);

      .icon {
        width: 28px;
        height: 28px;
      }
    }
  }
}
</style>

<style lang="scss">
.settings-modal-override {
  --modal-body-padding: 0;
  width: 80vw !important;
  height: 70vh !important;
  max-width: 1400px !important;
}

@media (max-width: 768px) {
  .modal-overlay:has(.settings-modal-override) {
    padding: 0 !important;
  }

  .settings-modal-override {
    width: 100vw !important;
    height: 100vh !important;
    max-width: 100vw !important;
    max-height: 100vh !important;
    border-radius: 0 !important;
  }
}
</style>
