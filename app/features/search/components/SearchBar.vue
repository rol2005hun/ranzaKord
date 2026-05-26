<script setup lang="ts">
const { search, query, clear } = useSearch();
const inputRef = ref<HTMLInputElement | null>(null);

function onInput(event: Event) {
  const el = event.target as HTMLInputElement;
  search(el.value);
}

function onClear() {
  clear();
  inputRef.value?.focus();
}
</script>

<template>
  <div class="search-bar">
    <AppIcon name="ph:magnifying-glass" class="search-bar__icon" />
    <input
      id="search-input"
      ref="inputRef"
      class="search-bar__input"
      type="search"
      :value="query"
      :placeholder="$t('search.placeholder')"
      autocomplete="off"
      @input="onInput" />
    <button
      v-if="query"
      class="search-bar__clear"
      :aria-label="$t('search.clear')"
      @click="onClear">
      <AppIcon name="ph:x" />
    </button>
  </div>
</template>

<style lang="scss" scoped>
.search-bar {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 600px;

  &__icon {
    position: absolute;
    left: var(--space-4);
    color: var(--color-text-secondary);
    font-size: var(--text-lg);
    pointer-events: none;
  }

  &__input {
    width: 100%;
    padding: var(--space-3) var(--space-4) var(--space-3)
      calc(var(--space-4) + 1.5rem + var(--space-2));
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    color: var(--color-text-primary);
    font-size: var(--text-base);
    font-family: var(--font-sans);
    outline: none;
    transition:
      border-color var(--transition-fast),
      box-shadow var(--transition-fast);

    &::placeholder {
      color: var(--color-text-secondary);
    }

    &:focus {
      border-color: var(--color-border-focus);
      box-shadow: 0 0 0 3px var(--color-ring);
    }

    &::-webkit-search-cancel-button {
      display: none;
    }
  }

  &__clear {
    position: absolute;
    right: var(--space-3);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    background: var(--color-surface-hover);
    color: var(--color-text-secondary);
    cursor: pointer;
    border-radius: var(--radius-full);
    font-size: var(--text-sm);
    transition:
      color var(--transition-fast),
      background var(--transition-fast);

    &:hover {
      color: var(--color-text-primary);
      background: var(--color-surface-raised);
    }
  }
}
</style>
