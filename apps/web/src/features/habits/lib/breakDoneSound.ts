let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let ringTimer: ReturnType<typeof setTimeout> | null = null;
let stopAtTimer: ReturnType<typeof setTimeout> | null = null;
let ringing = false;
/** Bumped on every stop so in-flight resume/start callbacks cannot restart audio. */
let ringGeneration = 0;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  return audioCtx;
}

function getMasterGain(ctx: AudioContext): GainNode {
  if (!masterGain || masterGain.context !== ctx) {
    masterGain = ctx.createGain();
    masterGain.gain.value = 1;
    masterGain.connect(ctx.destination);
  }
  return masterGain;
}

/** Resume AudioContext after a user gesture (Start break / timer). */
export function unlockBreakAudio() {
  const ctx = getAudioContext();
  if (ctx?.state === "suspended") void ctx.resume();
}

function scheduleBurst(ctx: AudioContext, gain: GainNode, at: number) {
  const tones: Array<{ t: number; freq: number }> = [
    { t: at, freq: 880 },
    { t: at + 0.18, freq: 700 },
    { t: at + 0.36, freq: 880 },
    { t: at + 0.54, freq: 700 },
  ];
  for (const { t, freq } of tones) {
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    oscGain.gain.setValueAtTime(0.0001, t);
    oscGain.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
    osc.connect(oscGain);
    oscGain.connect(gain);
    osc.start(t);
    osc.stop(t + 0.16);
  }
}

function playOneCycle(ctx: AudioContext, gain: GainNode) {
  const now = ctx.currentTime;
  scheduleBurst(ctx, gain, now);
  scheduleBurst(ctx, gain, now + 1.1);
}

const CYCLE_MS = 2_400;

function beginRingLoop(ctx: AudioContext, generation: number) {
  const gain = getMasterGain(ctx);
  // Restore audible level for a fresh ring (stop mutes instantly).
  gain.gain.cancelScheduledValues(ctx.currentTime);
  gain.gain.setValueAtTime(1, ctx.currentTime);

  const tick = () => {
    if (!ringing || generation !== ringGeneration) return;
    playOneCycle(ctx, gain);
    ringTimer = window.setTimeout(tick, CYCLE_MS);
  };

  const begin = () => {
    if (!ringing || generation !== ringGeneration) return;
    tick();
  };

  if (ctx.state === "suspended") {
    void ctx.resume().then(begin).catch(() => {});
  } else {
    begin();
  }
}

/**
 * Alarm-style double ring that loops until stopBreakDoneRing().
 */
export function startBreakDoneRing() {
  const ctx = getAudioContext();
  if (!ctx) return;

  stopBreakDoneRing();
  ringing = true;
  const generation = ringGeneration;
  beginRingLoop(ctx, generation);
}

/**
 * Same alarm as break-done, but auto-silences after maxMs (AFK-safe).
 */
export function startTimedRing(maxMs = 30_000) {
  const ctx = getAudioContext();
  if (!ctx) return;

  stopBreakDoneRing();
  ringing = true;
  const generation = ringGeneration;
  beginRingLoop(ctx, generation);
  stopAtTimer = window.setTimeout(() => {
    if (generation === ringGeneration) stopBreakDoneRing();
  }, maxMs);
}

/** Instant silence — kills scheduled oscillators via master gain. */
export function stopBreakDoneRing() {
  ringing = false;
  ringGeneration += 1;
  if (ringTimer != null) {
    window.clearTimeout(ringTimer);
    ringTimer = null;
  }
  if (stopAtTimer != null) {
    window.clearTimeout(stopAtTimer);
    stopAtTimer = null;
  }
  if (masterGain && audioCtx) {
    const now = audioCtx.currentTime;
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setValueAtTime(0, now);
  }
}

export function isRinging() {
  return ringing;
}
