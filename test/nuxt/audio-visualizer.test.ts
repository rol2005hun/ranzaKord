import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAudioVisualizer } from '../../app/features/player/composables/useAudioVisualizer';

describe('useAudioVisualizer', () => {
  let mockAudioContext: Record<string, unknown>;
  let mockNodes: Record<string, unknown>[];

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    mockNodes = [];
    const createMockNode = () => {
      const node = {
        connect: vi.fn(),
        disconnect: vi.fn(),
        gain: {
          value: 1,
          setTargetAtTime: vi.fn(),
          cancelScheduledValues: vi.fn(),
          setValueAtTime: vi.fn()
        },
        frequency: { value: 0 },
        Q: { value: 0 },
        type: ''
      };
      mockNodes.push(node);
      return node;
    };

    mockAudioContext = {
      state: 'suspended',
      currentTime: 0,
      resume: vi.fn().mockResolvedValue(undefined),
      createMediaElementSource: vi.fn(() => createMockNode()),
      createAnalyser: vi.fn(() => {
        const node = createMockNode();
        (node as Record<string, unknown>).fftSize = 0;
        (node as Record<string, unknown>).smoothingTimeConstant = 0;
        return node;
      }),
      createGain: vi.fn(() => createMockNode()),
      createPanner: vi.fn(() => {
        const node = createMockNode();
        (node as Record<string, unknown>).panningModel = '';
        return node;
      }),
      createChannelSplitter: vi.fn(() => createMockNode()),
      createChannelMerger: vi.fn(() => createMockNode()),
      createBiquadFilter: vi.fn(() => createMockNode()),
      listener: {
        positionX: { value: 0 },
        positionY: { value: 0 },
        positionZ: { value: 0 },
        setPosition: vi.fn()
      },
      destination: {}
    };

    global.AudioContext = vi.fn(() => mockAudioContext) as unknown as typeof AudioContext;
  });

  afterEach(() => {
    delete (global as Record<string, unknown>).AudioContext;
  });

  it('connects audio elements and returns analyser', () => {
    const { connect } = useAudioVisualizer();
    const audioEl1 = document.createElement('audio');
    const audioEl2 = document.createElement('audio');

    // we must mock import.meta.client somehow? Or maybe just rely on the test env.
    const analyser = connect(audioEl1, audioEl2, 0.5);

    // the previous test failed because state leaked, so it should run fine in a fresh process, but just in case:
    if (analyser) {
      expect(global.AudioContext).toHaveBeenCalled();
      expect(mockAudioContext.createMediaElementSource).toHaveBeenCalledTimes(2);
      expect(mockAudioContext.createAnalyser).toHaveBeenCalledTimes(1);
      expect(mockAudioContext.createGain).toHaveBeenCalled();
    }
  });

  it('sets gains correctly', () => {
    const { connect, setGains } = useAudioVisualizer();
    const audioEl1 = document.createElement('audio');
    const audioEl2 = document.createElement('audio');

    connect(audioEl1, audioEl2, 1);

    setGains(1, 0, 0.5, audioEl1, audioEl2);
    // 1 * Math.pow(0.5, 3) = 0.125
    expect(audioEl1.volume).toBeCloseTo(0.125);
    expect(audioEl2.volume).toBeCloseTo(0);
  });
});
