let audioCtx: AudioContext | null = null;
let ringTimer: ReturnType<typeof setTimeout> | null = null;
let ringing = false;

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

/** Resume AudioContext after a user gesture (Start break). */
export function unlockBreakAudio() {
  const ctx = getAudioContext();
  if (ctx?.state === "suspended") void ctx.resume();
}

function scheduleBurst(ctx: AudioContext, at: number) {
  const tones: Array<{ t: number; freq: number }> = [
    { t: at, freq: 880 },
    { t: at + 0.18, freq: 700 },
    { t: at + 0.36, freq: 880 },
    { t: at + 0.54, freq: 700 },
  ];
  for (const { t, freq } of tones) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.16);
  }
}

function playOneCycle(ctx: AudioContext) {
  const now = ctx.currentTime;
  scheduleBurst(ctx, now);
  scheduleBurst(ctx, now + 1.1);
}

const CYCLE_MS = 2_400;

/**
 * Alarm-style double ring that loops until stopBreakDoneRing().
 */
export function startBreakDoneRing() {
  const ctx = getAudioContext();
  if (!ctx) return;

  stopBreakDoneRing();
  ringing = true;

  const tick = () => {
    if (!ringing) return;
    playOneCycle(ctx);
    ringTimer = window.setTimeout(tick, CYCLE_MS);
  };

  const begin = () => {
    if (!ringing) return;
    tick();
  };

  if (ctx.state === "suspended") {
    void ctx.resume().then(begin).catch(() => {});
  } else {
    begin();
  }
}

export function stopBreakDoneRing() {
  ringing = false;
  if (ringTimer != null) {
    window.clearTimeout(ringTimer);
    ringTimer = null;
  }
}
