<script setup lang="ts">
import type { PlaylistTrack } from '../types/playlists.types';

const props = defineProps<{
  track: Omit<PlaylistTrack, 'addedAt'>;
  anchor: HTMLElement | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const { t } = useI18n({ useScope: 'global' });
const store = usePlaylistsStore();
const toast = useToast();

const popupRef = ref<HTMLElement | null>(null);

const allPlaylists = computed(() => {
  return [...store.playlists, ...store.sharedPlaylists];
});

onClickOutside(
  popupRef,
  () => {
    emit('close');
  },
  { ignore: props.anchor ? [props.anchor] : [] }
);

const style = ref<Record<string, string>>({ top: '-9999px', left: '-9999px', opacity: '0' });

onMounted(async () => {
  if (!import.meta.client) return;
  await nextTick();

  if (!props.anchor || !popupRef.value) {
    style.value = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: '1' };
    return;
  }

  const rect = props.anchor.getBoundingClientRect();
  const popupRect = popupRef.value.getBoundingClientRect();

  let top = rect.bottom + 8;
  let left = rect.left - popupRect.width / 2 + rect.width / 2;

  if (top + popupRect.height > window.innerHeight) {
    top = rect.top - popupRect.height - 8;
    if (top < 0) top = 16;
  }

  if (left + popupRect.width > window.innerWidth) {
    left = window.innerWidth - popupRect.width - 16;
  }
  if (left < 16) left = 16;

  style.value = {
    top: `${top}px`,
    left: `${left}px`,
    opacity: '1'
  };
});

const processing = ref<string[]>([]);

async function toggle(playlistId: string) {
  if (processing.value.includes(playlistId)) return;

  processing.value.push(playlistId);
  try {
    if (store.isTrackInPlaylist(playlistId, props.track.videoId)) {
      await store.removeTrack(playlistId, props.track.videoId);
      toast.success(t('playlists.removedSuccess'));
    } else {
      await store.addTrack(playlistId, props.track);
      toast.success(t('playlists.addedSuccess'));
    }
  } catch {
    toast.danger(t('playlists.addFailed'));
  } finally {
    processing.value = processing.value.filter((id) => id !== playlistId);
  }
}
</script>

<template>
  <Teleport to="body">
    <div ref="popupRef" class="add-playlist-popup" :style="style" @click.stop>
      <div class="add-playlist-popup__header">
        <span class="add-playlist-popup__title">
          {{ $t('playlists.addToPlaylist') }}
        </span>
        <button class="add-playlist-popup__close" @click="emit('close')">
          <AppIcon name="ph:x" />
        </button>
      </div>

      <div v-if="allPlaylists.length === 0" class="add-playlist-popup__empty">
        {{ $t('playlists.noPlaylists') }}
      </div>

      <ul v-else class="add-playlist-popup__list">
        <li v-for="p in allPlaylists" :key="p.id" class="add-playlist-popup__item">
          <button class="add-playlist-popup__btn" @click="toggle(p.id)">
            <span class="add-playlist-popup__name">{{ p.name }}</span>
            <AppSpinner v-if="processing.includes(p.id)" size="sm" />
            <AppIcon
              v-else-if="store.isTrackInPlaylist(p.id, track.videoId)"
              name="ph:check-circle-fill"
              class="text-success" />
            <AppIcon v-else name="ph:plus" />
          </button>
        </li>
      </ul>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
.add-playlist-popup {
  position: fixed;
  z-index: 9999;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-xl);
  width: 240px;
  max-width: 90vw;
  max-height: 300px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: opacity var(--transition-fast);

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-2) var(--space-3);
    border-bottom: 1px solid var(--color-border);
  }

  &__title {
    font-size: var(--text-xs);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-secondary);
    text-transform: uppercase;
  }

  &__close {
    background: none;
    border: none;
    color: var(--color-text-secondary);
    cursor: pointer;
    display: flex;
    padding: 2px;
    border-radius: var(--radius-sm);

    &:hover {
      background: var(--color-surface-hover);
      color: var(--color-text-primary);
    }
  }

  &__list {
    list-style: none;
    padding: 0;
    margin: 0;
    overflow-y: auto;
    flex: 1;

    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--color-border);
      border-radius: 4px;
    }
  }

  &__empty {
    padding: var(--space-4);
    text-align: center;
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }

  &__item {
    border-bottom: 1px solid color-mix(in srgb, var(--color-border) 50%, transparent);

    &:last-child {
      border-bottom: none;
    }
  }

  &__btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-2) var(--space-3);
    background: none;
    border: none;
    color: var(--color-text-primary);
    font-size: var(--text-sm);
    cursor: pointer;
    text-align: left;

    &:hover {
      background: var(--color-surface-hover);
    }
  }

  &__name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    margin-right: var(--space-2);
  }
}

.text-success {
  color: hsl(140, 60%, 50%);
}
</style>
