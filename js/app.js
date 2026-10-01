/* =========================================================
   EGYPT GLOW SLOT PLATFORM - MAIN CONTROLLER
   Integrates Game Engines & Platform Core Infrastructure
   ========================================================= */

import { WalletEngine } from './platform/walletEngine.js';
import { VIPEngine } from './platform/vipEngine.js';
import { RewardCenter } from './platform/rewardCenter.js';
import { PromotionsEngine } from './platform/promotionsEngine.js';
import { EventEngine } from './platform/eventEngine.js';
import { ConfigEngine } from './platform/configEngine.js';
import { I18nEngine } from './platform/i18nEngine.js';
import { ThemeEngine } from './platform/themeEngine.js';
import { AdminPanel } from './platform/adminPanel.js';
import { AnalyticsDashboard } from './platform/analyticsDashboard.js';

// Import V2 Cinematic Architecture & Synthesizer
import { introSequence } from './ui/introSequence.js';
import { loadingScreen } from './ui/loadingScreen.js';
import { dynamicBackground } from './ui/dynamicBackground.js';
import { gameHUD } from './ui/gameHUD.js';
import { ReelEngine } from './game/reelEngine.js';
import { winCelebrations } from './ui/winCelebrations.js';
import { templeCodex } from './ui/templeCodex.js';
import { v2AudioEngine } from './audio/v2AudioEngine.js';
import { globalEventBus } from './game/eventBus.js';

(function () {
  "use strict";

  const $ = id => document.getElementById(id);

  // Initialize Core Slot & Platform Engines
  const slotEngine = new window.SlotEngine();
  const soundEngine = window.soundEngine;
  const engagementEngine = new window.EngagementEngine();
  const analyticsEngine = new window.AnalyticsEngine();

  // Initialize Platform Infrastructure Modules
  const walletEngine = new WalletEngine();
  window.walletEngine = walletEngine;
  const vipEngine = new VIPEngine();
  const rewardCenter = new RewardCenter(walletEngine, vipEngine);
  const promotionsEngine = new PromotionsEngine(walletEngine);
  const eventEngine = new EventEngine();
  const configEngine = new ConfigEngine(slotEngine);
  const i18nEngine = new I18nEngine();
  const themeEngine = new ThemeEngine();

  const analyticsDashboard = new AnalyticsDashboard(analyticsEngine);
  const adminPanel = new AdminPanel(configEngine, analyticsDashboard);
  const bonusEngine = new window.BonusEngine(slotEngine, soundEngine);

  let pixiRenderer = null;
  let uiController = null;

  let isSpinning = false;
  let autoSpin = false;
  let turboMode = false;

  let reelEngine = null;

  function initApp() {
    v2AudioEngine.init();
    dynamicBackground.init();
    gameHUD.init();
    winCelebrations.init();
    templeCodex.init();
    introSequence.init();
    loadingScreen.init();

    pixiRenderer = new window.PixiRenderer('v2-pixi-holder', slotEngine, soundEngine);
    pixiRenderer.init();

    reelEngine = new ReelEngine(slotEngine, pixiRenderer);

    uiController = new window.UIController(slotEngine, soundEngine, engagementEngine, analyticsEngine);
    uiController.buildPaytableUI();
    uiController.buildAchievementsUI();
    uiController.buildMissionsUI();
    uiController.updateRecentWinsTicker();

    slotEngine.grid = slotEngine.fillGrid(null);
    pixiRenderer.renderGridInstant(slotEngine.grid);
    uiController.refreshHUD();

    updatePlatformHUD();
    bindEvents();
    bindPlatformEvents();
    bindV2SpinControls();

    // Listen for Intro Complete -> Transition directly to Egypt Glow V2 game
    globalEventBus.on('INTRO_COMPLETE', () => {
      soundEngine.startMusic();
      const menu = $('main-menu');
      if (menu) menu.classList.add('hidden');

      const appRoot = $('app-root');
      if (appRoot) appRoot.style.display = 'none';

      const topBar = $('top-bar');
      if (topBar) topBar.style.display = 'none';
      const bottomHud = $('bottom-hud');
      if (bottomHud) bottomHud.style.display = 'none';

      const doors = $('door-container');
      if (doors) {
        doors.classList.add('open');
        setTimeout(() => doors.remove(), 1300);
      }
    });
  }

  function bindV2SpinControls() {
    const spinBtn = $('v2-spin-btn');
    if (spinBtn) {
      spinBtn.onclick = async () => {
        if (isSpinning) return;
        if (!slotEngine.inFreeSpins && !walletEngine.deduct(slotEngine.bet, 'SPIN_BET')) {
          globalEventBus.emit('NARRATOR_SUBTITLE', { text: "NOT ENOUGH GLOW POINTS!" });
          return;
        }

        isSpinning = true;
        updatePlatformHUD();

        await reelEngine.spinSequence(turboMode);

        isSpinning = false;
        updatePlatformHUD();
      };
    }

    const betMinus = $('v2-bet-minus');
    const betPlus = $('v2-bet-plus');
    if (betMinus) {
      betMinus.onclick = () => {
        if (!isSpinning) {
          slotEngine.decBet();
          const display = $('v2-bet-val');
          if (display) display.innerText = slotEngine.bet;
        }
      };
    }
    if (betPlus) {
      betPlus.onclick = () => {
        if (!isSpinning) {
          slotEngine.incBet();
          const display = $('v2-bet-val');
          if (display) display.innerText = slotEngine.bet;
        }
      };
    }
  }

  function updatePlatformHUD() {
    // Wallet Sync
    const currentBal = walletEngine.getBalance();
    slotEngine.balance = currentBal;
    const balVal = $('balance-val');
    if (balVal) balVal.innerText = currentBal.toFixed(2);

    // VIP Sync
    const vipTier = vipEngine.getCurrentTier();
    const vipBadge = $('vip-badge-icon');
    const vipTierText = $('lobby-vip-tier');
    if (vipBadge) vipBadge.innerText = vipTier.badge;
    if (vipTierText) vipTierText.innerText = vipTier.name;

    // Config & RTP Sync
    const cfg = configEngine.getConfig();
    const lobbyRtp = $('lobby-rtp-val');
    if (lobbyRtp) lobbyRtp.innerText = `${cfg.targetRTP}%`;
  }

  function openModal(id) {
    const el = $(id);
    if (el) el.classList.remove('hidden', 'show'), el.classList.add('show');
  }

  function closeModal(id) {
    const el = $(id);
    if (el) el.classList.add('hidden'), el.classList.remove('show');
  }

  function bindPlatformEvents() {
    // Wallet Modal
    const walletBtn = $('platform-wallet-btn');
    if (walletBtn) {
      walletBtn.onclick = () => {
        soundEngine.playClick();
        $('wallet-gc-val').textContent = walletEngine.getBalance('GC').toLocaleString();
        $('wallet-sc-val').textContent = walletEngine.getBalance('SC').toFixed(2);

        const list = $('wallet-tx-list');
        list.innerHTML = walletEngine.getTransactionHistory().map(tx => `
          <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.1); padding:4px 0;">
            <span>${tx.type}</span>
            <span style="color:${tx.amount >= 0 ? '#7ad89a' : '#ff9d73'}">${tx.amount >= 0 ? '+' : ''}${tx.amount.toFixed(2)} ${tx.currency}</span>
          </div>
        `).join('');

        openModal('wallet-modal');
      };
    }
    const closeWallet = $('closeWalletModal');
    if (closeWallet) closeWallet.onclick = () => closeModal('wallet-modal');

    // Reward Center Modal (Wheel of Ra)
    const drawWheelCanvas = (rotation = 0) => {
      const cvs = $('wheel-canvas');
      if (!cvs) return;
      const ctx = cvs.getContext('2d');
      const cx = 130, cy = 130, radius = 120;
      const slices = rewardCenter.wheelRewards;
      const sliceAngle = (Math.PI * 2) / slices.length;

      ctx.clearRect(0, 0, 260, 260);

      slices.forEach((s, i) => {
        const start = rotation + i * sliceAngle;
        const end = start + sliceAngle;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, start, end);
        ctx.closePath();
        ctx.fillStyle = s.color || '#3a2a1a';
        ctx.fill();
        ctx.strokeStyle = '#ffd873';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(start + sliceAngle / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#fff3c4';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(s.label, radius - 12, 4);
        ctx.restore();
      });

      // Center cap
      ctx.beginPath();
      ctx.arc(cx, cy, 22, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd873';
      ctx.fill();
      ctx.strokeStyle = '#2a1608';
      ctx.lineWidth = 3;
      ctx.stroke();
    };

    const rewardsBtn = $('platform-rewards-btn');
    if (rewardsBtn) {
      rewardsBtn.onclick = () => {
        soundEngine.playClick();
        drawWheelCanvas(0);
        openModal('rewards-modal');
      };
    }
    const closeRewards = $('closeRewardsModal');
    if (closeRewards) closeRewards.onclick = () => closeModal('rewards-modal');

    let wheelSpinning = false;
    const spinWheelBtn = $('spinWheelBtn');
    if (spinWheelBtn) {
      spinWheelBtn.onclick = () => {
        if (wheelSpinning) return;
        soundEngine.playClick();
        const res = rewardCenter.spinDailyWheel();
        const resultDiv = $('wheelRewardResult');

        if (res.success) {
          wheelSpinning = true;
          resultDiv.textContent = '🎡 Spinning the sacred wheel...';

          let currentRot = 0;
          const totalRot = Math.PI * 2 * 5 + Math.random() * Math.PI * 2;

          gsap.to({ rot: 0 }, {
            rot: totalRot,
            duration: 3.5,
            ease: 'power4.out',
            onUpdate: function() {
              drawWheelCanvas(this.targets()[0].rot);
              soundEngine.playClick();
            },
            onComplete: () => {
              wheelSpinning = false;
              resultDiv.textContent = `🎉 You won $${res.reward.value}!`;
              soundEngine.playBonusTrigger();
              uiController.coinFX.spawnCoins(80);
              updatePlatformHUD();
            }
          });
        } else {
          resultDiv.textContent = `⏳ ${res.reason}`;
        }
      };
    }

    // Promotions Modal
    const promosBtn = $('platform-promos-btn');
    if (promosBtn) {
      promosBtn.onclick = () => {
        soundEngine.playClick();
        renderPromotionsList();
        openModal('promos-modal');
      };
    }
    const closePromos = $('closePromosModal');
    if (closePromos) closePromos.onclick = () => closeModal('promos-modal');

    const redeemBtn = $('redeemPromoBtn');
    if (redeemBtn) {
      redeemBtn.onclick = () => {
        soundEngine.playClick();
        const code = $('promoCodeInput').value;
        const res = promotionsEngine.redeemCode(code);
        const msg = $('promoMessage');
        msg.textContent = res.message;
        msg.style.color = res.success ? '#7ad89a' : '#ff9d73';
        if (res.success) {
          updatePlatformHUD();
          renderPromotionsList();
        }
      };
    }

    function renderPromotionsList() {
      const promos = promotionsEngine.getActivePromotions();
      const list = $('promosList');
      if (list) {
        list.innerHTML = promos.map(p => `
          <div style="background:rgba(0,0,0,0.4); padding:8px; border-radius:8px; border:1px solid rgba(232,181,68,0.3); display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-weight:800; color:var(--gold-bright);">${p.title}</div>
              <div style="font-size:10px; opacity:0.8;">Code: ${p.code}</div>
            </div>
            <span style="font-weight:800; color:${p.redeemed ? '#7ad89a' : 'var(--gold)'};">${p.redeemed ? 'CLAIMED' : 'ACTIVE'}</span>
          </div>
        `).join('');
      }
    }

    // Events Modal
    const eventsBtn = $('platform-events-btn');
    if (eventsBtn) {
      eventsBtn.onclick = () => {
        soundEngine.playClick();
        const events = eventEngine.getActiveEvents();
        const container = $('eventsContainer');
        if (container) {
          container.innerHTML = events.map(e => `
            <div style="background:rgba(0,0,0,0.5); padding:10px; border-radius:10px; border:1px solid var(--gold);">
              <div style="font-weight:900; color:var(--gold-bright); font-size:14px;">${e.title}</div>
              <div style="font-size:11px; margin:4px 0;">Prize Pool: <strong>${e.prizePool}</strong> · Ends in ${e.endsInHours}h</div>
              ${e.userEntry ? `<div style="font-size:11px; color:#00f2fe;">Your Standings: Rank <strong>${e.userEntry.rank}</strong> (${e.userEntry.score.toLocaleString()} pts)</div>` : ''}
            </div>
          `).join('');
        }
        openModal('events-modal');
      };
    }
    const closeEvents = $('closeEventsModal');
    if (closeEvents) closeEvents.onclick = () => closeModal('events-modal');

    // Admin & Analytics
    const adminBtn = $('platform-admin-btn');
    if (adminBtn) {
      adminBtn.onclick = () => {
        soundEngine.playClick();
        adminPanel.show();
      };
    }

    const analyticsBtn = $('platform-analytics-btn');
    if (analyticsBtn) {
      analyticsBtn.onclick = () => {
        soundEngine.playClick();
        analyticsDashboard.show();
      };
    }

    // Localization & Theme Dropdowns
    const langSel = $('lang-select');
    if (langSel) {
      langSel.onchange = (e) => {
        i18nEngine.setLanguage(e.target.value);
      };
    }

    const themeSel = $('theme-select');
    if (themeSel) {
      themeSel.onchange = (e) => {
        themeEngine.applyTheme(e.target.value);
      };
    }
  }

  function bindEvents() {
    // Menu & Lobby
    const playBtn = $('play-game-btn');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        soundEngine.playClick();
        soundEngine.startMusic();
        const menu = $('main-menu');
        if (menu) menu.classList.add('hidden');

        const appRoot = $('app-root');
        if (appRoot) appRoot.style.display = 'none';

        const topBar = $('top-bar');
        if (topBar) topBar.style.display = 'none';
        const bottomHud = $('bottom-hud');
        if (bottomHud) bottomHud.style.display = 'none';

        const doors = $('door-container');
        if (doors) {
          doors.classList.add('open');
          setTimeout(() => doors.remove(), 1300);
        }
      });
    }

    const soundToggle = $('sound-toggle');
    if (soundToggle) {
      soundToggle.addEventListener('click', () => {
        soundEngine.unlock();
        const nowMuted = soundEngine.toggleMute();
        soundToggle.textContent = nowMuted ? '🔇' : '🔊';
        soundToggle.classList.toggle('muted', nowMuted);
      });
    }

    // Close Modal Listeners
    ['paytable-close', 'bigwin-close', 'summary-close', 'achievements-close', 'missions-close', 'levelup-close'].forEach(btnId => {
      const btn = $(btnId);
      if (btn) {
        btn.addEventListener('click', () => {
          soundEngine.playClick();
          const modal = btn.closest('.modal-overlay');
          if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('show');
          }
        });
      }
    });
  }

  function startAppLifecycle() {
    const splash = $('brand-splash');
    if (splash) {
      splash.classList.add('hidden');
      setTimeout(() => splash.remove(), 800);
    }
    initApp();
  }

  setTimeout(startAppLifecycle, 300);
})();
