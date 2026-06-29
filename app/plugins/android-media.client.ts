declare global {
  interface Window {
    AndroidMedia?: {
      updateState(isPlaying: boolean, title: string, artist: string, imageUrl: string): void;
      stopService(): void;
    };
  }
}

export default defineNuxtPlugin(() => {
  if (!import.meta.client) return;

  const playerStore = usePlayerStore();
  const player = usePlayer();

  // Listen for actions from Android MediaService
  window.addEventListener('android_media_action', (e: Event) => {
    const customEvent = e as CustomEvent<string>;
    switch (customEvent.detail) {
      case 'play':
        player.resume();
        break;
      case 'pause':
        player.pause();
        break;
      case 'next':
        player.playNext();
        break;
      case 'prev':
        player.playPrev();
        break;
    }
  });

  // Watch for state changes and update Android MediaService
  watch(
    () => [playerStore.currentTrack, playerStore.isPlaying],
    () => {
      if (window.AndroidMedia) {
        const track = playerStore.currentTrack;
        if (track) {
          window.AndroidMedia.updateState(
            playerStore.isPlaying,
            track.title || '',
            track.artist || '',
            track.thumbnailUrl || ''
          );
        } else {
          window.AndroidMedia.stopService();
        }
      }
    },
    { deep: true }
  );
});
