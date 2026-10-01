/* =========================================================
   EGYPT GLOW V2 - GAME STATE MANAGEMENT
   Non-monetary virtual Glow Points / XP state model
   ========================================================= */

import { globalEventBus } from './eventBus.js';

export class GameState {
  constructor() {
    this.glowPoints = 25000;
    this.xp = 0;
    this.level = 1;
    this.currentMultiplier = 1;
    this.freeSpins = 0;
    this.totalSpins = 0;
    this.lastWinTier = null;
    this.activeBonus = null;
    this.codexOpen = false;
    this.selectedSymbol = null;
    this.audioEnabled = true;
    this.narratorEnabled = true;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.loadState();
  }

  loadState() {
    try {
      const saved = localStorage.getItem('EGYPT_GLOW_V2_STATE');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.glowPoints = parsed.glowPoints ?? 25000;
        this.xp = parsed.xp ?? 0;
        this.level = parsed.level ?? 1;
        this.totalSpins = parsed.totalSpins ?? 0;
      }
    } catch (e) {
      console.warn('[GameState] Failed to load local state:', e);
    }
  }

  saveState() {
    try {
      localStorage.setItem('EGYPT_GLOW_V2_STATE', JSON.stringify({
        glowPoints: this.glowPoints,
        xp: this.xp,
        level: this.level,
        totalSpins: this.totalSpins
      }));
    } catch (e) {
      console.warn('[GameState] Failed to save local state:', e);
    }
  }

  addGlowPoints(amount, reason = 'WIN') {
    this.glowPoints += amount;
    this.saveState();
    globalEventBus.emit('GLOW_POINTS_CHANGED', { glowPoints: this.glowPoints, delta: amount, reason });
  }

  deductGlowPoints(amount, reason = 'BET') {
    if (this.glowPoints < amount) return false;
    this.glowPoints -= amount;
    this.saveState();
    globalEventBus.emit('GLOW_POINTS_CHANGED', { glowPoints: this.glowPoints, delta: -amount, reason });
    return true;
  }

  addXP(amount) {
    this.xp += amount;
    const requiredForNext = this.level * 1000;
    if (this.xp >= requiredForNext) {
      this.xp -= requiredForNext;
      this.level += 1;
      globalEventBus.emit('LEVEL_UP', { level: this.level });
    }
    this.saveState();
    globalEventBus.emit('XP_CHANGED', { xp: this.xp, level: this.level });
  }

  setMultiplier(mult) {
    this.currentMultiplier = mult;
    globalEventBus.emit('MULTIPLIER_CHANGED', { multiplier: mult });
  }
}

export const gameState = new GameState();
