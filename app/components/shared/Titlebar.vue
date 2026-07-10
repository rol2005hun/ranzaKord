<script setup lang="ts">
import { ref, onMounted } from 'vue';

const isTauriApp = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
const isMobile =
  typeof window !== 'undefined' && /android|ios|iphone|ipad/i.test(navigator.userAgent);
const isMaximized = ref(false);

onMounted(async () => {
  if (typeof window !== 'undefined') {
    // static titlebar removed
  }

  try {
    if (isTauriApp && !isMobile) {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const appWindow = getCurrentWindow();
      isMaximized.value = await appWindow.isMaximized();
      localStorage.setItem('window-maximized', String(isMaximized.value));

      appWindow.onResized(async () => {
        isMaximized.value = await appWindow.isMaximized();
        localStorage.setItem('window-maximized', String(isMaximized.value));
      });
    }
  } catch (err) {
    console.error('Failed to init titlebar:', err);
  }
});

async function minimize() {
  if (isMobile) return;
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  getCurrentWindow().minimize();
}

async function toggleMaximize() {
  if (isMobile) return;
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  getCurrentWindow().toggleMaximize();
}

async function close() {
  if (isMobile) return;
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  getCurrentWindow().close();
}
</script>

<template>
  <div v-if="isTauriApp && !isMobile" class="titlebar" role="region" aria-label="Window Titlebar">
    <div class="titlebar-left" data-tauri-drag-region @dblclick="toggleMaximize">
      <img src="/logo.webp" alt="Logo" class="titlebar-icon" />
      <span class="titlebar-title">{{ $t('core.appName') }}</span>
    </div>

    <div class="titlebar-middle" data-tauri-drag-region @dblclick="toggleMaximize"></div>

    <div class="titlebar-right">
      <div class="titlebar-button" @click="minimize">
        <AppIcon name="ph:minus" />
      </div>
      <div class="titlebar-button" @click="toggleMaximize">
        <AppIcon :name="isMaximized ? 'ph:copy' : 'ph:square'" />
      </div>
      <div class="titlebar-button titlebar-button--close" @click="close">
        <AppIcon name="ph:x" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.titlebar {
  height: var(--titlebar-height, 32px);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  user-select: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 99999;
}

.titlebar-left {
  display: flex;
  align-items: center;
  padding-left: var(--space-3);
  gap: var(--space-2);
  height: 100%;
}

.titlebar-icon {
  width: 16px;
  height: 16px;
  pointer-events: none;
}

.titlebar-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  pointer-events: none;
}

.titlebar-middle {
  flex: 1;
  height: 100%;
}

.titlebar-right {
  display: flex;
  height: 100%;
}

.titlebar-button {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 46px;
  height: 100%;
  color: var(--color-text-secondary);
  transition: background 0.1s;
  cursor: default;
  font-size: 16px;

  &:hover {
    background: var(--color-surface-hover);
    color: var(--color-text-primary);
  }

  &--close:hover {
    background: #e81123;
    color: #fff;
  }
}
</style>
