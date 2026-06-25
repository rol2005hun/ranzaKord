let audioCtx: AudioContext | null = null;
let analyserNode: AnalyserNode | null = null;
let sourceNode1: MediaElementAudioSourceNode | null = null;
let sourceNode2: MediaElementAudioSourceNode | null = null;
let crossfadeGain1: GainNode | null = null;
let crossfadeGain2: GainNode | null = null;
let masterGainNode: GainNode | null = null;
let dryGainNode: GainNode | null = null;
let wetGainNode: GainNode | null = null;
let isConnected = false;

export function useAudioVisualizer() {
  function connect(
    audioEl1: HTMLAudioElement,
    audioEl2: HTMLAudioElement,
    currentVolume: number
  ): AnalyserNode | null {
    if (!import.meta.client) return null;

    try {
      if (!audioCtx) {
        audioCtx = new AudioContext();
      }

      if (audioCtx.state === 'suspended') {
        void audioCtx.resume();
      }

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
        dryGainNode.connect(masterGainNode);
        wetGainNode.connect(masterGainNode);

        // --- Pure Phase Cancellation (L - R) Vocal Remover ---
        // Filters cause phase distortion (comb filtering) when summed.
        // We revert to a pure mathematical L-R subtraction to avoid any distortion.
        const splitter = audioCtx.createChannelSplitter(2);
        karaokeInput.connect(splitter);

        const leftGain = audioCtx.createGain();
        leftGain.gain.value = 1;
        splitter.connect(leftGain, 0); // L

        const rightGain = audioCtx.createGain();
        rightGain.gain.value = -1;
        splitter.connect(rightGain, 1); // R

        // Sum L and -R
        const diffMono = audioCtx.createGain();
        leftGain.connect(diffMono);
        rightGain.connect(diffMono);

        // Upmix the L-R mono signal to both ears
        const upmixMerger = audioCtx.createChannelMerger(2);
        diffMono.connect(upmixMerger, 0, 0);
        diffMono.connect(upmixMerger, 0, 1);

        upmixMerger.connect(wetGainNode);

        masterGainNode.connect(audioCtx.destination);

        isConnected = true;
        setGains(1, 0, currentVolume, audioEl1, audioEl2);

        // Restore karaoke state if it was enabled
        const playerStore = usePlayerStore();
        if (playerStore.isKaraoke) {
          setKaraoke(true);
        }

        // Start continuous background loop for CSS variables (--audio-bass)
        startAudioReactiveLoop();
      }
    } catch {
      // Audio element already connected or Web Audio not available
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

  function setKaraoke(enabled: boolean) {
    if (!dryGainNode || !wetGainNode) return;
    const now = audioCtx?.currentTime || 0;
    dryGainNode.gain.cancelScheduledValues(now);
    wetGainNode.gain.cancelScheduledValues(now);
    dryGainNode.gain.setValueAtTime(enabled ? 0 : 1, now);
    wetGainNode.gain.setValueAtTime(enabled ? 1 : 0, now);
    console.log(
      'Karaoke mode set to:',
      enabled,
      'dryGain:',
      dryGainNode.gain.value,
      'wetGain:',
      wetGainNode.gain.value
    );
  }

  let rAFId: number | null = null;
  const dataArray = new Uint8Array(512);

  function startAudioReactiveLoop() {
    if (rAFId) return;
    function loop() {
      if (analyserNode && isConnected) {
        analyserNode.getByteFrequencyData(dataArray);

        let bassSum = 0;
        const bassBins = 8; // First 8 bins (~0-300Hz)
        for (let i = 0; i < bassBins; i++) {
          bassSum += dataArray[i] ?? 0;
        }
        // Normalize 0..1 and apply a slight curve to make it punchier
        let bassAvg = bassSum / bassBins / 255;
        bassAvg = Math.pow(bassAvg, 1.5);

        document.documentElement.style.setProperty('--audio-bass', bassAvg.toString());
      }
      rAFId = requestAnimationFrame(loop);
    }
    loop();
  }

  return { connect, setGains, setKaraoke, isConnected, startAudioReactiveLoop };
}
