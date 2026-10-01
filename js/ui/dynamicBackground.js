/* =========================================================
   EGYPT GLOW V2 - DYNAMIC REACTIVE BACKGROUND
   Atmospheric environment that reacts to game states
   ========================================================= */

import { globalEventBus } from '../game/eventBus.js';

export class DynamicBackground {
  constructor() {
    this.container = null;
    this.currentState = 'IDLE';
    this.bindEvents();
  }

  init() {
    let el = document.getElementById('v2-dynamic-bg');
    if (!el) {
      el = document.createElement('div');
      el.id = 'v2-dynamic-bg';
      el.className = 'v2-dynamic-bg-container state-idle';
      document.body.prepend(el);
    }

    el.innerHTML = `
      <div class="v2-bg-layer v2-bg-temple"></div>
      <div class="v2-bg-layer v2-bg-pyramids"></div>
      <div class="v2-bg-layer v2-bg-aura" id="v2-bg-aura"></div>
      <div class="v2-bg-particles" id="v2-bg-particles"></div>
    `;

    this.container = el;
    this.spawnDustParticles();
  }

  bindEvents() {
    globalEventBus.on('SPIN_START', () => this.setState('SPIN'));
    globalEventBus.on('SCATTER_ANTICIPATION', () => this.setState('SCATTER'));
    globalEventBus.on('WILD_LANDED', () => this.setState('WILD'));
    globalEventBus.on('BIG_WIN', () => this.setState('BIG_WIN'));
    globalEventBus.on('MEGA_WIN', () => this.setState('MEGA_WIN'));
    globalEventBus.on('BONUS_TRIGGERED', () => this.setState('BONUS'));
    globalEventBus.on('REEL_STOPPED', (data) => {
      if (data?.isLast) {
        setTimeout(() => {
          if (this.currentState !== 'MEGA_WIN' && this.currentState !== 'BONUS') {
            this.setState('IDLE');
          }
        }, 800);
      }
    });
  }

  setState(newState) {
    if (!this.container) return;
    this.currentState = newState;
    this.container.className = `v2-dynamic-bg-container state-${newState.toLowerCase()}`;

    const aura = document.getElementById('v2-bg-aura');
    if (!aura) return;

    let bgStyle = 'radial-gradient(circle at 50% 30%, rgba(232,181,68,0.15), transparent 70%)';

    switch (newState) {
      case 'SPIN':
        bgStyle = 'radial-gradient(circle at 50% 40%, rgba(232,181,68,0.25), transparent 60%)';
        break;
      case 'SCATTER':
        bgStyle = 'radial-gradient(circle at 50% 50%, rgba(255,215,0,0.45), rgba(180,100,0,0.2) 80%)';
        break;
      case 'WILD':
        bgStyle = 'radial-gradient(circle at 50% 50%, rgba(0,242,254,0.35), transparent 70%)';
        break;
      case 'BIG_WIN':
        bgStyle = 'radial-gradient(circle at 50% 50%, rgba(255,216,115,0.5), rgba(200,120,0,0.3) 80%)';
        break;
      case 'MEGA_WIN':
        bgStyle = 'radial-gradient(circle at 50% 50%, rgba(255,230,120,0.7), rgba(255,100,0,0.5) 90%)';
        break;
      case 'BONUS':
        bgStyle = 'radial-gradient(circle at 50% 50%, rgba(180,0,255,0.35), rgba(20,0,50,0.6) 80%)';
        break;
      case 'IDLE':
      default:
        bgStyle = 'radial-gradient(circle at 50% 30%, rgba(232,181,68,0.15), transparent 70%)';
        break;
    }

    if (window.gsap) {
      gsap.to(aura, { background: bgStyle, duration: 0.6, ease: 'sine.out' });
    } else {
      aura.style.background = bgStyle;
    }
  }

  spawnDustParticles() {
    const pContainer = document.getElementById('v2-bg-particles');
    if (!pContainer) return;
    pContainer.innerHTML = '';

    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.className = 'v2-dust-particle';
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      particle.style.animationDuration = `${4 + Math.random() * 6}s`;
      particle.style.animationDelay = `${Math.random() * 3}s`;
      pContainer.appendChild(particle);
    }
  }
}

export const dynamicBackground = new DynamicBackground();
