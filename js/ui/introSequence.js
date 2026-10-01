/* =========================================================
   EGYPT GLOW V2 - CINEMATIC INTRO SEQUENCE
   Frames 1-10 startup sequence with TAP TO ENTER & Skip
   ========================================================= */

import { globalEventBus } from '../game/eventBus.js';
import { gameState } from '../game/gameState.js';

export class IntroSequence {
  constructor() {
    this.container = null;
    this.skipped = false;
  }

  init() {
    this.renderDOM();
    if (gameState.reducedMotion) {
      this.skipIntro();
      return;
    }
    this.startSequence();
  }

  renderDOM() {
    let el = document.getElementById('v2-intro-overlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'v2-intro-overlay';
      el.className = 'v2-intro-container';
      document.body.appendChild(el);
    }

    el.innerHTML = `
      <div class="v2-intro-bg" id="intro-bg"></div>
      <div class="v2-intro-particles" id="intro-particles"></div>
      <div class="v2-intro-glyph" id="intro-glyph">𓋹</div>
      <div class="v2-intro-solar-light" id="intro-solar"></div>
      <div class="v2-intro-temple" id="intro-temple"></div>
      <div class="v2-intro-logo-group" id="intro-logo">
        <h1 class="v2-intro-title">EGYPT GLOW</h1>
        <h2 class="v2-intro-subtitle">TEMPLE OF RA</h2>
      </div>
      <button class="v2-intro-tap-btn hidden" id="intro-tap-btn">
        <span class="v2-tap-pulse"></span>
        <span class="v2-tap-text">TAP TO ENTER</span>
      </button>
      <button class="v2-intro-skip-btn" id="intro-skip-btn">SKIP ➔</button>
    `;

    this.container = el;

    document.getElementById('intro-skip-btn').onclick = () => this.skipIntro();
    document.getElementById('intro-tap-btn').onclick = () => this.enterGame();
  }

  startSequence() {
    const glyph = document.getElementById('intro-glyph');
    const solar = document.getElementById('intro-solar');
    const temple = document.getElementById('intro-temple');
    const logo = document.getElementById('intro-logo');
    const tapBtn = document.getElementById('intro-tap-btn');

    if (window.gsap) {
      const tl = gsap.timeline();
      tl.to(glyph, { opacity: 0.8, scale: 1.1, duration: 1.5, ease: "power2.inOut" })
        .to(solar, { opacity: 1, scale: 1.2, duration: 2, ease: "sine.out" }, "-=0.5")
        .to(temple, { opacity: 0.9, y: 0, duration: 2, ease: "power2.out" }, "-=1")
        .to(logo, { opacity: 1, y: 0, duration: 1.5, ease: "back.out(1.4)" }, "-=0.5")
        .call(() => {
          if (!this.skipped) {
            tapBtn.classList.remove('hidden');
            gsap.fromTo(tapBtn, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.8, ease: "back.out(1.7)" });
            globalEventBus.emit('NARRATE', 'GAME_START');
          }
        });
    } else {
      glyph.style.opacity = '1';
      logo.style.opacity = '1';
      tapBtn.classList.remove('hidden');
    }
  }

  skipIntro() {
    this.skipped = true;
    this.enterGame();
  }

  enterGame() {
    globalEventBus.emit('UI_CLICK');
    if (this.container && window.gsap) {
      gsap.to(this.container, {
        opacity: 0,
        scale: 1.08,
        duration: 0.8,
        ease: "power2.inOut",
        onComplete: () => {
          this.container.style.display = 'none';
          globalEventBus.emit('INTRO_COMPLETE');
        }
      });
    } else if (this.container) {
      this.container.style.display = 'none';
      globalEventBus.emit('INTRO_COMPLETE');
    }
  }
}

export const introSequence = new IntroSequence();
