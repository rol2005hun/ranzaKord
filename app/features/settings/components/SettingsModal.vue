<script setup lang="ts">
const layoutStore = useLayoutStore();
const activeTab = ref<'account' | 'appearance' | 'player' | 'audio' | 'info'>('account');

const tabs = [
  { id: 'account', label: 'settings.categories.account', icon: 'ph:user' },
  { id: 'appearance', label: 'settings.categories.appearance', icon: 'ph:palette' },
  { id: 'player', label: 'settings.categories.player', icon: 'ph:play-circle' },
  { id: 'audio', label: 'settings.categories.audio', icon: 'ph:sliders-horizontal' },
  { id: 'info', label: 'settings.categories.info', icon: 'ph:info' }
] as const;

const navRef = ref<HTMLElement | null>(null);

let isDown = false;
let startX = 0;
let scrollLeft = 0;
let isDragging = false;

function scrollNav(amount: number) {
  if (navRef.value) {
    navRef.value.scrollBy({ left: amount, behavior: 'smooth' });
  }
}

function onMouseDown(e: MouseEvent) {
  if (!navRef.value) return;
  isDown = true;
  isDragging = false;
  startX = e.pageX - navRef.value.offsetLeft;
  scrollLeft = navRef.value.scrollLeft;
}

function onMouseLeave() {
  isDown = false;
}

function onMouseUp() {
  isDown = false;
}

function onMouseMove(e: MouseEvent) {
  if (!isDown || !navRef.value) return;
  e.preventDefault();
  const x = e.pageX - navRef.value.offsetLeft;
  const walk = (x - startX) * 1.5;
  if (Math.abs(walk) > 5) {
    isDragging = true;
  }
  navRef.value.scrollLeft = scrollLeft - walk;
}

function onNavClick(e: MouseEvent) {
  if (isDragging) {
    e.stopPropagation();
    e.preventDefault();
    isDragging = false;
  }
}
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
        <div class="settings-modal__nav-wrapper">
          <button
            class="settings-modal__scroll-btn settings-modal__scroll-btn--left"
            @click="scrollNav(-200)">
            <AppIcon name="ph:caret-left-bold" />
          </button>

          <nav
            ref="navRef"
            class="settings-modal__nav"
            @mousedown="onMouseDown"
            @mouseleave="onMouseLeave"
            @mouseup="onMouseUp"
            @mousemove="onMouseMove"
            @click.capture="onNavClick">
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

          <button
            class="settings-modal__scroll-btn settings-modal__scroll-btn--right"
            @click="scrollNav(200)">
            <AppIcon name="ph:caret-right-bold" />
          </button>
        </div>
      </div>

      <div class="settings-modal__content-wrap">
        <div class="settings-modal__content">
          <AccountSettings v-if="activeTab === 'account'" />
          <AppearanceSettings v-else-if="activeTab === 'appearance'" />
          <PlayerSettings v-else-if="activeTab === 'player'" />
          <AudioSettings v-else-if="activeTab === 'audio'" />
          <InfoSettings v-else-if="activeTab === 'info'" />
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

  &__nav-wrapper {
    display: flex;
    flex-direction: column;
    width: 100%;
    position: relative;
  }

  &__scroll-btn {
    display: none;
  }

  &__nav {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    scroll-behavior: smooth;
    user-select: none;
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
    white-space: nowrap;

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
      padding-top: max(32px, var(--safe-area-top));
    }

    &__sidebar {
      width: 100%;
      height: auto;
      border-right: none;
      border-bottom: 1px solid var(--color-border);
      padding: var(--space-4) 0;
    }

    &__sidebar-title {
      margin-top: var(--space-2);
      margin-bottom: var(--space-3);
      font-size: var(--text-sm);
      padding: 0 var(--space-4);
      padding-right: 60px; /* Leave space for close button only on the title row */
    }

    &__nav-wrapper {
      flex-direction: row;
      align-items: center;
      gap: var(--space-2);
      padding: 0 var(--space-2);
      min-width: 0;
      width: 100%;
      overflow: hidden;
    }

    &__scroll-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      color: var(--color-text-secondary);
      font-size: 20px;
      padding: var(--space-2);
      cursor: pointer;
      flex-shrink: 0;

      &:hover {
        color: var(--color-text-primary);
      }
    }

    &__nav {
      flex-direction: row;
      overflow-x: auto;
      gap: var(--space-2);
      padding-bottom: var(--space-1);
      flex: 1;
      min-width: 0;
      cursor: grab;

      &:active {
        cursor: grabbing;
      }

      &::-webkit-scrollbar {
        display: none;
      }
      -ms-overflow-style: none;
      scrollbar-width: none;
    }

    &__tab {
      flex: 0 0 auto;
      padding: var(--space-2) var(--space-3);
    }

    &__content-wrap {
      padding: var(--space-4);
    }

    &__close {
      top: max(16px, var(--safe-area-top));
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
