/* =========================================================
   EGYPT GLOW V2 - LOADING SCREEN
   Animated Temple loading bar with rotating Egyptian game tips
   ========================================================= */

import { globalEventBus } from '../game/eventBus.js';

export class LoadingScreen {
  constructor() {
    this.tips = [
      "Three Scatter symbols activate the sacred bonus sequence.",
      "Wild symbols substitute for high-paying Egyptian relics.",
      "Discover every symbol lore in the Temple Codex.",
      "Some symbols reveal their secret payouts when tapped.",
      "Ra's blessing can randomly boost line multipliers up to x10,000.",
      "Continuous win cascades increase the solar multiplier."
    ];
    this.progress = 0;
    this.container = null;
  }

  init() {
    this.renderDOM();
    this.startLoadingSimulation();
  }

  renderDOM() {
    let el = document.getElementById('v2-loading-screen');
    if (!el) {
      el = document.createElement('div');
      el.id = 'v2-loading-screen';
      el.className = 'v2-loading-container';
      document.body.appendChild(el);
    }

    const initialTip = this.tips[Math.floor(Math.random() * this.tips.length)];

    el.innerHTML = `
      <div class="v2-solar-disk-spinner">☀️</div>
      <div class="v2-loading-title">AWAKENING THE TEMPLE</div>
      <div class="v2-loading-bar-outer">
        <div class="v2-loading-bar-inner" id="v2-load-progress"></div>
      </div>
      <div class="v2-loading-percent" id="v2-load-pct">0%</div>
      <div class="v2-loading-tip-box" id="v2-load-tip">Tip: ${initialTip}</div>
    `;

    this.container = el;
  }

  startLoadingSimulation() {
    let currentPct = 0;
    const interval = setInterval(() => {
      currentPct += Math.floor(Math.random() * 12) + 8;
      if (currentPct >= 100) {
        currentPct = 100;
        clearInterval(interval);
        setTimeout(() => this.completeLoading(), 300);
      }

      const bar = document.getElementById('v2-load-progress');
      const pctText = document.getElementById('v2-load-pct');
      if (bar) bar.style.width = `${currentPct}%`;
      if (pctText) pctText.innerText = `${currentPct}%`;
    }, 120);
  }

  completeLoading() {
    if (!this.container) return;
    if (window.gsap) {
      gsap.to(this.container, {
        opacity: 0,
        duration: 0.6,
        onComplete: () => {
          this.container.style.display = 'none';
          globalEventBus.emit('LOADING_COMPLETE');
        }
      });
    } else {
      this.container.style.display = 'none';
      globalEventBus.emit('LOADING_COMPLETE');
    }
  }
}

export const loadingScreen = new LoadingScreen();
