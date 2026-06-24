let audioCtx: AudioContext | null = null;
let analyserNode: AnalyserNode | null = null;
let sourceNode: MediaElementAudioSourceNode | null = null;
let gainNode: GainNode | null = null;
let isConnected = false;

export function useAudioVisualizer() {
  function connect(audioEl: HTMLAudioElement, currentVolume: number): AnalyserNode | null {
    if (!import.meta.client) return null;

    try {
      if (!audioCtx) {
        audioCtx = new AudioContext();
      }

      if (audioCtx.state === 'suspended') {
        void audioCtx.resume();
      }

      if (!sourceNode) {
        sourceNode = audioCtx.createMediaElementSource(audioEl);
        analyserNode = audioCtx.createAnalyser();
        gainNode = audioCtx.createGain();

        analyserNode.fftSize = 512;
        analyserNode.smoothingTimeConstant = 0.85;

        sourceNode.connect(analyserNode);
        analyserNode.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        isConnected = true;
      }

      // Ensure audio element is at max volume, and gain node handles the actual volume
      if (gainNode) {
        gainNode.gain.value = Math.pow(currentVolume, 3);
        audioEl.volume = 1.0;
      }
    } catch {
      // Audio element already connected or Web Audio not available
    }

    return analyserNode;
  }

  function setGain(vol: number, audioEl: HTMLAudioElement | null) {
    if (isConnected && gainNode) {
      // Web Audio handles volume
      gainNode.gain.value = Math.pow(vol, 3);
      if (audioEl && audioEl.volume !== 1.0) {
        audioEl.volume = 1.0;
      }
    } else if (audioEl) {
      // Standard HTML5 audio handles volume
      audioEl.volume = Math.pow(vol, 3);
    }
  }

  return { connect, setGain, isConnected };
}
