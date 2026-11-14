let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

function beep(freq: number, offset: number, duration: number, gainPeak: number) {
  const ctx = getAudioContext();
  if (!ctx) return;
  const start = ctx.currentTime + offset;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainPeak, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

export function playTac() {
  try {
    if ("vibrate" in navigator) navigator.vibrate(40);
    beep(1200, 0, 0.08, 0.2);
  } catch {
    // audio/vibration unavailable — ignore
  }
}

export function playStrongAlert() {
  try {
    if ("vibrate" in navigator) navigator.vibrate([250, 120, 250, 120, 500]);
    beep(880, 0, 0.2, 0.4);
    beep(1174.66, 0.28, 0.32, 0.5);
  } catch {
    // audio/vibration unavailable — ignore
  }
}
