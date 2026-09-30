/* =========================================================
   EGYPT GLOW - AUDIO ENGINE (Web Audio API)
   Synthesized Egyptian ambient music, dynamic reel spins,
   landing thuds, win chimes, fanfare tiers, and UI sounds.
   ========================================================= */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.musicPlaying = false;
    this.spinNoiseNode = null;
    this.spinGainNode = null;
    this.musicTimeout = null;
  }

  init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    this.ctx = new AudioCtx();
  }

  unlock() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.spinGainNode && this.muted) {
      this.spinGainNode.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    return this.muted;
  }

  playClick() {
    if (this.muted) return;
    this.unlock();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  playReelStop() {
    if (this.muted) return;
    this.unlock();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.09);
    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.09);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.09);
  }

  playWinChime(count = 1) {
    if (this.muted) return;
    this.unlock();
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    notes.slice(0, Math.min(notes.length, count + 2)).forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);
      gain.gain.setValueAtTime(0.25, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.35);
    });
  }

  playCascade() {
    if (this.muted) return;
    this.unlock();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(950, now + 0.2);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  playWinTierFanfare(tierName) {
    if (this.muted) return;
    this.unlock();
    const now = this.ctx.currentTime;

    let scale = [440, 554.37, 659.25, 880, 1108.73];
    if (tierName === 'Mega Win' || tierName === 'Epic Win' || tierName === 'Legendary Win') {
      scale = [330, 440, 554.37, 659.25, 880, 1108.73, 1318.51, 1760];
    }

    scale.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);
      gain.gain.setValueAtTime(0.35, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.6);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.6);
    });
  }

  playBonusTrigger() {
    if (this.muted) return;
    this.unlock();
    const now = this.ctx.currentTime;
    [220, 330, 440, 554.37, 659.25, 880].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.2, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.5);
    });
  }

  playLevelUp() {
    if (this.muted) return;
    this.unlock();
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      gain.gain.setValueAtTime(0.3, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.4);
    });
  }

  startSpinLoop() {
    if (this.muted) return;
    this.unlock();
    if (this.spinNoiseNode) return;
    const bufferSize = this.ctx.sampleRate * 0.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    this.spinNoiseNode = this.ctx.createBufferSource();
    this.spinNoiseNode.buffer = buffer;
    this.spinNoiseNode.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 450;

    this.spinGainNode = this.ctx.createGain();
    this.spinGainNode.gain.setValueAtTime(0.12, this.ctx.currentTime);

    this.spinNoiseNode.connect(filter);
    filter.connect(this.spinGainNode);
    this.spinGainNode.connect(this.ctx.destination);
    this.spinNoiseNode.start();
  }

  stopSpinLoop() {
    if (this.spinNoiseNode) {
      try { this.spinNoiseNode.stop(); } catch(e){}
      this.spinNoiseNode.disconnect();
      this.spinNoiseNode = null;
    }
  }

  startMusic() {
    if (this.musicPlaying) return;
    this.unlock();
    this.musicPlaying = true;

    const drone = this.ctx.createOscillator();
    const droneGain = this.ctx.createGain();
    drone.type = 'sawtooth';
    drone.frequency.value = 110;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 240;

    droneGain.gain.value = 0.04;
    drone.connect(filter);
    filter.connect(droneGain);
    droneGain.connect(this.ctx.destination);
    drone.start();

    const scale = [220, 233.08, 277.18, 293.66, 329.63, 349.23, 392.00];
    let noteIndex = 0;

    const playNextNote = () => {
      if (!this.musicPlaying) return;
      if (!this.muted && this.ctx) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        const freq = scale[noteIndex % scale.length];
        noteIndex += Math.floor(Math.random() * 3) + 1;

        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.035, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.6);
      }
      this.musicTimeout = setTimeout(playNextNote, 600 + Math.random() * 800);
    };

    playNextNote();
  }
}

window.soundEngine = new SoundEngine();
