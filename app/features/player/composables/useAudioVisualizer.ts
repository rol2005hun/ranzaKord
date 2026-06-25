let audioCtx: AudioContext | null = null;
let analyserNode: AnalyserNode | null = null;
let sourceNode1: MediaElementAudioSourceNode | null = null;
let sourceNode2: MediaElementAudioSourceNode | null = null;
let crossfadeGain1: GainNode | null = null;
let crossfadeGain2: GainNode | null = null;
let masterGainNode: GainNode | null = null;
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

        analyserNode.connect(masterGainNode);
        masterGainNode.connect(audioCtx.destination);

        isConnected = true;
        setGains(1, 0, currentVolume, audioEl1, audioEl2);
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

  return { connect, setGains, isConnected };
}
