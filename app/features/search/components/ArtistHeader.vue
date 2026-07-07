<script setup lang="ts">
interface Props {
  name: string;
  thumbnailUrl: string;
  bannerUrl?: string;
  description?: string;
  isPlaying: boolean;
  isLoading: boolean;
  disablePlay: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  (e: 'play' | 'shuffle'): void;
}>();

const { t } = useI18n();

const isBioExpanded = ref(false);
const scrollY = ref(0);

function onContainerScroll(e: Event) {
  scrollY.value = (e.target as HTMLElement).scrollTop;
}

const parallaxStyle = computed(() => ({
  transform: `translateY(${scrollY.value * 0.4}px)`,
  transition: 'transform 0.05s linear'
}));

const headerOpacity = computed(() => {
  const maxScroll = 300;
  const opacity = Math.max(0, 1 - scrollY.value / maxScroll);
  return { opacity };
});

defineExpose({ onContainerScroll });
</script>

<template>
  <div class="artist-header">
    <div class="artist-header__bg" :style="parallaxStyle">
      <img
        v-if="bannerUrl || thumbnailUrl"
        :src="bannerUrl || thumbnailUrl"
        class="artist-header__bg-img"
        alt="" />
      <div class="artist-header__bg-overlay" />
    </div>

    <div class="artist-header__content" :style="headerOpacity">
      <div class="artist-header__avatar-wrap">
        <img v-if="thumbnailUrl" :src="thumbnailUrl" :alt="name" class="artist-header__avatar" />
        <div v-else class="artist-header__avatar artist-header__avatar--placeholder">
          <AppIcon name="ph:user-fill" class="artist-header__avatar-icon" />
        </div>
        <div class="artist-header__avatar-glow" />
      </div>

      <div class="artist-header__meta">
        <span class="artist-header__badge">{{ t('search.artist.badge') }}</span>
        <h1 class="artist-header__name">{{ name }}</h1>

        <p
          v-if="description"
          class="artist-header__bio"
          :class="{ 'artist-header__bio--expanded': isBioExpanded }">
          {{ description }}
        </p>
        <button
          v-if="description && description.length > 120"
          class="artist-header__bio-toggle"
          @click="isBioExpanded = !isBioExpanded">
          {{ isBioExpanded ? t('core.showLess') : t('core.showMore') }}
        </button>

        <div class="artist-header__actions">
          <button class="artist-header__play-btn" :disabled="disablePlay" @click="emit('play')">
            <AppIcon
              v-if="isLoading"
              name="ph:circle-notch"
              class="artist-header__play-btn-icon artist-header__play-btn-icon--spin" />
            <AppIcon
              v-else-if="isPlaying"
              name="ph:pause-fill"
              class="artist-header__play-btn-icon" />
            <AppIcon v-else name="ph:play-fill" class="artist-header__play-btn-icon" />
          </button>

          <button
            class="artist-header__shuffle-btn"
            :disabled="disablePlay"
            @click="emit('shuffle')">
            <AppIcon name="ph:shuffle" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.artist-header {
  position: relative;
  min-height: 380px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  border-radius: var(--radius-lg);
  margin-bottom: 2rem;

  &__bg {
    position: absolute;
    inset: -40px;
    z-index: 0;
    will-change: transform;
  }

  &__bg-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: blur(32px) brightness(0.55) saturate(1.4);
    transform: scale(1.1);
  }

  &__bg-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      transparent 0%,
      rgba(0, 0, 0, 0.3) 50%,
      rgba(0, 0, 0, 0.85) 100%
    );
  }

  &__content {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: flex-end;
    gap: 2rem;
    padding: 2.5rem;
    width: 100%;
  }

  &__avatar-wrap {
    position: relative;
    flex-shrink: 0;
  }

  &__avatar {
    width: 180px;
    height: 180px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid rgba(255, 255, 255, 0.15);
    position: relative;
    z-index: 1;

    &--placeholder {
      background: var(--color-bg-elevated);
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  &__avatar-icon {
    font-size: 5rem;
    color: var(--color-text-secondary);
  }

  &__avatar-glow {
    position: absolute;
    inset: -10px;
    border-radius: 50%;
    background: radial-gradient(
      circle,
      hsl(var(--color-primary-h) var(--color-primary-s) var(--color-primary-l) / 0.35) 0%,
      transparent 70%
    );
    z-index: 0;
    filter: blur(16px);
  }

  &__meta {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding-bottom: 0.25rem;
  }

  &__badge {
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    color: rgba(255, 255, 255, 0.7);
    text-transform: uppercase;
  }

  &__name {
    font-size: clamp(2rem, 5vw, 4rem);
    font-weight: 900;
    color: #fff;
    line-height: 1.05;
    text-shadow: 0 2px 24px rgba(0, 0, 0, 0.6);
    margin: 0;
  }

  &__bio {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.6;
    max-height: 3.2em;
    overflow: hidden;
    transition: max-height 0.3s ease;

    &--expanded {
      max-height: 20em;
    }
  }

  &__bio-toggle {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.8rem;
    cursor: pointer;
    padding: 0;
    align-self: flex-start;
    transition: color 0.2s;

    &:hover {
      color: #fff;
    }
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-top: 0.75rem;
  }

  &__play-btn {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    border: none;
    background: hsl(var(--color-primary-h) var(--color-primary-s) var(--color-primary-l));
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      transform 0.15s ease,
      box-shadow 0.2s ease;
    box-shadow: 0 4px 20px
      hsl(var(--color-primary-h) var(--color-primary-s) var(--color-primary-l) / 0.5);

    &:hover:not(:disabled) {
      transform: scale(1.08);
      box-shadow: 0 6px 28px
        hsl(var(--color-primary-h) var(--color-primary-s) var(--color-primary-l) / 0.7);
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    &-icon {
      font-size: 1.5rem;

      &--spin {
        animation: spin 1s linear infinite;
      }
    }
  }

  &__shuffle-btn {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.3);
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.8);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    transition: all 0.2s ease;
    backdrop-filter: blur(8px);

    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.2);
      color: #fff;
      border-color: rgba(255, 255, 255, 0.6);
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
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
