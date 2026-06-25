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

        // Karaoke Crossover (Highpass for vocal removal, Lowpass for bass preservation)
        const highpass = audioCtx.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.value = 200;
        karaokeInput.connect(highpass);

        const lowpass = audioCtx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.value = 200;
        karaokeInput.connect(lowpass);
        lowpass.connect(wetGainNode); // Bass bypasses the vocal remover

        // Vocal Remover (L - R) applied only to high frequencies
        const splitter = audioCtx.createChannelSplitter(2);
        highpass.connect(splitter);

        const leftGain = audioCtx.createGain();
        leftGain.gain.value = 1;
        splitter.connect(leftGain, 0);

        const rightGain = audioCtx.createGain();
        rightGain.gain.value = -1;
        splitter.connect(rightGain, 1);

        const vocalRemovedMono = audioCtx.createGain();
        // Boost the remaining side signal slightly since we lose a lot of energy
        vocalRemovedMono.gain.value = 1.5;
        leftGain.connect(vocalRemovedMono);
        rightGain.connect(vocalRemovedMono);

        const upmixMerger = audioCtx.createChannelMerger(2);
        vocalRemovedMono.connect(upmixMerger, 0, 0);
        vocalRemovedMono.connect(upmixMerger, 0, 1);
        upmixMerger.connect(wetGainNode);

        masterGainNode.connect(audioCtx.destination);

        isConnected = true;
        setGains(1, 0, currentVolume, audioEl1, audioEl2);

        // Restore karaoke state if it was enabled
        const playerStore = usePlayerStore();
        if (playerStore.isKaraoke) {
          setKaraoke(true);
        }
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

  return { connect, setGains, setKaraoke, isConnected };
}
