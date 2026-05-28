<script setup lang="ts">
const isPinned = useCookie<boolean>('app-sidebar-pinned', {
  default: () => false
});
const isHovered = ref(false);
</script>

<template>
  <aside
    class="app-sidebar"
    :class="{ 'app-sidebar--pinned': isPinned }"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false">
    <div class="app-sidebar__header">
      <div class="app-sidebar__header-top">
        <slot name="header-top" />
        <button
          class="app-sidebar__pin"
          :class="{ 'app-sidebar__pin--active': isPinned }"
          title="Pin sidebar"
          @click="isPinned = !isPinned">
          <AppIcon :name="isPinned ? 'ph:push-pin-slash' : 'ph:push-pin'" />
        </button>
      </div>
      <slot name="header-bottom" />
    </div>

    <nav class="app-sidebar__nav">
      <slot name="default" />
    </nav>
  </aside>
</template>

<style lang="scss">
.app-sidebar {
  width: 4.5rem;
  max-width: 4.5rem;
  flex-shrink: 0;
  background-color: var(--color-surface);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100dvh;
  overflow-y: auto;
  overflow-x: hidden;
  transition:
    width 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    max-width 0.35s cubic-bezier(0.4, 0, 0.2, 1);

  &__text,
  &__user-info,
  &__logout {
    opacity: 0;
    max-width: 0;
    overflow: hidden;
    white-space: nowrap;
    transition:
      opacity 0.15s linear 0.2s,
      max-width 0s 0.35s,
      margin 0s 0.35s,
      padding 0s 0.35s,
      border 0s 0.35s;
  }

  &__text {
    margin-left: 0;
  }

  &__logout {
    padding: 0;
    margin: 0;
    border: 0;
    transition:
      background-color var(--transition-fast),
      color var(--transition-fast),
      opacity 0.15s linear 0.2s,
      max-width 0s 0.35s,
      margin 0s 0.35s,
      padding 0s 0.35s,
      border 0s 0.35s;
  }

  &:hover,
  &--pinned {
    width: 15rem;
    max-width: 15rem;

    .app-sidebar__text,
    .app-sidebar__user-info {
      opacity: 1;
      max-width: 15rem;
      transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .app-sidebar__logout {
      opacity: 1;
      max-width: 15rem;
      padding: var(--space-2);
      transition:
        opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1),
        background-color var(--transition-fast),
        color var(--transition-fast);
    }

    .app-sidebar-item {
      width: 13.5rem;
    }

    .app-sidebar__mode-badge {
      max-width: 8rem;

      .app-sidebar__text {
        margin-left: 4px;
      }
    }
  }

  &__header {
    width: 15rem;
    height: 4.5rem;
    padding: 0 0 0 1.18rem;
    border-bottom: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  &__header-top {
    display: flex;
    align-items: center;
    width: 100%;
    justify-content: space-between;
    padding-right: var(--space-4);
  }

  &__pin {
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    color: var(--color-text-secondary);
    cursor: pointer;
    font-size: 1.6rem;
    padding: var(--space-1);
    transition: color 0.3s;

    &:hover {
      color: var(--color-primary);
    }

    &--active {
      color: var(--color-primary);
    }
  }

  &__brand {
    display: flex;
    align-items: center;
    text-decoration: none;
    transform-origin: left center;
    transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  }

  &__mode-badge {
    font-size: var(--text-xs);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-secondary);
    background-color: var(--color-primary-subtle);
    border: 1px solid color-mix(in srgb, var(--color-primary) 25%, transparent);
    color: var(--color-text-primary);
    padding: 6px 10px;
    border-radius: var(--radius-full);
    align-self: flex-start;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    font-size: 0.65rem;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    max-width: 2.5rem;
    overflow: hidden;
    white-space: nowrap;
    transition:
      max-width 0.35s cubic-bezier(0.4, 0, 0.2, 1),
      background-color var(--transition-fast),
      color var(--transition-fast);

    &:hover {
      background-color: var(--color-surface-hover);
      color: var(--color-text-primary);
    }
  }

  &__mode-icon {
    font-size: 1rem;
  }

  &__nav {
    width: 15rem;
    padding: var(--space-3) 0;
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  &__divider {
    height: 1px;
    background-color: var(--color-border);
    margin: var(--space-2) 0.5rem var(--space-2) 0.5rem;
    width: 14rem;
  }

  @media (max-width: 768px) {
    width: 100%;
    max-width: 100%;
    height: 60px;
    position: fixed;
    bottom: var(--player-height, 0px);
    z-index: 50;
    border-right: none;
    border-top: 1px solid var(--color-border);
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
    background-color: var(--color-surface);

    &:hover,
    &--pinned {
      width: 100%;
      max-width: 100%;
    }

    .app-sidebar__header {
      display: none;
    }

    .app-sidebar__nav {
      flex-direction: row;
      justify-content: space-around;
      width: 100%;
      padding: 0;
    }

    &__pin {
      display: none;
    }
  }
}
</style>
