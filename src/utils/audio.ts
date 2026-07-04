// 8-bit Sound Synthesizer using Web Audio API
// No assets required, lightweight and fully portable!

let audioCtx: AudioContext | null = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playSound(type: 'coin' | 'hit' | 'jump' | 'win' | 'laser' | 'alert') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (type) {
      case 'coin':
        // High 8-bit coin sound (two quick pitches)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(880.00, now + 0.08); // A5
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
        break;

      case 'hit':
        // Low retro noise crash sound
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(10, now + 0.3);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;

      case 'jump':
        // Pitch slide upward
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(450, now + 0.15);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;

      case 'laser':
        // Pitch slide downward (shooting)
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.2);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;

      case 'alert':
        // Sharp beep warning
        osc.type = 'square';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.setValueAtTime(800, now + 0.1);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
        break;

      case 'win':
        // Happy arpeggio
        const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
        notes.forEach((freq, i) => {
          const singleOsc = ctx.createOscillator();
          const singleGain = ctx.createGain();
          singleOsc.connect(singleGain);
          singleGain.connect(ctx.destination);
          
          singleOsc.type = 'sine';
          singleOsc.frequency.setValueAtTime(freq, now + i * 0.1);
          singleGain.gain.setValueAtTime(0.06, now + i * 0.1);
          singleGain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.4);
          
          singleOsc.start(now + i * 0.1);
          singleOsc.stop(now + i * 0.1 + 0.45);
        });
        break;
    }
  } catch (error) {
    console.warn('Web Audio play failed (requires user gesture):', error);
  }
}
