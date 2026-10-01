/* =========================================================
   EGYPT GLOW V2 - TIERED WIN CELEBRATION & MULTIPLIER SYSTEM
   WIN, BIG WIN, SUPER WIN, MEGA WIN sequences with rolling mults
   ========================================================= */

import { globalEventBus } from '../game/eventBus.js';
import { gameState } from '../game/gameState.js';

export class WinCelebrations {
  constructor() {
    this.container = null;
    this.phrasePool = [
      "RA'S LIGHT HAS AWAKENED!",
      "THE TEMPLE BURNS WITH POWER!",
      "THE SUN GOD SMILES!",
      "AN ANCIENT POWER AWAKENS!",
      "THE WILD HAS BEEN UNLEASHED!",
      "THE TEMPLE HAS CHOSEN YOU!",
      "THE SCARAB BRINGS FORTUNE!",
      "THE SOLAR POWER SURGES!"
    ];

    this.bindEvents();
  }

  init() {
    this.renderDOM();
  }

  bindEvents() {
    globalEventBus.on('WIN_CELEBRATION', (data) => this.triggerWin(data));
    globalEventBus.on('MULTIPLIER_ANIMATE', (data) => this.animateMultiplier(data.targetMult));
  }

  renderDOM() {
    let el = document.getElementById('v2-win-modal-overlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'v2-win-modal-overlay';
      el.className = 'v2-win-modal-container hidden';
      document.body.appendChild(el);
    }

    el.innerHTML = `
      <div class="v2-win-backdrop" id="win-backdrop"></div>
      <div class="v2-win-card" id="win-card">
        <div class="v2-win-tier-title" id="win-tier-title">MEGA WIN</div>
        <div class="v2-win-phrase" id="win-phrase">THE SUN GOD SMILES!</div>
        <div class="v2-win-count-up" id="win-count-val">0</div>
        <div class="v2-win-mult-badge hidden" id="win-mult-badge">WILD x1</div>
      </div>
    `;

    this.container = el;
  }

  triggerWin({ totalWin, betAmount }) {
    if (!totalWin || totalWin <= 0) return;

    const ratio = totalWin / betAmount;
    let tier = 'WIN';
    if (ratio >= 50) tier = 'MEGA WIN';
    else if (ratio >= 20) tier = 'SUPER WIN';
    else if (ratio >= 5) tier = 'BIG WIN';

    if (tier === 'WIN') {
      gameState.addGlowPoints(totalWin, 'WIN');
      return;
    }

    const titleEl = document.getElementById('win-tier-title');
    const phraseEl = document.getElementById('win-phrase');
    const countEl = document.getElementById('win-count-val');
    const cardEl = document.getElementById('win-card');

    titleEl.innerText = tier;
    phraseEl.innerText = this.phrasePool[Math.floor(Math.random() * this.phrasePool.length)];
    countEl.innerText = '0';

    this.container.classList.remove('hidden');

    // Camera shake for SUPER / MEGA win
    if ((tier === 'SUPER WIN' || tier === 'MEGA WIN') && window.gsap && !gameState.reducedMotion) {
      const stage = document.getElementById('v2-game-stage');
      if (stage) {
        gsap.fromTo(stage, { x: -8, y: -8 }, { x: 0, y: 0, duration: 0.5, ease: 'rough' });
      }
    }

    // Emit narrator callout event
    globalEventBus.emit('NARRATE', tier.replace(' ', '_'));

    // Count-up animation
    const obj = { val: 0 };
    if (window.gsap) {
      gsap.to(obj, {
        val: totalWin,
        duration: tier === 'MEGA WIN' ? 3 : 1.8,
        ease: 'power2.out',
        onUpdate: () => {
          countEl.innerText = Math.floor(obj.val).toLocaleString();
          globalEventBus.emit('MULTIPLIER_TICK');
        },
        onComplete: () => {
          gameState.addGlowPoints(totalWin, 'WIN');
          setTimeout(() => {
            this.container.classList.add('hidden');
          }, 1200);
        }
      });
    } else {
      countEl.innerText = totalWin.toLocaleString();
      gameState.addGlowPoints(totalWin, 'WIN');
      setTimeout(() => this.container.classList.add('hidden'), 1500);
    }
  }

  animateMultiplier(targetMult) {
    const badge = document.getElementById('win-mult-badge');
    if (!badge) return;

    badge.classList.remove('hidden');
    const steps = [1, 2, 5, 10, 25, 50, 100, 500, 1000, 5000, 10000].filter(m => m <= targetMult);

    let idx = 0;
    const interval = setInterval(() => {
      if (idx >= steps.length) {
        clearInterval(interval);
        return;
      }
      const mult = steps[idx];
      badge.innerText = `WILD x${mult}`;
      globalEventBus.emit('MULTIPLIER_TICK');
      if (window.gsap) {
        gsap.fromTo(badge, { scale: 0.8 }, { scale: 1.2, duration: 0.2, yoyo: true, repeat: 1 });
      }
      idx++;
    }, 200);
  }
}

export const winCelebrations = new WinCelebrations();
