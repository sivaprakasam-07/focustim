let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Plays a peaceful multi-frequency chime chord (zen bell) when a session completes.
 */
export function playCompletionChime(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Harmonic frequencies for a serene singing bowl chord: E5, B5, E6
    const frequencies = [659.25, 987.77, 1318.51];

    frequencies.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = index === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + index * 0.08);

      // Gentle attack and long natural exponential decay
      const attackTime = 0.04;
      const decayTime = 2.4 - index * 0.3;

      gain.gain.setValueAtTime(0.0001, now + index * 0.08);
      gain.gain.linearRampToValueAtTime(0.28 / (index + 1), now + index * 0.08 + attackTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.08 + decayTime);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + index * 0.08);
      osc.stop(now + index * 0.08 + decayTime);
    });
  } catch (error) {
    console.warn('Audio playback error:', error);
  }
}

/**
 * Plays a subtle tactile UI click for button interactions.
 */
export function playUiClick(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  } catch {
    // Ignore audio click failures
  }
}

/**
 * Triggers haptic vibration if supported by device/browser.
 */
export function triggerHaptic(pattern: number | number[] = 40): void {
  try {
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    // Ignore vibration failure
  }
}

/**
 * Completion celebration vibration: [200ms vibe, 100ms rest, 200ms vibe, 100ms rest, 300ms vibe]
 */
export function triggerCompletionVibration(): void {
  triggerHaptic([200, 100, 200, 100, 300]);
}
