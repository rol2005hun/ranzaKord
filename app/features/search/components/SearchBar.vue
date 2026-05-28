<script setup lang="ts">
import { ref, watch } from 'vue';
import type { SearchResult, CategorizedSearchResults } from '../types/search.types';

const route = useRoute();
const router = useRouter();

const localQuery = ref((route.query.q as string) || '');
const isDropdownOpen = ref(false);
const isLoading = ref(false);
const dropdownItems = ref<SearchResult[]>([]);

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// Sync localQuery if URL changes externally (e.g. back button)
watch(
  () => route.query.q,
  (newQ) => {
    if (newQ && typeof newQ === 'string' && !isDropdownOpen.value) {
      localQuery.value = newQ;
    }
  }
);

function onInput(event: Event) {
  const text = (event.target as HTMLInputElement).value;
  localQuery.value = text;
  
  if (text.trim().length === 0) {
    isDropdownOpen.value = false;
    dropdownItems.value = [];
    return;
  }

  isDropdownOpen.value = true;
  isLoading.value = true;

  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    try {
      const data = await $fetch<CategorizedSearchResults>(`/api/search?q=${encodeURIComponent(text.trim())}`);
      const items = [];
      const seenIds = new Set();

      if (data.topResult) {
        items.push(data.topResult);
        seenIds.add(data.topResult.id);
      }
      
      if (data.songs) {
        for (const song of data.songs) {
          if (!seenIds.has(song.id)) {
            items.push(song);
            seenIds.add(song.id);
          }
        }
      }
      
      dropdownItems.value = items.slice(0, 5);
    } catch {
      dropdownItems.value = [];
    } finally {
      isLoading.value = false;
    }
  }, 350);
}

function onFocus() {
  if (localQuery.value.trim().length > 0) {
    isDropdownOpen.value = true;
  }
}

function onBlur() {
  setTimeout(() => {
    isDropdownOpen.value = false;
  }, 200);
}

const inputRef = ref<HTMLInputElement | null>(null);

function onKeyDown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    const text = localQuery.value.trim();
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
  localQuery.value = '';
  isDropdownOpen.value = false;
  dropdownItems.value = [];
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
      :value="localQuery"
      :placeholder="$t('search.placeholder')"
      :aria-label="$t('search.placeholder')"
      autocomplete="off"
      @input="onInput"
      @focus="onFocus"
      @blur="onBlur"
      @keydown="onKeyDown" />

    <button
      v-if="localQuery"
      class="search-bar__clear"
      :aria-label="$t('search.clear')"
      @click="onClear">
      <AppIcon name="ph:x" />
    </button>

    <div v-if="isDropdownOpen && localQuery" class="search-bar__dropdown" @mousedown.prevent>
      <div v-if="isLoading" class="search-bar__dropdown-list">
        <div
          v-for="i in 5"
          :key="i"
          style="display: flex; gap: var(--space-3); align-items: center; padding: var(--space-2) var(--space-3);">
          <AppSkeleton width="40px" height="40px" border-radius="var(--radius-sm)" />
          <div style="display: flex; flex-direction: column; gap: var(--space-1); flex: 1">
            <AppSkeleton height="14px" width="70%" />
            <AppSkeleton height="10px" width="40%" />
          </div>
        </div>
      </div>

      <div v-else-if="dropdownItems.length === 0" class="search-bar__dropdown-empty">
        {{ $t('search.noResults', { query: localQuery }) }}
      </div>

      <div v-else class="search-bar__dropdown-list">
        <SearchListItem
          v-for="track in dropdownItems"
          :key="track.id"
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
