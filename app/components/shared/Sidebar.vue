<script setup lang="ts">
const sidebarWidth = useCookie<number>('app-sidebar-width', {
  default: () => 72
});

const isDragging = ref(false);

const MIN_WIDTH = 72; // 4.5rem
const EXPANDED_MIN_WIDTH = 240; // 15rem
const MAX_WIDTH = 600;

function startDrag() {
  isDragging.value = true;
  document.body.style.cursor = 'ew-resize';
  document.body.style.userSelect = 'none';
  window.addEventListener('mousemove', onDrag);
  window.addEventListener('mouseup', stopDrag);
}

function onDrag(e: MouseEvent) {
  if (!isDragging.value) return;

  const newWidth = e.clientX;

  if (newWidth < 120) {
    sidebarWidth.value = MIN_WIDTH;
  } else if (newWidth >= 120 && newWidth < EXPANDED_MIN_WIDTH) {
    sidebarWidth.value = EXPANDED_MIN_WIDTH;
  } else if (newWidth > MAX_WIDTH) {
    sidebarWidth.value = MAX_WIDTH;
  } else {
    sidebarWidth.value = newWidth;
  }
}

function stopDrag() {
  isDragging.value = false;
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
  window.removeEventListener('mousemove', onDrag);
  window.removeEventListener('mouseup', stopDrag);
}

const isExpanded = computed(() => sidebarWidth.value > MIN_WIDTH);
provide('sidebarExpanded', isExpanded);
</script>

<template>
  <aside
    class="app-sidebar"
    :class="{ 'app-sidebar--expanded': isExpanded, 'app-sidebar--dragging': isDragging }"
    :style="{ width: `${sidebarWidth}px`, maxWidth: `${sidebarWidth}px` }">
    <div class="app-sidebar__header">
      <div class="app-sidebar__header-top">
        <slot name="header-top" :is-expanded="isExpanded" />
      </div>
      <slot name="header-bottom" :is-expanded="isExpanded" />
    </div>

    <nav class="app-sidebar__nav">
      <slot name="default" :is-expanded="isExpanded" />
    </nav>

    <div class="app-sidebar__resizer" @mousedown.prevent="startDrag"></div>
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
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  transition:
    width 0s,
    max-width 0s;

  &--expanded {
    transition: none;
  }

  &--dragging {
    transition: none;
  }

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

  &--expanded {
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
      width: calc(100% - 1.5rem);
    }

    .app-sidebar__mode-badge {
      max-width: 8rem;

      .app-sidebar__text {
        margin-left: 4px;
      }
    }
  }

  &__resizer {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 6px;
    cursor: ew-resize;
    z-index: 10;
    background: transparent;
    transition: background-color var(--transition-fast);

    &:hover,
    &:active,
    .app-sidebar--dragging & {
      background: color-mix(in srgb, var(--color-primary) 50%, transparent);
    }
  }

  &__header {
    width: 100%;
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
    width: 100%;
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

    .app-sidebar__resizer {
      display: none;
    }
  }
}

.app-sidebar-item {
  display: flex;
  align-items: center;
  width: 3rem;
  height: 3rem;
  margin: 0 0.75rem 4px 0.75rem;
  padding: 0;
  padding-left: 0.85rem;
  border-radius: var(--radius-lg);
  color: var(--color-text-secondary);
  text-decoration: none;
  background: none;
  border: none;
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
  overflow: hidden;
  transition:
    background-color var(--transition-fast),
    color var(--transition-fast);

  &:hover {
    background-color: var(--color-surface-hover);
    color: var(--color-text-primary);
  }

  &--active {
    background-color: var(--color-primary-subtle);
    color: var(--color-text-primary);
    font-weight: var(--font-weight-bold);
  }

  &__icon {
    font-size: 1.5rem;
    flex-shrink: 0;
    margin-right: var(--space-2);
  }

  @media (max-width: 768px) {
    width: auto;
    height: auto;
    margin: 0;
    padding: var(--space-2);
    flex-direction: column;
    justify-content: center;

    .app-sidebar__text {
      display: none;
    }

    .app-sidebar-item__icon {
      font-size: 1.5rem;
    }
  }
}
</style>
