let audioCtx: AudioContext | null = null;
let limiter: DynamicsCompressorNode | null = null;

// ---------------------------------------------------------------------------
// Alarm volume (0..1), persisted per device. Applies to the in-app Web Audio
// alarm and the countdown ticks — system notification volume is controlled by
// the phone and cannot be changed from a web app.
// ---------------------------------------------------------------------------
const VOLUME_KEY = "statfit-alarm-volume";
const DEFAULT_VOLUME = 1;
const volumeListeners = new Set<() => void>();
let volume = DEFAULT_VOLUME;

function readStoredVolume(): number {
  if (typeof window === "undefined" || !window.localStorage) return DEFAULT_VOLUME;
  try {
    const raw = window.localStorage.getItem(VOLUME_KEY);
    if (raw === null) return DEFAULT_VOLUME;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return DEFAULT_VOLUME;
    return Math.min(1, Math.max(0, parsed));
  } catch {
    return DEFAULT_VOLUME;
  }
}

volume = readStoredVolume();

export function getAlarmVolume(): number {
  return volume;
}

export function setAlarmVolume(next: number): void {
  const clamped = Number.isFinite(next) ? Math.min(1, Math.max(0, next)) : DEFAULT_VOLUME;
  if (clamped === volume) return;
  volume = clamped;
  try {
    window.localStorage.setItem(VOLUME_KEY, String(clamped));
  } catch {
    // storage unavailable — keep the in-memory value
  }
  volumeListeners.forEach((notify) => notify());
}

/** For useSyncExternalStore. */
export function subscribeAlarmVolume(onStoreChange: () => void): () => void {
  volumeListeners.add(onStoreChange);
  return () => {
    volumeListeners.delete(onStoreChange);
  };
}

/** Short two-note blip so the level can be previewed while adjusting it. */
export function playVolumePreview(): void {
  beep(880, 0, 0.14, 0.5);
  beep(1318.5, 0.18, 0.2, 0.5);
}

function getAudioContext(): AudioContext | null {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === "suspended") {
      void audioCtx.resume().catch(() => {
        // no user gesture yet — will be retried on the next call
      });
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Every tone is routed through a compressor so it can be driven hard
 * (near full scale) without clipping — that is what makes the alarm as
 * loud as a phone ringtone.
 */
function getOutput(): { ctx: AudioContext; out: AudioNode } | null {
  const ctx = getAudioContext();
  if (!ctx) return null;
  if (!limiter) {
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 14;
    comp.ratio.value = 14;
    comp.attack.value = 0.003;
    comp.release.value = 0.3;
    comp.connect(ctx.destination);
    limiter = comp;
  }
  return { ctx, out: limiter };
}

function tone(
  delay: number,
  freq: number,
  duration: number,
  gainPeak: number,
  type: OscillatorType = "sine"
) {
  const peak = gainPeak * volume;
  // Muted — don't start an oscillator at all (a 0 gain ramp is invalid).
  if (peak < 0.002) return;
  const io = getOutput();
  if (!io) return;
  const { ctx, out } = io;
  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.012);
  gain.gain.setValueAtTime(peak, start + Math.max(0.02, duration - 0.04));
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(out);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function beep(freq: number, offset: number, duration: number, gainPeak: number) {
  tone(offset, freq, duration, gainPeak, "sine");
}

let keepAlive: { osc: OscillatorNode; gain: GainNode } | null = null;

/**
 * Starts a near-silent oscillator so the page counts as "playing audio".
 * Chrome never freezes or intensively throttles a page that is playing
 * audio, which keeps our wall-clock timer ticking while the screen is off —
 * so the alarm fires at the right moment instead of when the display is
 * turned back on. The output is ~1 Hz at -66 dB, i.e. inaudible.
 */
export function startSilentKeepAlive() {
  if (keepAlive) return;
  const io = getOutput();
  if (!io) return;
  try {
    const { ctx, out } = io;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 1;
    gain.gain.value = 0.0005;
    osc.connect(gain).connect(out);
    osc.start();
    keepAlive = { osc, gain };
  } catch {
    keepAlive = null;
  }
}

export function stopSilentKeepAlive() {
  if (!keepAlive) return;
  const { osc, gain } = keepAlive;
  keepAlive = null;
  try {
    osc.stop();
    osc.disconnect();
    gain.disconnect();
  } catch {
    // already stopped — ignore
  }
}

export function playTac() {
  try {
    if ("vibrate" in navigator) navigator.vibrate(40);
    beep(1200, 0, 0.08, 0.2);
  } catch {
    // audio/vibration unavailable — ignore
  }
}

/**
 * Loud ringtone-style alarm: two rising triple-beeps plus a final long
 * blast, with a matching vibration pattern.
 */
export function playStrongAlert() {
  try {
    if ("vibrate" in navigator) navigator.vibrate([500, 150, 500, 150, 700]);
  } catch {
    // vibration unavailable — ignore
  }
  const notes: Array<[number, number, number]> = [
    // [delay (s), frequency (Hz), duration (s)]
    [0.0, 988, 0.18],
    [0.2, 1319, 0.18],
    [0.4, 1568, 0.24],
    [0.85, 988, 0.18],
    [1.05, 1319, 0.18],
    [1.25, 1568, 0.24],
    [1.8, 1568, 0.55],
    [2.45, 1319, 0.55],
  ];
  for (const [delay, freq, duration] of notes) {
    tone(delay, freq, duration, 0.85, "square");
    tone(delay, freq, duration, 0.45, "sine");
  }
}
