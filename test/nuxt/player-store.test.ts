import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { usePlayerStore } from '../../app/features/player/stores/usePlayerStore';

describe('usePlayerStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockTrack1 = {
    videoId: 'v1',
    title: 'T1',
    artist: 'A1',
    durationSeconds: 100,
    thumbnailUrl: ''
  };
  const mockTrack2 = {
    videoId: 'v2',
    title: 'T2',
    artist: 'A2',
    durationSeconds: 200,
    thumbnailUrl: ''
  };
  const mockTrack3 = {
    videoId: 'v3',
    title: 'T3',
    artist: 'A3',
    durationSeconds: 300,
    thumbnailUrl: ''
  };

  it('initializes correctly', () => {
    const store = usePlayerStore();
    expect(store.currentTrack).toBeNull();
    expect(store.queue).toEqual([]);
    expect(store.isPlaying).toBe(false);
    expect(store.volume).toBe(0.8);
    expect(store.playbackOrder).toBe('sequential');
    expect(store.repeatMode).toBe('off');
  });

  describe('setters and queue', () => {
    it('sets track', () => {
      const store = usePlayerStore();
      store.setTrack(mockTrack1);
      expect(store.currentTrack).toEqual(mockTrack1);
      expect(store.currentTimeSeconds).toBe(0);
      expect(store.durationSeconds).toBe(100);
      expect(store.error).toBeNull();
    });

    it('sets queue', () => {
      const store = usePlayerStore();
      store.setQueue([mockTrack1, mockTrack2]);
      expect(store.queue).toEqual([
        expect.objectContaining(mockTrack1),
        expect.objectContaining(mockTrack2)
      ]);
    });

    it('adds to queue and assigns unique queueId', () => {
      const store = usePlayerStore();
      store.addToQueue(mockTrack1);
      expect(store.queue).toEqual([expect.objectContaining(mockTrack1)]);

      store.addToQueue(mockTrack1); // Duplicate adds another instance
      expect(store.queue.length).toBe(2);
      expect(store.queue[0]?.queueId).not.toEqual(store.queue[1]?.queueId);

      store.addToQueue(mockTrack2);
      expect(store.queue.length).toBe(3);
    });
  });

  describe('nextTrack / prevTrack / hasNext / hasPrev', () => {
    it('returns null if no track or queue empty', () => {
      const store = usePlayerStore();
      expect(store.nextTrack()).toBeNull();
      expect(store.prevTrack()).toBeNull();
      expect(store.hasNext).toBe(false);
      expect(store.hasPrev).toBe(false);

      store.setTrack(mockTrack1);
      expect(store.nextTrack()).toBeNull(); // queue empty
      expect(store.hasNext).toBe(false);
    });

    it('handles normal linear playback', () => {
      const store = usePlayerStore();
      store.setQueue([mockTrack1, mockTrack2, mockTrack3]);

      store.setTrack(mockTrack1);
      expect(store.hasNext).toBe(true);
      expect(store.hasPrev).toBe(false);
      expect(store.nextTrack()?.videoId).toBe('v2');
      expect(store.prevTrack()).toBeNull();

      store.setTrack(mockTrack2);
      expect(store.hasNext).toBe(true);
      expect(store.hasPrev).toBe(true);
      expect(store.nextTrack()?.videoId).toBe('v3');
      expect(store.prevTrack()?.videoId).toBe('v1');

      store.setTrack(mockTrack3);
      expect(store.hasNext).toBe(false);
      expect(store.hasPrev).toBe(true);
      expect(store.nextTrack()).toBeNull();
      expect(store.prevTrack()?.videoId).toBe('v2');
    });

    it('handles repeat mode all', () => {
      const store = usePlayerStore();
      store.setQueue([mockTrack1, mockTrack2]);
      store.repeatMode = 'all';

      store.setTrack(mockTrack1);
      expect(store.hasPrev).toBe(true); // Loop back
      expect(store.prevTrack()?.videoId).toBe('v2'); // Last item

      store.setTrack(mockTrack2);
      expect(store.hasNext).toBe(true);
      expect(store.nextTrack()?.videoId).toBe('v1'); // Loop to start
    });

    it('handles random mode', () => {
      const store = usePlayerStore();
      store.setQueue([mockTrack1, mockTrack2]);
      store.playbackOrder = 'random';

      store.setTrack(mockTrack1);
      expect(store.hasNext).toBe(true);
      expect(store.hasPrev).toBe(false); // In random mode, hasPrev is false if history is empty

      const next = store.nextTrack();
      expect(next?.videoId).toBe('v2');

      const prev = store.prevTrack();
      expect(prev).toBeNull(); // because playbackOrder === 'random' and history is empty (since setTrack resets history? actually setTrack pushes to history if not fromHistory)

      // If only one item in queue, returns itself in shuffle? Wait, queue length is > 1.
      // In the new logic, physical shuffling means nextTrack returns null if there are no more tracks, even in random mode.
      store.setQueue([mockTrack1]);
      store.setTrack(mockTrack1);
      expect(store.hasNext).toBe(false);
      expect(store.nextTrack()).toBeNull();
    });
  });

  describe('visibleQueue', () => {
    it('computes visibleQueue and startIndex correctly', () => {
      const store = usePlayerStore();

      const longQueue: {
        videoId: string;
        title: string;
        artist: string;
        durationSeconds: number;
        thumbnailUrl: string;
        queueId: string;
      }[] = Array.from({ length: 30 }, (_, i) => ({
        videoId: `v${i}`,
        title: `T${i}`,
        artist: 'A',
        durationSeconds: 100,
        thumbnailUrl: '',
        queueId: `q${i}`
      }));

      store.setQueue(longQueue);

      // When currentTrack is null
      expect(store.visibleQueueStartIndex).toBe(0);
      expect(store.visibleQueue.length).toBe(21);

      // When currentTrack is at index 15
      const trackAt15 = longQueue[15] as {
        videoId: string;
        title: string;
        artist: string;
        durationSeconds: number;
        thumbnailUrl: string;
        queueId: string;
      };
      store.setTrack(trackAt15);
      expect(store.visibleQueueStartIndex).toBe(5); // 15 - 10 = 5
      expect(store.visibleQueue.length).toBe(21); // From index 5 to 26

      // When currentTrack is near the start
      const trackAt5 = longQueue[5] as {
        videoId: string;
        title: string;
        artist: string;
        durationSeconds: number;
        thumbnailUrl: string;
        queueId: string;
      };
      store.setTrack(trackAt5);
      expect(store.visibleQueueStartIndex).toBe(0);
      expect(store.visibleQueue.length).toBe(16); // From index 0 to 16

      // When currentTrack is near the end
      const trackAt28 = longQueue[28] as {
        videoId: string;
        title: string;
        artist: string;
        durationSeconds: number;
        thumbnailUrl: string;
        queueId: string;
      };
      store.setTrack(trackAt28);
      expect(store.visibleQueueStartIndex).toBe(18); // 28 - 10 = 18
      expect(store.visibleQueue.length).toBe(12); // From index 18 to 30

      // When track is not in queue
      store.setTrack({
        videoId: 'not-in-queue',
        title: 'X',
        artist: 'X',
        durationSeconds: 100,
        thumbnailUrl: ''
      });
      expect(store.visibleQueueStartIndex).toBe(0);
      expect(store.visibleQueue.length).toBe(21);
    });
  });
});
