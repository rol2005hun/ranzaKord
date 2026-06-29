import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { usePlayer } from '../../app/features/player/composables/usePlayer';
import { usePlayerStore } from '../../app/features/player/stores/usePlayerStore';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { nextTick } from 'vue';

mockNuxtImport('useI18n', () => {
  return () => ({
    t: (key: string) => key
  });
});

describe('usePlayer', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockTrack = {
    videoId: 'v1',
    title: 'T1',
    artist: 'A1',
    durationSeconds: 100,
    thumbnailUrl: ''
  };

  class MockAudioElement {
    src = '';
    currentTime = 0;
    duration = 100;
    volume = 1;
    listeners: Record<string, Array<() => void>> = {};

    addEventListener(event: string, fn: () => void) {
      if (!this.listeners[event]) this.listeners[event] = [];
      this.listeners[event].push(fn);
    }
    removeEventListener(event: string, fn: () => void) {
      if (!this.listeners[event]) return;
      this.listeners[event] = this.listeners[event].filter((f) => f !== fn);
    }
    dispatchEvent(event: string) {
      if (this.listeners[event]) {
        this.listeners[event].forEach((fn) => fn());
      }
    }
    async play() {
      return Promise.resolve();
    }
    pause() {}
    load() {}
  }

  it('binds audio and updates state', async () => {
    const { bindAudio } = usePlayer();
    const store = usePlayerStore();
    const mockAudio = new MockAudioElement() as unknown as HTMLAudioElement;
    const mockAudio2 = new MockAudioElement() as unknown as HTMLAudioElement;

    bindAudio(mockAudio, mockAudio2);

    // Simulate timeupdate
    mockAudio.currentTime = 50;
    (mockAudio as unknown as MockAudioElement).dispatchEvent('timeupdate');
    expect(store.currentTimeSeconds).toBe(50);

    // Simulate play/pause
    (mockAudio as unknown as MockAudioElement).dispatchEvent('play');
    expect(store.isPlaying).toBe(true);

    (mockAudio as unknown as MockAudioElement).dispatchEvent('pause');
    expect(store.isPlaying).toBe(false);

    // Simulate ended
    (mockAudio as unknown as MockAudioElement).dispatchEvent('ended');
    expect(store.isPlaying).toBe(false);

    // Simulate error
    (mockAudio as unknown as MockAudioElement).dispatchEvent('error');
    expect(store.error).toBeDefined();
  });

  it('playTrack sets track and plays audio', async () => {
    const { playTrack, bindAudio, currentTrack, isPlaying } = usePlayer();
    const mockAudio = new MockAudioElement() as unknown as HTMLAudioElement;
    const mockAudio2 = new MockAudioElement() as unknown as HTMLAudioElement;
    vi.spyOn(mockAudio, 'play').mockResolvedValue();

    bindAudio(mockAudio, mockAudio2);
    await playTrack(mockTrack);
    await nextTick();

    expect(currentTrack.value).toEqual(mockTrack);
    expect(mockAudio.src).toContain('v=v1');
    expect(isPlaying.value).toBe(true);
    expect(mockAudio.play).toHaveBeenCalled();
  });

  it('playTrack toggles play if same track', async () => {
    const { playTrack, bindAudio } = usePlayer();
    const mockAudio = new MockAudioElement() as unknown as HTMLAudioElement;
    const mockAudio2 = new MockAudioElement() as unknown as HTMLAudioElement;
    bindAudio(mockAudio, mockAudio2);

    await playTrack(mockTrack); // First play
    const store = usePlayerStore();
    store.isPlaying = true;

    // Play same track again should pause
    const pauseSpy = vi.spyOn(mockAudio, 'pause');
    await playTrack(mockTrack);

    expect(pauseSpy).toHaveBeenCalled();
  });

  it('controls work correctly', async () => {
    const { bindAudio, pause, resume, seek, setVolume, toggleShuffle, toggleRepeat } = usePlayer();
    const store = usePlayerStore();
    const mockAudio = new MockAudioElement() as unknown as HTMLAudioElement;
    const mockAudio2 = new MockAudioElement() as unknown as HTMLAudioElement;
    bindAudio(mockAudio, mockAudio2);

    const pauseSpy = vi.spyOn(mockAudio, 'pause');
    pause();
    expect(pauseSpy).toHaveBeenCalled();
    expect(store.isPlaying).toBe(false);

    const playSpy = vi.spyOn(mockAudio, 'play').mockResolvedValue();
    resume();
    expect(playSpy).toHaveBeenCalled();

    seek(30);
    expect(mockAudio.currentTime).toBe(30);
    expect(store.currentTimeSeconds).toBe(30);

    setVolume(0.5);
    expect(store.volume).toBe(0.5);
    // Note: Since useAudioVisualizer handles the volume logic now, we mock it or just assume it is set appropriately.

    toggleShuffle();
    expect(store.playbackOrder).toBe('random');

    toggleRepeat();
    expect(store.repeatMode).toBe('all');
    toggleRepeat();
    expect(store.repeatMode).toBe('one');
    toggleRepeat();
    expect(store.repeatMode).toBe('off');

    const trackToAdd = { ...mockTrack, videoId: 'q1' };
    const { addToQueue } = usePlayer();
    addToQueue(trackToAdd);
    expect(store.queue[0]).toEqual(expect.objectContaining(trackToAdd));

    // Access computeds to increase coverage
    const {
      isLoading,
      durationSeconds,
      error,
      repeatMode,
      hasNext,
      hasPrev,
      audioElement,
      audioElement1,
      audioElement2
    } = usePlayer();

    expect(isLoading.value).toBe(false);
    expect(durationSeconds.value).toBe(0);
    expect(error.value).toBeNull();
    expect(repeatMode.value).toBe('off');
    expect(hasNext.value).toBe(false);
    expect(hasPrev.value).toBe(false);
    expect(audioElement.value).toEqual(mockAudio);
    expect(audioElement1.value).toEqual(mockAudio);
    expect(audioElement2.value).toEqual(mockAudio2);
  });

  it('playNext and playPrev', async () => {
    const { playNext, playPrev, bindAudio, setQueue } = usePlayer();
    const store = usePlayerStore();
    const mockAudio = new MockAudioElement() as unknown as HTMLAudioElement;
    const mockAudio2 = new MockAudioElement() as unknown as HTMLAudioElement;
    bindAudio(mockAudio, mockAudio2);

    setQueue([mockTrack, { ...mockTrack, videoId: 'v2' }]);
    store.setTrack(mockTrack);

    playNext();
    await nextTick();
    expect(store.currentTrack?.videoId).toBe('v2');

    // Play prev
    playPrev();
    await nextTick();
    expect(store.currentTrack?.videoId).toBe('v1');
  });

  it('playQueue plays from index', async () => {
    const { playQueue, bindAudio } = usePlayer();
    const store = usePlayerStore();
    const mockAudio = new MockAudioElement() as unknown as HTMLAudioElement;
    const mockAudio2 = new MockAudioElement() as unknown as HTMLAudioElement;
    bindAudio(mockAudio, mockAudio2);

    const t2 = { ...mockTrack, videoId: 'v2' };
    playQueue([mockTrack, t2], 1);
    await nextTick();

    expect(store.queue.length).toBe(2);
    expect(store.currentTrack?.videoId).toBe('v2');
  });
});
