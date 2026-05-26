<script setup lang="ts">
import { ref, watch } from 'vue';

const { search, query, clear, results, isLoading } = useSearch();
const inputRef = ref<HTMLInputElement | null>(null);
const isDropdownOpen = ref(false);

const route = useRoute();
const router = useRouter();

// Update query when navigating with a query param (client side only)
onMounted(() => {
  watch(
    () => route.query.q,
    (newQ) => {
      if (newQ && typeof newQ === 'string') {
        if (newQ !== query.value) {
          search(newQ);
        }
      }
    },
    { immediate: true }
  );
});

function onInput(event: Event) {
  const el = event.target as HTMLInputElement;
  const text = el.value;
  search(text);
  isDropdownOpen.value = text.trim().length > 0;

  if (text.trim().length > 0) {
    router.replace({ query: { ...route.query, q: text } });
  } else {
    const newQuery = { ...route.query };
    delete newQuery.q;
    router.replace({ query: newQuery });
  }
}

function onFocus() {
  if (query.value.trim().length > 0) {
    isDropdownOpen.value = true;
  }
}

function onBlur() {
  // Use a small timeout to allow clicking on dropdown items before closing
  setTimeout(() => {
    isDropdownOpen.value = false;
  }, 200);
}

function onKeyDown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    const text = query.value.trim();
    if (text) {
      isDropdownOpen.value = false;
      inputRef.value?.blur();
      router.push({ path: '/search', query: { q: text } });
    }
  } else if (event.key === 'Escape') {
    isDropdownOpen.value = false;
    inputRef.value?.blur();
  }
}

function onClear() {
  clear();
  isDropdownOpen.value = false;
  inputRef.value?.focus();
  const newQuery = { ...route.query };
  delete newQuery.q;
  router.replace({ query: newQuery });
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
      @input="onInput"
      @focus="onFocus"
      @blur="onBlur"
      @keydown="onKeyDown" />

    <button
      v-if="query"
      class="search-bar__clear"
      :aria-label="$t('search.clear')"
      @click="onClear">
      <AppIcon name="ph:x" />
    </button>

    <div v-if="isDropdownOpen && query" class="search-bar__dropdown">
      <div v-if="isLoading" class="search-bar__dropdown-loading">
        <AppIcon name="ph:spinner-gap" class="spinner" />
      </div>

      <div v-else-if="results.length === 0" class="search-bar__dropdown-empty">
        {{ $t('search.noResults', { query }) }}
      </div>

      <div v-else class="search-bar__dropdown-list">
        <SearchListItem
          v-for="track in results"
          :key="track.videoId"
          :track="track"
          @click="isDropdownOpen = false" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.search-bar {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 600px;
  z-index: 101; /* Above navbar dropdowns */

  &__icon {
    position: absolute;
    left: var(--space-4);
    color: var(--color-text-secondary);
    font-size: var(--text-lg);
    pointer-events: none;
    z-index: 2;
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
    position: relative;
    z-index: 1;
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
    z-index: 2;
    transition:
      color var(--transition-fast),
      background var(--transition-fast);

    &:hover {
      color: var(--color-text-primary);
      background: var(--color-surface-raised);
    }
  }

  &__dropdown {
    position: absolute;
    top: calc(100% + var(--space-2));
    left: 0;
    right: 0;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-xl);
    max-height: 400px;
    overflow-y: auto;
    z-index: 100;
    display: flex;
    flex-direction: column;
    animation: slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  &__dropdown-loading,
  &__dropdown-empty {
    padding: var(--space-6);
    display: flex;
    justify-content: center;
    align-items: center;
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
  }

  &__dropdown-loading {
    .spinner {
      font-size: var(--text-2xl);
      animation: spin 1s linear infinite;
    }
  }

  &__dropdown-list {
    display: flex;
    flex-direction: column;
    padding: var(--space-2);
    gap: 2px;
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
