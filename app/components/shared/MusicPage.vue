<script setup lang="ts">
interface Props {
  isLoading?: boolean;
  isError?: boolean;
  errorText?: string;
  title?: string;
  badge?: string;
  imageUrl?: string | null;
  roundedImage?: boolean;
  isListPlaying?: boolean;
  disablePlayButton?: boolean;
  showPlayButton?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  isError: false,
  errorText: '',
  title: '',
  badge: '',
  imageUrl: null,
  roundedImage: false,
  isListPlaying: false,
  disablePlayButton: false,
  showPlayButton: true
});

const emit = defineEmits<{
  (e: 'play-all' | 'image-error'): void;
  (e: 'scroll', event: Event): void;
}>();

const headerRef = ref<HTMLElement | null>(null);
const isScrolled = ref(false);

function onContentScroll(event: Event): void {
  const el = event.target as HTMLElement;
  const headerHeight = headerRef.value ? headerRef.value.offsetHeight : 160;
  isScrolled.value = el.scrollTop >= headerHeight - 64;
  emit('scroll', event);
}
</script>

<template>
  <div class="music-page">
    <div v-if="isLoading" class="music-page__skeleton">
      <div class="music-page__skeleton-header">
        <div
          class="music-page__skeleton-cover skeleton-box"
          :class="{ 'music-page__skeleton-cover--rounded': roundedImage }"></div>
        <div class="music-page__skeleton-info">
          <div class="skeleton-line skeleton-line--badge"></div>
          <div class="skeleton-line skeleton-line--title"></div>
          <div class="skeleton-line skeleton-line--meta"></div>
        </div>
      </div>
      <div class="music-page__skeleton-actions">
        <div class="skeleton-btn skeleton-btn--play"></div>
        <slot name="skeleton-actions" />
      </div>
      <div class="music-page__skeleton-tracks">
        <div v-for="i in 6" :key="`sk-${i}`" class="music-page__track music-page__track--skeleton">
          <div class="music-page__track-num-wrapper">
            <div class="skeleton-line" style="width: 1rem; margin: 0"></div>
          </div>
          <div class="music-page__track-thumb skeleton-box"></div>
          <div class="music-page__track-text">
            <div class="skeleton-line skeleton-line--track-title"></div>
            <div class="skeleton-line skeleton-line--artist" style="margin-bottom: 0"></div>
          </div>
          <div class="music-page__track-duration">
            <div class="skeleton-line" style="width: 2rem; margin: 0"></div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="isError" class="music-page__error">
      <AppIcon name="ph:warning-circle" class="music-page__error-icon" />
      <p>{{ errorText || $t('core.musicDetail.error') }}</p>
    </div>

    <template v-else>
      <div
        class="music-page__sticky-bar"
        :class="{ 'music-page__sticky-bar--visible': isScrolled }">
        <div class="music-page__sticky-bar-bg"></div>
        <div class="music-page__sticky-bar-content">
          <div class="music-page__sticky-bar-left">
            <button
              v-if="showPlayButton"
              class="music-page__play-btn music-page__play-btn--small"
              :disabled="disablePlayButton"
              :aria-label="$t('player.play')"
              @click="emit('play-all')">
              <AppIcon v-if="isListPlaying" name="ph:pause-fill" />
              <AppIcon v-else name="ph:play-fill" />
            </button>
            <div class="music-page__sticky-bar-text">
              <span class="music-page__sticky-bar-title">{{ props.title }}</span>
              <span class="music-page__sticky-bar-subtitle">
                <slot name="sticky-subtitle"></slot>
              </span>
            </div>
          </div>
          <div class="music-page__sticky-bar-right">
            <slot name="sticky-actions"></slot>
          </div>
        </div>
      </div>

      <div class="music-page__scroll-area" @scroll="onContentScroll">
        <div ref="headerRef" class="music-page__header">
          <div
            class="music-page__header-bg"
            :style="imageUrl ? `background-image: url('${imageUrl}')` : ''"></div>
          <div class="music-page__header-overlay"></div>
          <div class="music-page__header-content">
            <div class="music-page__cover" :class="{ 'music-page__cover--rounded': roundedImage }">
              <NuxtImg
                v-if="imageUrl"
                :src="imageUrl"
                :alt="props.title || 'Cover'"
                width="120"
                height="120"
                format="webp"
                fetchpriority="high"
                preload
                @error="emit('image-error')" />
              <slot v-else name="fallback-icon">
                <AppIcon name="ph:music-notes" />
              </slot>
            </div>
            <div class="music-page__info">
              <div v-if="badge" class="music-page__badge">{{ badge }}</div>
              <h1 class="music-page__title">{{ props.title }}</h1>
              <div class="music-page__meta">
                <slot name="meta" />
              </div>
            </div>

            <div class="music-page__center-header">
              <slot name="center-header" />
            </div>

            <div class="music-page__actions">
              <button
                v-if="showPlayButton"
                class="music-page__play-btn"
                :disabled="disablePlayButton"
                :aria-label="$t('player.play')"
                @click="emit('play-all')">
                <AppIcon v-if="isListPlaying" name="ph:pause-fill" />
                <AppIcon v-else name="ph:play-fill" />
              </button>
              <slot name="actions" />
            </div>
          </div>
        </div>

        <slot name="tracks" />
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.music-page {
  position: absolute;
  inset: 0;
  max-width: 1600px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &__skeleton {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    padding: var(--space-6);
  }

  &__skeleton-header {
    display: flex;
    align-items: center;
    gap: var(--space-5);
    padding: var(--space-4) var(--space-6);
    min-height: 160px;
  }

  &__skeleton-cover {
    width: 120px;
    height: 120px;
    border-radius: var(--radius-xl);
    flex-shrink: 0;

    &--rounded {
      border-radius: 50%;
    }
  }

  &__skeleton-info {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    flex: 1;
  }

  &__skeleton-actions {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-2) 0;
  }

  &__skeleton-tracks {
    display: flex;
    flex-direction: column;
  }

  &__error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 50vh;
    gap: var(--space-4);
    color: var(--color-text-secondary);
  }

  &__error-icon {
    font-size: 4rem;
    margin-bottom: var(--space-4);
  }

  &__header {
    position: relative;
    min-height: 160px;
    display: flex;
    align-items: center;
    padding: var(--space-4) var(--space-6);
    overflow: hidden;
    flex-shrink: 0;

    &-bg {
      position: absolute;
      inset: -20px;
      background-size: cover;
      background-position: center;
      filter: blur(40px);
      z-index: 1;
    }

    &-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        to bottom,
        color-mix(in srgb, var(--color-bg) 50%, transparent) 0%,
        var(--color-bg) 100%
      );
      z-index: 2;
    }

    &-content {
      position: relative;
      z-index: 3;
      display: flex;
      align-items: center;
      gap: var(--space-5);
      width: 100%;

      @media (max-width: 768px) {
        flex-direction: column;
        text-align: center;
        gap: var(--space-4);
        padding-top: var(--space-4);
      }
    }
  }

  &__scroll-area {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    scrollbar-width: thin;
    scrollbar-color: var(--color-border) transparent;
    position: relative;
    --tracklist-sticky-top: 64px;

    @media (max-width: 768px) {
      padding: 0 0 var(--space-2);
    }

    &::-webkit-scrollbar {
      width: 8px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--color-border);
      border-radius: 4px;
    }
  }

  &__sticky-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 8px;
    z-index: 30;
    padding: 0 var(--space-6);
    height: 64px;
    opacity: 0;
    pointer-events: none;

    &--visible {
      opacity: 1;
      pointer-events: auto;
    }

    &-bg {
      position: absolute;
      inset: 0 0 -1px 0;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      background-color: color-mix(in srgb, var(--color-bg) 85%, transparent);
    }

    &-content {
      position: relative;
      z-index: 1;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-4);
    }

    &-left {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      min-width: 0;
    }

    &-text {
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-width: 0;
    }

    &-title {
      font-size: var(--text-base);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &-subtitle {
      font-size: var(--text-xs);
      color: var(--color-text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 2px;
    }

    &-right {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      flex-shrink: 0;
    }
  }

  &__cover {
    width: 120px;
    height: 120px;
    border-radius: var(--radius-xl);
    overflow: hidden;
    background-color: var(--color-surface-raised);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 3rem;
    color: var(--color-text-secondary);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
    flex-shrink: 0;

    &--rounded {
      border-radius: 50%;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    flex: 1;
    min-width: 0;

    @media (max-width: 768px) {
      align-items: center;
    }
  }

  &__badge {
    font-size: var(--text-xs);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  &__title {
    font-size: clamp(1.4rem, 3vw, 2.2rem);
    font-weight: var(--font-weight-black);
    color: var(--color-text-primary);
    line-height: 1.1;
    margin: 0 0 var(--space-2) 0;
    display: -webkit-box;
    line-clamp: 2;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
    color: var(--color-text-primary);
    font-weight: var(--font-weight-medium);
    opacity: 0.9;
    flex-wrap: wrap;

    @media (max-width: 768px) {
      justify-content: center;
    }
  }

  &__center-header {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    min-width: 0;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    flex-shrink: 0;
  }

  &__play-btn {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background-color: var(--color-primary);
    color: #000;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    cursor: pointer;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
    transition: all var(--transition-fast);
    flex-shrink: 0;

    &--small {
      width: 44px;
      height: 44px;
      font-size: 1.5rem;
      box-shadow: none;
    }

    &:hover:not(:disabled) {
      transform: scale(1.05);
      background-color: var(--color-primary-hover);
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }

  &__track {
    display: grid;
    grid-template-columns: 48px 40px 1fr 60px 48px;
    align-items: center;
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background-color var(--transition-fast);
    gap: var(--space-3);
    box-sizing: border-box;

    &:hover {
      background-color: var(--color-surface-hover);
    }

    &--skeleton {
      cursor: default;

      &:hover {
        background-color: transparent;
      }
    }
  }

  &__track-num-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__track-thumb {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-sm);
    background: var(--color-surface-hover);
    overflow: hidden;
    flex-shrink: 0;
  }

  &__track-text {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 2px;
    min-width: 0;
  }

  &__track-duration {
    display: flex;
    align-items: center;
    justify-content: flex-start;
  }

  .skeleton-box {
    background: var(--color-surface-raised);
    animation: pulse 1.5s infinite ease-in-out;
  }

  .skeleton-line {
    background: var(--color-surface-raised);
    height: 12px;
    border-radius: var(--radius-sm);
    animation: pulse 1.5s infinite ease-in-out;
    margin-bottom: var(--space-2);

    &--badge {
      width: 60px;
      height: 14px;
      margin-bottom: var(--space-3);
    }

    &--title {
      width: min(400px, 70vw);
      height: 48px;
      margin-bottom: var(--space-3);
    }

    &--meta {
      width: 250px;
      height: 14px;
    }

    &--track-title {
      width: 140px;
      margin-bottom: 4px;
    }

    &--artist {
      width: 90px;
      height: 10px;
    }
  }

  .skeleton-btn {
    background: var(--color-surface-raised);
    animation: pulse 1.5s infinite ease-in-out;
    border-radius: 50%;

    &--play {
      width: 64px;
      height: 64px;
    }
  }

  @keyframes pulse {
    0% {
      opacity: 0.5;
    }
    50% {
      opacity: 0.8;
    }
    100% {
      opacity: 0.5;
    }
  }
}
</style>
