export function playGentleChime(enabled: boolean): void {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc2.frequency.setValueAtTime(659.25, now + 0.08); // E5

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now + 0.08);
    osc1.stop(now + 0.6);
    osc2.stop(now + 0.6);
  } catch {
    // Ignore audio context restrictions
  }
}

export function playCountdownTick(enabled: boolean, finalBeat = false): void {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(finalBeat ? 783.99 : 440, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(finalBeat ? 0.1 : 0.04, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (finalBeat ? 0.45 : 0.15));
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + (finalBeat ? 0.5 : 0.18));
  } catch {
    // ignore
  }
}

export function triggerGentleVibration(enabled: boolean, pattern: number | number[] = 18): void {
  if (!enabled || typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // ignore
  }
}
