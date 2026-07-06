<script setup lang="ts">
const themeStore = useThemeStore();

defineProps<{
  collapsed?: boolean;
}>();
</script>

<template>
  <div class="app-brand" :class="{ 'app-brand--collapsed': collapsed }">
    <div
      v-if="themeStore.themeId === 'wc2026'"
      v-show="!collapsed"
      class="wc-decorations wc-decorations--left">
      <AppIcon name="ph:flag-pennant-fill" class="wc-flag" />
    </div>

    <div v-show="!collapsed" class="app-brand__logo-wrapper">
      <img src="/logo.webp" alt="ranzaKonnect" height="34" class="app-brand__logo" />
      <div v-if="themeStore.themeId === 'wc2026'" class="wc-ball-wrapper">
        <AppIcon name="ph:soccer-ball-fill" class="wc-ball" />
      </div>
    </div>

    <div v-show="collapsed" class="app-brand__logo-collapsed">
      <img src="/logo.webp" alt="ranzaKonnect" height="34" class="app-brand__logo" />
      <div
        v-if="themeStore.themeId === 'wc2026'"
        class="wc-ball-wrapper wc-ball-wrapper--collapsed">
        <AppIcon name="ph:soccer-ball-fill" class="wc-ball" />
      </div>
    </div>

    <div
      v-if="themeStore.themeId === 'wc2026'"
      v-show="!collapsed"
      class="wc-decorations wc-decorations--right">
      <AppIcon name="ph:flag-pennant-fill" class="wc-flag wc-flag--right" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.app-brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  filter: drop-shadow(0 0 6px var(--color-primary-glow));
  position: relative;

  &--collapsed {
    gap: var(--space-1);
  }

  &__logo-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  &__logo-collapsed {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
  }

  &__logo {
    flex-shrink: 0;
    height: 34px;
    width: auto;
    object-fit: contain;
    position: relative;
    z-index: 1;
  }
}

.wc-decorations {
  color: var(--color-danger);
  font-size: 1.2rem;
  display: flex;
  align-items: flex-end;
  height: 34px;

  &--left {
    margin-right: -4px;
  }
  &--right {
    margin-left: -4px;
  }
}

.wc-flag {
  transform-origin: bottom left;
  animation: wave 2s infinite ease-in-out;

  &--right {
    transform-origin: bottom right;
    transform: scaleX(-1);
    animation: wave-right 2s infinite ease-in-out;
  }
}

.wc-ball-wrapper {
  position: absolute;
  top: -12px;
  right: -8px;
  z-index: 2;
  color: var(--color-text-primary);
  font-size: 1.2rem;
  animation: bounce 1s infinite cubic-bezier(0.28, 0.84, 0.42, 1);

  &--collapsed {
    top: -6px;
    right: -4px;
    font-size: 0.9rem;
  }
}

.wc-ball {
  animation: spin 3s infinite linear;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0) scaleY(1);
  }
  50% {
    transform: translateY(-8px) scaleY(1.1);
  }
}

@keyframes wave {
  0%,
  100% {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(15deg);
  }
}

@keyframes wave-right {
  0%,
  100% {
    transform: scaleX(-1) rotate(0deg);
  }
  50% {
    transform: scaleX(-1) rotate(15deg);
  }
}
</style>

<style lang="scss">
[data-theme='light'] .app-brand__logo,
[data-theme='rose'] .app-brand__logo {
  filter: invert(1) hue-rotate(180deg);
}
[data-theme='walker'] .app-brand img {
  filter: grayscale(1) sepia(1) saturate(1200%) hue-rotate(0deg) brightness(1.8) contrast(0.7);
}
[data-theme='wc2026'] .app-brand__logo {
  filter: hue-rotate(-112deg) saturate(1.4) brightness(1.1);
}
</style>
