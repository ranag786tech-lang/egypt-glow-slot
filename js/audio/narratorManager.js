/* =========================================================
   EGYPT GLOW V2 - NARRATOR MANAGER
   Speech Synthesis & Audio Callout Engine for Cinematic Events
   ========================================================= */

import { globalEventBus } from '../game/eventBus.js';
import { gameState } from '../game/gameState.js';

export class NarratorManager {
  constructor() {
    this.synth = window.speechSynthesis || null;
    this.lastCalled = 0;
    this.cooldown = 1800; // ms debounce between speech callouts

    this.phrasePool = {
      GAME_START: [
        "The Sun Awakens.",
        "The Temple Remembers.",
        "Ra's Power Rises.",
        "The Ancient Light Returns."
      ],
      SCATTER_APPROACH: [
        "The Temple Stirs...",
        "Sacred Energy Growing..."
      ],
      SCATTER_LAND: [
        "The Temple Awakens!",
        "Ra's Power Rises!",
        "The Scatters Have Appeared!"
      ],
      WILD_LAND: [
        "Ra's Wild Awakens!",
        "Solar Energy Unleashed!"
      ],
      BONUS_TRIGGER: [
        "Ra Has Opened The Ancient Chamber!",
        "The Sacred Temple Unlocks!"
      ],
      BIG_WIN: [
        "Ra's Light Has Awakened!",
        "The Sun God Smiles!"
      ],
      SUPER_WIN: [
        "The Temple Burns With Power!",
        "The Solar Power Surges!"
      ],
      MEGA_WIN: [
        "Mega Solar Power!",
        "An Ancient Power Awakens!"
      ],
      MULTIPLIER_INCREASE: [
        "Power Multiplied!",
        "The Solar Power Surges!"
      ]
    };

    this.bindEvents();
  }

  bindEvents() {
    globalEventBus.on('NARRATE', (event) => this.speakEvent(event));
    globalEventBus.on('SCATTER_LANDED', () => this.speakEvent('SCATTER_LAND'));
    globalEventBus.on('WILD_LANDED', () => this.speakEvent('WILD_LAND'));
    globalEventBus.on('BONUS_TRIGGERED', () => this.speakEvent('BONUS_TRIGGER'));
    globalEventBus.on('BIG_WIN', () => this.speakEvent('BIG_WIN'));
    globalEventBus.on('SUPER_WIN', () => this.speakEvent('SUPER_WIN'));
    globalEventBus.on('MEGA_WIN', () => this.speakEvent('MEGA_WIN'));
  }

  speakEvent(eventKey) {
    if (!gameState.narratorEnabled || !gameState.audioEnabled) return;

    const now = Date.now();
    if (now - this.lastCalled < this.cooldown) return;
    this.lastCalled = now;

    const pool = this.phrasePool[eventKey];
    if (!pool || pool.length === 0) return;

    const phrase = pool[Math.floor(Math.random() * pool.length)];

    if (this.synth) {
      try {
        this.synth.cancel(); // Stop ongoing speech
        const utterance = new SpeechSynthesisUtterance(phrase);
        utterance.rate = 0.9;
        utterance.pitch = 0.8;
        utterance.volume = 0.9;

        // Try selecting an English male or deep voice if available
        const voices = this.synth.getVoices();
        const preferredVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Male') || v.name.includes('Deep') || v.name.includes('Google') || v.name.includes('Natural')));
        if (preferredVoice) utterance.voice = preferredVoice;

        this.synth.speak(utterance);
      } catch (err) {
        console.warn('[NarratorManager] SpeechSynthesis error:', err);
      }
    }

    // Also emit UI callout event for onscreen subtitle text
    globalEventBus.emit('NARRATOR_SUBTITLE', { text: phrase });
  }
}

export const narratorManager = new NarratorManager();
