let actx = null, master = null;
let muted = localStorage.getItem('algc_mute') === '1';

export function audioInit() {
  if (actx) return;
  try {
    actx = new (window.AudioContext || window.webkitAudioContext)();
    master = actx.createGain();
    master.gain.value = 0.5;
    master.connect(actx.destination);
  } catch (e) {}
}

export function setMuted(val) {
  muted = val;
  localStorage.setItem('algc_mute', val ? '1' : '0');
}

export function isMuted() { return muted; }

function tone(freq, t0, dur, type = 'sine', vol = 0.22) {
  if (!actx || muted) return;
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = type; o.frequency.value = freq;
  const t = actx.currentTime + t0;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
}

export const SFX = {
  eat:   () => { tone(520, 0, 0.09, 'triangle', 0.18); tone(780, 0.04, 0.08, 'sine', 0.12); },
  op:    () => { tone(360, 0, 0.1, 'square', 0.12); },
  solve: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.07, 0.16, 'triangle', 0.2)); },
  error: () => { tone(200, 0, 0.18, 'sawtooth', 0.16); tone(150, 0.06, 0.2, 'sawtooth', 0.14); },
  erase: () => { tone(300, 0, 0.12, 'sine', 0.14); tone(220, 0.06, 0.12, 'sine', 0.12); },
  level: () => { [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.1, 0.22, 'triangle', 0.22)); },
  over:  () => { [440, 330, 247, 196].forEach((f, i) => tone(f, i * 0.13, 0.28, 'sine', 0.2)); }
};
