/* =========================================================
   EGYPT GLOW V2 - AUDIO SYNTHESIZER & SOUND MANAGER
   Procedural Web Audio API sound synthesis with fallback
   ========================================================= */

import { globalEventBus } from '../game/eventBus.js';
import { gameState } from '../game/gameState.js';

export class V2AudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.ambientOsc = null;

    this.bindEvents();
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    } catch (e) {
      console.warn('[V2AudioEngine] Web Audio API not supported:', e);
    }
  }

  unlock() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  bindEvents() {
    globalEventBus.on('SPIN_START', () => { this.unlock(); this.playSpinStart(); });
    globalEventBus.on('REEL_STOPPED', (data) => { this.playReelStop(data?.reelIndex); });
    globalEventBus.on('SCATTER_ANTICIPATION', () => { this.playScatterAnticipation(); });
    globalEventBus.on('SCATTER_LANDED', () => { this.playScatterLand(); });
    globalEventBus.on('WILD_LANDED', () => { this.playWildLand(); });
    globalEventBus.on('WIN_DETECTED', (data) => { this.playWinTone(data?.pay); });
    globalEventBus.on('MULTIPLIER_TICK', () => { this.playMultiplierTick(); });
    globalEventBus.on('UI_CLICK', () => { this.playClick(); });
  }

  playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.2) {
    if (!gameState.audioEnabled || this.isMuted) return;
    this.unlock();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (err) {
      console.warn('[V2AudioEngine] Tone synthesis error:', err);
    }
  }

  playClick() {
    this.playTone(600, 'sine', 0.05, 0.15);
  }

  playSpinStart() {
    if (!gameState.audioEnabled) return;
    this.unlock();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(350, this.ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {}
  }

  playReelStop(index = 0) {
    const pitch = 140 + (index * 25);
    this.playTone(pitch, 'triangle', 0.1, 0.25);
  }

  playScatterAnticipation() {
    this.playTone(880, 'sine', 0.4, 0.3);
  }

  playScatterLand() {
    if (!gameState.audioEnabled) return;
    this.unlock();
    if (!this.ctx) return;

    // Dual chime frequency impact
    this.playTone(523.25, 'sine', 0.4, 0.3); // C5
    setTimeout(() => this.playTone(659.25, 'sine', 0.4, 0.3), 80); // E5
    setTimeout(() => this.playTone(783.99, 'sine', 0.5, 0.35), 160); // G5
  }

  playWildLand() {
    this.playTone(440, 'square', 0.3, 0.2);
    setTimeout(() => this.playTone(880, 'sine', 0.3, 0.25), 100);
  }

  playMultiplierTick() {
    this.playTone(1200, 'sine', 0.04, 0.2);
  }

  playWinTone(pay = 10) {
    const baseFreq = Math.min(1200, 400 + pay * 10);
    this.playTone(baseFreq, 'sine', 0.3, 0.3);
  }
}

export const v2AudioEngine = new V2AudioEngine();
