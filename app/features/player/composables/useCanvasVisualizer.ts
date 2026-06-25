import type { VisualizerStyle } from '@/features/core/types/layout.types';

interface DrawContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  dataArray: Uint8Array;
  style: VisualizerStyle;
  primaryH: string;
  primaryS: string;
  time: number; // passed from requestAnimationFrame to keep animation smooth
}

export function useCanvasVisualizer() {
  function drawVisualizer({
    ctx,
    width: W,
    height: H,
    dataArray,
    style,
    primaryH,
    primaryS,
    time
  }: DrawContext) {
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, W, H);

    // Calculate bass energy for pulsing effects
    let bassSum = 0;
    const bassBins = Math.min(10, Math.max(1, Math.floor(dataArray.length / 8)));
    for (let i = 0; i < bassBins; i++) {
      bassSum += dataArray[i] ?? 0;
    }
    const bassEnergy = bassBins > 0 ? bassSum / (bassBins * 255) : 0;
    const bassScale = 1 + Math.pow(bassEnergy, 3) * 0.35;

    // Smooth amplitudes
    const BARS = style === 'bars' ? 64 : 90;
    const rawAmplitudes = new Float32Array(BARS);
    const halfBars = Math.floor(BARS / 2);
    const maxIdx = Math.floor(dataArray.length * 0.6);

    for (let i = 0; i < halfBars; i++) {
      const startP = i / halfBars;
      const endP = (i + 1) / halfBars;

      const startIdx = Math.floor(Math.pow(startP, 1.2) * maxIdx);
      const endIdx = Math.max(startIdx + 1, Math.floor(Math.pow(endP, 1.2) * maxIdx));

      let sum = 0;
      for (let j = startIdx; j < endIdx; j++) {
        sum += dataArray[j] ?? 0;
      }
      const val = sum / (endIdx - startIdx) / 255;

      if (style === 'circle' || style === 'wave') {
        rawAmplitudes[i] = val;
        rawAmplitudes[BARS - 1 - i] = val; // Mirror for circle/wave
      } else {
        // For bars, we just map 0 to BARS directly (not mirrored)
        rawAmplitudes[i * 2] = val;
        rawAmplitudes[i * 2 + 1] = val;
      }
    }

    const smoothedAmplitudes = new Float32Array(BARS);
    for (let i = 0; i < BARS; i++) {
      if (style === 'bars') {
        // Less smoothing for bars to keep them punchy
        smoothedAmplitudes[i] = rawAmplitudes[i] ?? 0;
      } else {
        const prev = rawAmplitudes[(i - 1 + BARS) % BARS] ?? 0;
        const curr = rawAmplitudes[i] ?? 0;
        const next = rawAmplitudes[(i + 1) % BARS] ?? 0;
        smoothedAmplitudes[i] = prev * 0.25 + curr * 0.5 + next * 0.25;
      }
    }

    if (style === 'circle') {
      drawCircle(ctx, W, H, smoothedAmplitudes, BARS, bassScale, primaryH, primaryS, time, dpr);
    } else if (style === 'bars') {
      drawBars(ctx, W, H, smoothedAmplitudes, BARS, primaryH, primaryS, dpr);
    } else if (style === 'wave') {
      drawWave(ctx, W, H, smoothedAmplitudes, BARS, primaryH, primaryS, time, dpr);
    } else if (style === 'particles') {
      drawParticles(ctx, W, H, bassEnergy, primaryH, primaryS, dpr);
    }

    return bassScale;
  }

  function drawCircle(
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    amplitudes: Float32Array,
    BARS: number,
    bassScale: number,
    primaryH: string,
    primaryS: string,
    time: number,
    dpr: number
  ) {
    const cx = W / 2;
    const cy = H * 0.42;
    const innerR = Math.min(W, H) * 0.31 * bassScale;
    const maxBarH = Math.min(W, H) * (0.18 + Math.pow(bassScale - 1, 0.6) * 0.5); // Derived roughly from original

    const slowTime = time * 0.0002;

    for (let i = 0; i < BARS; i++) {
      const amplitude = amplitudes[i] ?? 0;
      const barH = amplitude * amplitude * maxBarH + 2 * dpr;
      const angle = (i / BARS) * Math.PI * 2 + Math.PI / 2 + slowTime;

      const x1 = cx + Math.cos(angle) * innerR;
      const y1 = cy + Math.sin(angle) * innerR;
      const x2 = cx + Math.cos(angle) * (innerR + barH);
      const y2 = cy + Math.sin(angle) * (innerR + barH);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = `hsla(${primaryH}, ${primaryS}, ${55 + amplitude * 25}%, ${0.4 + amplitude * 0.6})`;
      ctx.lineWidth = ((2 * Math.PI * innerR) / BARS) * 0.4;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }

  function drawBars(
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    amplitudes: Float32Array,
    BARS: number,
    primaryH: string,
    primaryS: string,
    dpr: number
  ) {
    const barWidth = (W / BARS) * 0.8;
    const gap = (W / BARS) * 0.2;
    const maxBarH = H * 0.7;

    for (let i = 0; i < BARS; i++) {
      const amplitude = amplitudes[i] ?? 0;
      const barH = amplitude * maxBarH + 2 * dpr;

      const x = i * (barWidth + gap) + gap / 2;
      const y = H - barH;

      const gradient = ctx.createLinearGradient(x, H, x, y);
      gradient.addColorStop(0, `hsla(${primaryH}, ${primaryS}, 50%, 0.8)`);
      gradient.addColorStop(1, `hsla(${primaryH}, ${primaryS}, 70%, 1)`);

      ctx.fillStyle = gradient;
      // Retro rounded top
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barH, [barWidth / 2, barWidth / 2, 0, 0]);
      ctx.fill();
    }
  }

  function drawWave(
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    amplitudes: Float32Array,
    BARS: number,
    primaryH: string,
    primaryS: string,
    time: number,
    dpr: number
  ) {
    const cy = H / 2;
    const maxAmp = H * 0.4;

    ctx.beginPath();
    for (let i = 0; i <= BARS; i++) {
      const idx = i % BARS;
      const amplitude = amplitudes[idx] ?? 0;

      // Add a sweeping sine wave effect
      const sweep = Math.sin((i / BARS) * Math.PI * 4 + time * 0.002) * 0.5 + 0.5;
      const h = amplitude * sweep * maxAmp * Math.sin((i / BARS) * Math.PI);

      const x = (i / BARS) * W;
      const y = cy + h * (i % 2 === 0 ? 1 : -1);

      if (i === 0) {
        ctx.moveTo(x, cy);
      } else {
        // Curve to
        const prevX = ((i - 1) / BARS) * W;
        const cpX = prevX + (x - prevX) / 2;
        ctx.quadraticCurveTo(cpX, y, x, y);
      }
    }

    ctx.strokeStyle = `hsla(${primaryH}, ${primaryS}, 65%, 1)`;
    ctx.lineWidth = 4 * dpr;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Glow effect
    ctx.shadowColor = `hsla(${primaryH}, ${primaryS}, 50%, 0.5)`;
    ctx.shadowBlur = 15;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Very simple particle system state for the visualizer
  const particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
    size: number;
  }> = [];

  function drawParticles(
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    bassEnergy: number,
    primaryH: string,
    primaryS: string,
    dpr: number
  ) {
    // Emit particles on beat
    if (bassEnergy > 0.6 && Math.random() > 0.5) {
      const numToEmit = Math.floor(bassEnergy * 5);
      for (let i = 0; i < numToEmit; i++) {
        particles.push({
          x: W / 2,
          y: H - H * 0.1, // Emit from bottom center
          vx: (Math.random() - 0.5) * 10 * dpr,
          vy: -(Math.random() * 10 + 5) * dpr * bassEnergy,
          life: 1.0,
          color: `hsla(${primaryH}, ${primaryS}, ${50 + Math.random() * 30}%, 1)`,
          size: (Math.random() * 4 + 2) * dpr
        });
      }
    }

    // Update & draw
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      if (!p) continue;

      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2 * dpr; // Gravity
      p.life -= 0.015;

      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  }

  return { drawVisualizer };
}
