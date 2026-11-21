let audioCtx: AudioContext | null = null;
let analyserNode: AnalyserNode | null = null;
let sourceNode1: MediaElementAudioSourceNode | null = null;
let sourceNode2: MediaElementAudioSourceNode | null = null;
let crossfadeGain1: GainNode | null = null;
let crossfadeGain2: GainNode | null = null;
let masterGainNode: GainNode | null = null;
let dryGainNode: GainNode | null = null;
let wetGainNode: GainNode | null = null;
let spatialPannerNode: PannerNode | null = null;
let widenerDryGain: GainNode | null = null;
let widenerWetGain: GainNode | null = null;
let bassLowShelf: BiquadFilterNode | null = null;
let bassPeak: BiquadFilterNode | null = null;
let reverbInputNode: GainNode | null = null;
let reverbCombinerNode: GainNode | null = null;
let reverbConvolver: ConvolverNode | null = null;
let reverbDryGain: GainNode | null = null;
let reverbWetGain: GainNode | null = null;
let muffledFilter: BiquadFilterNode | null = null;
const impulseCache = new Map<string, AudioBuffer>();
let eqFilters: BiquadFilterNode[] = [];
let isConnected = false;

if (typeof window !== 'undefined') {
  const resume = () => {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => void 0);
    }
  };
  window.addEventListener('pointerdown', resume, { capture: true, passive: true });
  window.addEventListener('keydown', resume, { capture: true, passive: true });
}

function tryResumeAudioContext(): void {
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => void 0);
  }
}

const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

export function useAudioVisualizer() {
  function resumeAudioContext(): void {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => void 0);
    }
  }

  function connect(
    audioEl1: HTMLAudioElement,
    audioEl2: HTMLAudioElement,
    currentVolume: number
  ): AnalyserNode | null {
    if (!import.meta.client) return null;

    if (isConnected && analyserNode) {
      tryResumeAudioContext();
      return analyserNode;
    }

    try {
      if (!audioCtx) {
        audioCtx = new AudioContext({ latencyHint: 'playback' });
      }

      tryResumeAudioContext();

      if (!sourceNode1 && !sourceNode2) {
        sourceNode1 = audioCtx.createMediaElementSource(audioEl1);
        sourceNode2 = audioCtx.createMediaElementSource(audioEl2);
        analyserNode = audioCtx.createAnalyser();

        crossfadeGain1 = audioCtx.createGain();
        crossfadeGain2 = audioCtx.createGain();
        masterGainNode = audioCtx.createGain();

        analyserNode.fftSize = 512;
        analyserNode.smoothingTimeConstant = 0.85;

        sourceNode1.connect(crossfadeGain1);
        crossfadeGain1.connect(analyserNode);

        sourceNode2.connect(crossfadeGain2);
        crossfadeGain2.connect(analyserNode);

        // Karaoke Node Chain
        const karaokeInput = audioCtx.createGain();
        analyserNode.connect(karaokeInput);

        dryGainNode = audioCtx.createGain();
        dryGainNode.gain.value = 1;
        wetGainNode = audioCtx.createGain();
        wetGainNode.gain.value = 0;

        karaokeInput.connect(dryGainNode);

        spatialPannerNode = audioCtx.createPanner();
        spatialPannerNode.panningModel = 'HRTF';
        spatialPannerNode.distanceModel = 'inverse';
        spatialPannerNode.refDistance = 1;
        spatialPannerNode.maxDistance = 10000;
        spatialPannerNode.rolloffFactor = 1;

        if (audioCtx.listener.positionX) {
          audioCtx.listener.positionX.value = 0;
          audioCtx.listener.positionY.value = 0;
          audioCtx.listener.positionZ.value = 0;
        } else {
          audioCtx.listener.setPosition(0, 0, 0);
        }

        dryGainNode.connect(spatialPannerNode);
        wetGainNode.connect(spatialPannerNode);

        const widenerInput = audioCtx.createGain();
        spatialPannerNode.connect(widenerInput);

        widenerDryGain = audioCtx.createGain();
        widenerWetGain = audioCtx.createGain();
        widenerDryGain.gain.value = 1;
        widenerWetGain.gain.value = 0;

        const widenerSplitter = audioCtx.createChannelSplitter(2);
        const widenerMerger = audioCtx.createChannelMerger(2);

        const gainLL = audioCtx.createGain();
        const gainLR = audioCtx.createGain();
        const gainRR = audioCtx.createGain();
        const gainRL = audioCtx.createGain();

        gainLL.gain.value = 1.35;
        gainLR.gain.value = -0.35;
        gainRR.gain.value = 1.35;
        gainRL.gain.value = -0.35;

        widenerInput.connect(widenerDryGain);
        widenerInput.connect(widenerSplitter);

        widenerSplitter.connect(gainLL, 0);
        widenerSplitter.connect(gainLR, 0);
        widenerSplitter.connect(gainRR, 1);
        widenerSplitter.connect(gainRL, 1);

        gainLL.connect(widenerMerger, 0, 0);
        gainRL.connect(widenerMerger, 0, 0);
        gainRR.connect(widenerMerger, 0, 1);
        gainLR.connect(widenerMerger, 0, 1);

        widenerMerger.connect(widenerWetGain);

        const bassBoostInput = audioCtx.createGain();
        widenerDryGain.connect(bassBoostInput);
        widenerWetGain.connect(bassBoostInput);

        bassLowShelf = audioCtx.createBiquadFilter();
        bassLowShelf.type = 'lowshelf';
        bassLowShelf.frequency.value = 70;
        bassLowShelf.gain.value = 0;

        bassPeak = audioCtx.createBiquadFilter();
        bassPeak.type = 'peaking';
        bassPeak.frequency.value = 120;
        bassPeak.Q.value = 1.0;
        bassPeak.gain.value = 0;

        bassBoostInput.connect(bassLowShelf);
        bassLowShelf.connect(bassPeak);

        reverbInputNode = audioCtx.createGain();
        bassPeak.connect(reverbInputNode);

        reverbCombinerNode = audioCtx.createGain();
        reverbDryGain = audioCtx.createGain();
        reverbWetGain = audioCtx.createGain();
        reverbDryGain.gain.value = 1;
        reverbWetGain.gain.value = 0;

        reverbInputNode.connect(reverbDryGain);
        reverbDryGain.connect(reverbCombinerNode);
        reverbWetGain.connect(reverbCombinerNode);

        muffledFilter = audioCtx.createBiquadFilter();
        muffledFilter.type = 'lowpass';
        muffledFilter.frequency.value = 22050;
        muffledFilter.Q.value = 0.7;

        reverbCombinerNode.connect(muffledFilter);
        muffledFilter.connect(masterGainNode);

        const splitter = audioCtx.createChannelSplitter(2);
        karaokeInput.connect(splitter);

        const leftGain = audioCtx.createGain();
        leftGain.gain.value = 1;
        splitter.connect(leftGain, 0);

        const rightGain = audioCtx.createGain();
        rightGain.gain.value = -1;
        splitter.connect(rightGain, 1);

        const diffMono = audioCtx.createGain();
        leftGain.connect(diffMono);
        rightGain.connect(diffMono);

        const upmixMerger = audioCtx.createChannelMerger(2);
        diffMono.connect(upmixMerger, 0, 0);
        diffMono.connect(upmixMerger, 0, 1);

        upmixMerger.connect(wetGainNode);

        let prevNode: AudioNode = masterGainNode;
        eqFilters = [];

        EQ_FREQUENCIES.forEach((freq) => {
          const filter = (audioCtx as AudioContext).createBiquadFilter();
          filter.type = 'peaking';
          filter.frequency.value = freq;
          filter.Q.value = 1.41;
          filter.gain.value = 0;
          eqFilters.push(filter);

          prevNode.connect(filter);
          prevNode = filter;
        });

        prevNode.connect(audioCtx.destination);

        isConnected = true;
        setGains(1, 0, currentVolume, audioEl1, audioEl2);

        const playerStore = usePlayerStore();
        if (playerStore.isKaraoke) {
          setKaraoke(true);
        }
        setEqGains(playerStore.eqBands, playerStore.eqEnabled);
        setStereoWidener(playerStore.isStereoWidener);
        setBassBoost(playerStore.bassBoostEnabled);
        applyReverbPreset(playerStore.reverbPreset);

        startAudioReactiveLoop();
      }
    } catch {
      void 0;
    }

    return analyserNode;
  }

  function setGains(
    cf1: number,
    cf2: number,
    masterVol: number,
    audioEl1: HTMLAudioElement | null,
    audioEl2: HTMLAudioElement | null
  ) {
    if (isConnected && audioCtx && masterGainNode && crossfadeGain1 && crossfadeGain2) {
      masterGainNode.gain.value = Math.pow(masterVol, 3);
      crossfadeGain1.gain.value = cf1;
      crossfadeGain2.gain.value = cf2;
      if (audioEl1 && audioEl1.volume !== 1.0) audioEl1.volume = 1.0;
      if (audioEl2 && audioEl2.volume !== 1.0) audioEl2.volume = 1.0;
    } else {
      if (audioEl1) audioEl1.volume = cf1 * Math.pow(masterVol, 3);
      if (audioEl2) audioEl2.volume = cf2 * Math.pow(masterVol, 3);
    }
  }

  function setMasterVolume(vol: number) {
    if (!masterGainNode) return;
    masterGainNode.gain.value = vol;
  }

  function setEqGains(gains: number[], enabled: boolean) {
    if (!eqFilters.length) return;
    eqFilters.forEach((filter, index) => {
      // Smoothly transition gains using setTargetAtTime
      const targetGain = enabled ? (gains[index] ?? 0) : 0;
      if (audioCtx) {
        filter.gain.setTargetAtTime(targetGain, audioCtx.currentTime, 0.1);
      } else {
        filter.gain.value = targetGain;
      }
    });
  }

  function setKaraoke(enabled: boolean) {
    if (!dryGainNode || !wetGainNode) return;
    const now = audioCtx?.currentTime || 0;
    dryGainNode.gain.cancelScheduledValues(now);
    wetGainNode.gain.cancelScheduledValues(now);
    dryGainNode.gain.setValueAtTime(enabled ? 0 : 1, now);
    wetGainNode.gain.setValueAtTime(enabled ? 1 : 0, now);
  }

  function setStereoWidener(enabled: boolean) {
    if (!audioCtx || !widenerDryGain || !widenerWetGain) return;
    const now = audioCtx.currentTime;
    widenerDryGain.gain.setTargetAtTime(enabled ? 0 : 1, now, 0.08);
    widenerWetGain.gain.setTargetAtTime(enabled ? 1 : 0, now, 0.08);
  }

  function setBassBoost(enabled: boolean) {
    if (!audioCtx || !bassLowShelf || !bassPeak) return;
    const now = audioCtx.currentTime;
    bassLowShelf.gain.setTargetAtTime(enabled ? 8.5 : 0, now, 0.1);
    bassPeak.gain.setTargetAtTime(enabled ? 3.5 : 0, now, 0.1);
  }

  function getOrCreateImpulse(ctx: AudioContext, preset: string): AudioBuffer {
    const cached = impulseCache.get(preset);
    if (cached) return cached;

    let duration = 2.5;
    let decay = 2.0;
    let damping = 0.45;

    if (preset === 'room') {
      duration = 1.0;
      decay = 3.2;
      damping = 0.35;
    } else if (preset === 'hall') {
      duration = 2.4;
      decay = 2.0;
      damping = 0.45;
    } else if (preset === 'cathedral') {
      duration = 4.2;
      decay = 1.2;
      damping = 0.55;
    } else if (preset === 'shower') {
      duration = 1.2;
      decay = 3.5;
      damping = 0.15;
    } else if (preset === 'muffled') {
      duration = 2.0;
      decay = 2.0;
      damping = 0.65;
    }

    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(2, length, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    let lastLeft = 0;
    let lastRight = 0;

    for (let i = 0; i < length; i++) {
      const progress = i / length;
      const env = Math.exp(-progress * decay * 3.5);

      const noiseL = (Math.random() * 2 - 1) * env;
      const noiseR = (Math.random() * 2 - 1) * env;

      lastLeft = lastLeft * damping + noiseL * (1 - damping);
      lastRight = lastRight * damping + noiseR * (1 - damping);

      left[i] = lastLeft;
      right[i] = lastRight;
    }

    impulseCache.set(preset, buffer);
    return buffer;
  }

  function applyReverbPreset(preset: string) {
    if (
      !audioCtx ||
      !reverbInputNode ||
      !reverbCombinerNode ||
      !reverbDryGain ||
      !reverbWetGain ||
      !muffledFilter
    ) {
      return;
    }
    const now = audioCtx.currentTime;

    if (preset === 'none') {
      if (reverbConvolver) {
        try {
          reverbConvolver.disconnect();
        } catch {
          void 0;
        }
      }
      reverbInputNode.disconnect();
      reverbInputNode.connect(reverbDryGain);
      reverbDryGain.gain.setTargetAtTime(1.0, now, 0.05);
      reverbWetGain.gain.setTargetAtTime(0.0, now, 0.05);
      muffledFilter.frequency.setTargetAtTime(22050, now, 0.05);
      return;
    }

    const impulse = getOrCreateImpulse(audioCtx, preset);
    if (reverbConvolver) {
      try {
        reverbConvolver.disconnect();
      } catch {
        void 0;
      }
    }
    reverbInputNode.disconnect();
    reverbInputNode.connect(reverbDryGain);

    reverbConvolver = audioCtx.createConvolver();
    reverbConvolver.normalize = true;
    reverbConvolver.buffer = impulse;
    reverbInputNode.connect(reverbConvolver);
    reverbConvolver.connect(reverbWetGain);

    let dry = 1.0;
    let wet = 0.28;
    let cutoff = 22050;

    if (preset === 'room') {
      dry = 1.0;
      wet = 0.2;
    } else if (preset === 'hall') {
      dry = 0.95;
      wet = 0.3;
    } else if (preset === 'cathedral') {
      dry = 0.85;
      wet = 0.42;
    } else if (preset === 'shower') {
      dry = 1.0;
      wet = 0.3;
    } else if (preset === 'muffled') {
      dry = 0.05;
      wet = 0.5;
      cutoff = 420;
    }

    reverbDryGain.gain.setTargetAtTime(dry, now, 0.05);
    reverbWetGain.gain.setTargetAtTime(wet, now, 0.05);
    muffledFilter.frequency.setTargetAtTime(cutoff, now, 0.05);
  }

  let rAFId: number | null = null;
  const dataArray = new Uint8Array(512);
  let smoothedBass = 0;
  let lastSetBass = '';
  let cachedPlayerStore: ReturnType<typeof usePlayerStore> | null = null;

  function startAudioReactiveLoop() {
    if (rAFId) return;
    cachedPlayerStore = usePlayerStore();
    function loop() {
      if (analyserNode && isConnected) {
        let rawBass = 0;

        if (cachedPlayerStore?.isPlaying) {
          analyserNode.getByteFrequencyData(dataArray);

          let bassSum = 0;
          const bassBins = 8;
          for (let i = 0; i < bassBins; i++) {
            bassSum += dataArray[i] ?? 0;
          }
          rawBass = bassSum / bassBins / 255;
          rawBass = Math.pow(rawBass, 1.5);
        }

        if (rawBass > smoothedBass) {
          smoothedBass = rawBass;
        } else {
          smoothedBass = smoothedBass * 0.7 + rawBass * 0.3;
        }

        if (smoothedBass < 0.001) {
          smoothedBass = 0;
        }

        const bassRounded = Math.round(smoothedBass * 1000) / 1000;
        const bassString = bassRounded.toString();
        if (bassString !== lastSetBass) {
          document.documentElement.style.setProperty('--audio-bass', bassString);
          lastSetBass = bassString;
        }

        if (spatialPannerNode) {
          if (cachedPlayerStore?.isSpatialAudio) {
            const speed = 2000;
            const t = performance.now() / speed;
            const x = Math.sin(t) * 2;
            const z = Math.cos(t) * 2;

            if (spatialPannerNode.positionX) {
              const now = audioCtx?.currentTime ?? 0;
              spatialPannerNode.positionX.setTargetAtTime(x, now, 0.1);
              spatialPannerNode.positionZ.setTargetAtTime(z, now, 0.1);
            } else {
              spatialPannerNode.setPosition(x, 0, z);
            }
          } else {
            if (spatialPannerNode.positionX) {
              const now = audioCtx?.currentTime ?? 0;
              spatialPannerNode.positionX.setTargetAtTime(0, now, 0.1);
              spatialPannerNode.positionZ.setTargetAtTime(-1, now, 0.1);
            } else {
              spatialPannerNode.setPosition(0, 0, -1);
            }
          }
        }
      }
      rAFId = requestAnimationFrame(loop);
    }
    loop();
  }

  return {
    connect,
    setGains,
    setMasterVolume,
    setKaraoke,
    setEqGains,
    setStereoWidener,
    setBassBoost,
    applyReverbPreset,
    isConnected,
    startAudioReactiveLoop,
    resumeAudioContext
  };
}
