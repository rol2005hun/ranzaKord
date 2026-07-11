import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useCanvasVisualizer } from '../../app/features/player/composables/useCanvasVisualizer';
import { setActivePinia, createPinia } from 'pinia';
import { useLayoutStore } from '../../app/features/core/stores/useLayoutStore';
import type { VisualizerStyle } from '../../app/features/core/types/layout.types';

describe('useCanvasVisualizer', () => {
  let mockContext: CanvasRenderingContext2D;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    mockContext = {
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      arc: vi.fn(),
      rect: vi.fn(),
      roundRect: vi.fn(),
      quadraticCurveTo: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      restore: vi.fn(),
      save: vi.fn(),
      createLinearGradient: vi.fn(() => ({
        addColorStop: vi.fn()
      })),
      shadowBlur: 0,
      shadowColor: '',
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0
    } as unknown as CanvasRenderingContext2D;

    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((cb) => setTimeout(cb, 0))
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('initializes and draws', () => {
    const { drawVisualizer } = useCanvasVisualizer();

    const layoutStore = useLayoutStore();
    layoutStore.setVisualizerStyle('bars');

    const context: {
      ctx: CanvasRenderingContext2D;
      width: number;
      height: number;
      dataArray: Uint8Array;
      style: VisualizerStyle;
      primaryH: string;
      primaryS: string;
      time: number;
    } = {
      ctx: mockContext,
      width: 800,
      height: 600,
      dataArray: new Uint8Array(256),
      style: 'bars',
      primaryH: '0',
      primaryS: '100%',
      time: 0
    };

    drawVisualizer(context);
    expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 800, 600);

    context.style = 'circle';
    drawVisualizer(context);

    context.style = 'wave';
    drawVisualizer(context);

    context.style = 'particles';
    drawVisualizer(context);
  });
});
