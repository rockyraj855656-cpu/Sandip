/**
 * Web Audio API synthesizer for futuristic JARVIS holographic sound effects
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playJarvisBootSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.exponentialRampToValueAtTime(880, now + 0.35);

  gain.gain.setValueAtTime(0.01, now);
  gain.gain.linearRampToValueAtTime(0.15, now + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.4);
}

export function playListeningBeep(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(740, now);
  osc.frequency.setValueAtTime(987, now + 0.08);

  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.2);
}

export function playActionSuccessChime(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  
  [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = now + idx * 0.06;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start);

    gain.gain.setValueAtTime(0.08, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(start + 0.26);
  });
}

export function playArmClockPulse(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(1400, now);
  osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);

  gain.gain.setValueAtTime(0.03, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.05);
}

let alarmOsc: OscillatorNode | null = null;
let alarmGain: GainNode | null = null;
let alarmInterval: any = null;

export function startAlarmBuzzer(): void {
  stopAlarmBuzzer();
  const ctx = getAudioContext();
  if (!ctx) return;

  let state = false;
  alarmInterval = setInterval(() => {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(state ? 880 : 660, now);
    state = !state;

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.26);
  }, 350);
}

export function stopAlarmBuzzer(): void {
  if (alarmInterval) {
    clearInterval(alarmInterval);
    alarmInterval = null;
  }
}
