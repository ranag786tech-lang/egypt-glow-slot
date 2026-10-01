/* =========================================================
   EGYPT GLOW V2 - PORTRAIT MOBILE HUD
   Top HUD, Reel Chamber Frame, & Physical Tactile Buttons
   ========================================================= */

import { globalEventBus } from '../game/eventBus.js';
import { gameState } from '../game/gameState.js';

export class GameHUD {
  constructor() {
    this.container = null;
    this.bindEvents();
  }

  init() {
    this.renderDOM();
    this.updateHUD();
  }

  bindEvents() {
    globalEventBus.on('GLOW_POINTS_CHANGED', () => this.updateHUD());
    globalEventBus.on('XP_CHANGED', () => this.updateHUD());
    globalEventBus.on('LEVEL_UP', (data) => {
      this.updateHUD();
      this.showLevelUpNotification(data.level);
    });
    globalEventBus.on('NARRATOR_SUBTITLE', (data) => this.showSubtitle(data.text));
  }

  renderDOM() {
    let mainStage = document.getElementById('v2-game-stage');
    if (!mainStage) {
      mainStage = document.createElement('div');
      mainStage.id = 'v2-game-stage';
      mainStage.className = 'v2-stage-container';
      document.body.appendChild(mainStage);
    }

    mainStage.innerHTML = `
      <!-- Top HUD Header -->
      <header class="v2-top-hud">
        <div class="v2-profile-card">
          <div class="v2-avatar-frame">𓋹</div>
          <div class="v2-profile-info">
            <span class="v2-level-badge" id="v2-hud-level">LVL 1</span>
            <span class="v2-player-title">PHARAOH</span>
          </div>
        </div>

        <div class="v2-glow-points-box">
          <span class="v2-gp-icon">☀️</span>
          <div class="v2-gp-details">
            <span class="v2-gp-label">GLOW POINTS</span>
            <span class="v2-gp-val" id="v2-hud-points">25,000</span>
          </div>
        </div>

        <div class="v2-top-controls">
          <button class="v2-icon-btn" id="v2-sound-btn" title="Toggle Sound">🔊</button>
          <button class="v2-icon-btn" id="v2-codex-btn" title="Temple Codex">📜</button>
        </div>
      </header>

      <!-- Narrator Subtitle Overlay -->
      <div class="v2-subtitle-overlay hidden" id="v2-subtitle-box">
        <span id="v2-subtitle-text"></span>
      </div>

      <!-- Reel Chamber Frame -->
      <main class="v2-reel-chamber-outer">
        <div class="v2-chamber-header">
          <span class="v2-chamber-title">TEMPLE OF RA</span>
        </div>
        <div class="v2-chamber-frame">
          <div class="v2-chamber-inner" id="v2-pixi-holder"></div>
          <div class="v2-chamber-glass-glow"></div>
        </div>
        <div class="v2-win-banner-box hidden" id="v2-win-banner">
          <span class="v2-win-title">SACRED WIN</span>
          <span class="v2-win-amount" id="v2-win-val">0.00</span>
        </div>
      </main>

      <!-- Bottom Control Deck -->
      <footer class="v2-bottom-deck">
        <div class="v2-deck-top-row">
          <div class="v2-bet-selector">
            <button class="v2-bet-btn" id="v2-bet-minus">-</button>
            <div class="v2-bet-display">
              <span class="v2-bet-label">BET</span>
              <span class="v2-bet-val" id="v2-bet-val">10</span>
            </div>
            <button class="v2-bet-btn" id="v2-bet-plus">+</button>
          </div>

          <button class="v2-auto-btn" id="v2-auto-btn">
            <span class="v2-auto-icon">𓆣</span>
            <span class="v2-auto-text">AUTO</span>
          </button>
        </div>

        <div class="v2-deck-bottom-row">
          <button class="v2-bonus-btn" id="v2-wheel-btn">
            <span class="v2-bonus-icon">☀️</span>
            <span class="v2-bonus-text">WHEEL</span>
          </button>

          <!-- Central Solar Spin Button -->
          <button class="v2-spin-solar-btn" id="v2-spin-btn">
            <div class="v2-solar-ring"></div>
            <div class="v2-solar-core">
              <span class="v2-spin-text">SPIN</span>
            </div>
          </button>

          <button class="v2-codex-deck-btn" id="v2-codex-deck-btn">
            <span class="v2-deck-icon">🏛️</span>
            <span class="v2-deck-text">CODEX</span>
          </button>
        </div>
      </footer>
    `;

    this.container = mainStage;
    this.bindHUDButtons();
  }

  bindHUDButtons() {
    document.getElementById('v2-sound-btn').onclick = () => {
      gameState.audioEnabled = !gameState.audioEnabled;
      document.getElementById('v2-sound-btn').innerText = gameState.audioEnabled ? '🔊' : '🔇';
      globalEventBus.emit('UI_CLICK');
    };

    document.getElementById('v2-codex-btn').onclick = () => {
      globalEventBus.emit('UI_CLICK');
      globalEventBus.emit('CODEX_OPEN');
    };

    document.getElementById('v2-codex-deck-btn').onclick = () => {
      globalEventBus.emit('UI_CLICK');
      globalEventBus.emit('CODEX_OPEN');
    };

    document.getElementById('v2-wheel-btn').onclick = () => {
      globalEventBus.emit('UI_CLICK');
      globalEventBus.emit('OPEN_WHEEL_BONUS');
    };
  }

  updateHUD() {
    const pointsEl = document.getElementById('v2-hud-points');
    const levelEl = document.getElementById('v2-hud-level');

    if (pointsEl) pointsEl.innerText = gameState.glowPoints.toLocaleString();
    if (levelEl) levelEl.innerText = `LVL ${gameState.level}`;
  }

  showSubtitle(text) {
    const box = document.getElementById('v2-subtitle-box');
    const txt = document.getElementById('v2-subtitle-text');
    if (!box || !txt) return;

    txt.innerText = text;
    box.classList.remove('hidden');

    if (window.gsap) {
      gsap.fromTo(box, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.4 });
      setTimeout(() => {
        gsap.to(box, { opacity: 0, y: -10, duration: 0.4, onComplete: () => box.classList.add('hidden') });
      }, 2500);
    } else {
      setTimeout(() => box.classList.add('hidden'), 2500);
    }
  }

  showLevelUpNotification(level) {
    globalEventBus.emit('NARRATE', 'MEGA_WIN');
    this.showSubtitle(`🎉 LEVEL UP! YOU ARE NOW LEVEL ${level}!`);
  }
}

export const gameHUD = new GameHUD();
