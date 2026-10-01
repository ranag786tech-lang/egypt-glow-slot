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

  async function executeSpinSequence() {
    if (isSpinning) return;

    const betAmount = slotEngine.bet;
    if (!slotEngine.inFreeSpins && !walletEngine.deduct(betAmount, 'SPIN_BET')) {
      const balVal = $('balance-val');
      if (balVal) gsap.fromTo(balVal, { color: '#f43f5e' }, { color: '#ffd873', duration: 0.6 });
      return;
    }

    isSpinning = true;
    const spinBtn = $('spin-btn');
    if (spinBtn) spinBtn.classList.add('spinning');
    soundEngine.startSpinLoop();

    if (!slotEngine.inFreeSpins) {
      slotEngine.roundWin = 0;
      slotEngine.resetMultipliers();
    }

    updatePlatformHUD();

    slotEngine.grid = slotEngine.fillGrid(null);
    await pixiRenderer.animateDropIn(slotEngine.grid, turboMode);
    soundEngine.stopSpinLoop();

    // Random Event Check (Ra's Blessing - Config Dependent)
    if (configEngine.getConfig().featureFlags.rasBlessing && !slotEngine.inFreeSpins && Math.random() < 0.05) {
      await new Promise(res => {
        bonusEngine.triggerRandomEvent((evt) => {
          if (evt.type === 'MULT_BOOST') slotEngine.bumpMultiplier();
          res();
        });
      });
    }

    // Mystery Transformations
    if (configEngine.getConfig().featureFlags.mysterySymbols) {
      const mysterySym = slotEngine.transformMysterySymbols(slotEngine.grid);
      if (mysterySym) {
        pixiRenderer.renderGridInstant(slotEngine.grid);
        soundEngine.playCascade();
      }
    }

    let cascadeCount = 0;
    let spinWinAmount = 0;

    while (true) {
      if (configEngine.getConfig().featureFlags.expandingWilds) {
        const expandedCols = slotEngine.expandWilds(slotEngine.grid);
        if (expandedCols.length > 0) {
          await pixiRenderer.animateWildExpansion(expandedCols);
          pixiRenderer.renderGridInstant(slotEngine.grid);
        }
      }

      const { wins, winningCells, totalPay } = slotEngine.evaluateWins(slotEngine.grid);
      if (wins.length === 0) break;

      cascadeCount++;
      if (cascadeCount > 1) {
        slotEngine.bumpMultiplier();
        soundEngine.playCascade();
      }

      const mult = slotEngine.effectiveMultiplier();
      const payWithMult = totalPay * mult;
      spinWinAmount += payWithMult;
      slotEngine.roundWin += payWithMult;
      if (slotEngine.inFreeSpins) slotEngine.fsTotalWin += payWithMult;

      walletEngine.add(payWithMult, 'SPIN_WIN');

      const winAmt = $('win-amt');
      if (winAmt) winAmt.innerText = slotEngine.roundWin.toFixed(2);
      const winBanner = $('win-banner');
      if (winBanner) winBanner.classList.add('show');
      soundEngine.playWinChime(cascadeCount);

      await uiController.triggerWinCelebration(payWithMult, slotEngine.bet);
      updatePlatformHUD();

      await pixiRenderer.animateDissolve(winningCells);

      winningCells.forEach(key => {
        const [c, r] = key.split(',').map(Number);
        slotEngine.grid[c][r] = null;
      });

      slotEngine.applyGravity(slotEngine.grid);
      slotEngine.fillGrid(slotEngine.grid);
      await pixiRenderer.animateDropIn(slotEngine.grid, turboMode);
    }

    // VIP XP & Live Event Progression
    vipEngine.addXP(slotEngine.bet * 10);
    eventEngine.recordSpinWin(spinWinAmount);

    // Record Analytics & Engagement
    analyticsEngine.trackSpin(slotEngine.bet, spinWinAmount);
    const engResult = engagementEngine.recordSpin(
      slotEngine.bet,
      spinWinAmount,
      cascadeCount > 1,
      slotEngine.inFreeSpins
    );

    if (engResult.xpResult.leveledUp) {
      soundEngine.playLevelUp();
      openModal('levelup-modal');
      const lvlNum = $('levelup-num');
      if (lvlNum) lvlNum.innerText = engResult.xpResult.level;
    }

    let fsTriggeredThisSpin = false;

    // Scatter Free Spins Trigger
    if (configEngine.getConfig().featureFlags.freeSpins) {
      const scatters = slotEngine.countScatters(slotEngine.grid);
      if (scatters >= 3 && !slotEngine.inFreeSpins) {
        slotEngine.inFreeSpins = true;
        slotEngine.fsRemaining = 8;
        slotEngine.fsTotalWin = 0;
        fsTriggeredThisSpin = true;
        soundEngine.playBonusTrigger();
        analyticsEngine.trackBonusTrigger('FREE_SPINS');
        openModal('bigwin-modal');
        const bigwinAmt = $('bigwin-amount');
        if (bigwinAmt) bigwinAmt.innerText = "8 FREE SPINS!";
      }
    }

    // Pick Bonus Trigger
    if (configEngine.getConfig().featureFlags.pickBonus && !slotEngine.inFreeSpins && slotEngine.roundWin === 0 && Math.random() < 0.03) {
      analyticsEngine.trackBonusTrigger('PICK_BONUS');
      await new Promise(res => {
        bonusEngine.triggerPickBonus(() => res());
      });
    }

    if (slotEngine.inFreeSpins && !fsTriggeredThisSpin) {
      slotEngine.fsRemaining--;
      if (slotEngine.fsRemaining <= 0) {
        slotEngine.inFreeSpins = false;
        openModal('summary-modal');
        const sumAmt = $('summary-amount');
        if (sumAmt) sumAmt.innerText = slotEngine.fsTotalWin.toFixed(2);
        uiController.coinFX.spawnCoins(120);
      }
    }

    if (spinBtn) spinBtn.classList.remove('spinning');
    isSpinning = false;
    updatePlatformHUD();

    if (autoSpin && (!slotEngine.inFreeSpins || slotEngine.fsRemaining > 0)) {
      setTimeout(executeSpinSequence, turboMode ? 150 : 600);
    }
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

        const doors = $('door-container');
        if (doors) {
          doors.classList.add('open');
          setTimeout(() => doors.remove(), 1300);
        }
      });
    }

    const spinBtn = $('spin-btn');
    if (spinBtn) {
      spinBtn.addEventListener('click', () => {
        soundEngine.playClick();
        executeSpinSequence();
      });
    }

    const betPlus = $('bet-plus');
    if (betPlus) {
      betPlus.addEventListener('click', () => {
        soundEngine.playClick();
        if (!isSpinning) {
          slotEngine.incBet();
          uiController.refreshHUD();
        }
      });
    }

    const betMinus = $('bet-minus');
    if (betMinus) {
      betMinus.addEventListener('click', () => {
        soundEngine.playClick();
        if (!isSpinning) {
          slotEngine.decBet();
          uiController.refreshHUD();
        }
      });
    }

    const turboBtn = $('turbo-btn');
    if (turboBtn) {
      turboBtn.addEventListener('click', () => {
        soundEngine.playClick();
        turboMode = !turboMode;
        turboBtn.classList.toggle('on', turboMode);
      });
    }

    const autoBtn = $('auto-btn');
    if (autoBtn) {
      autoBtn.addEventListener('click', () => {
        soundEngine.playClick();
        autoSpin = !autoSpin;
        autoBtn.classList.toggle('on', autoSpin);
        if (autoSpin && !isSpinning) executeSpinSequence();
      });
    }

    const infoBtn = $('info-btn');
    if (infoBtn) {
      infoBtn.addEventListener('click', () => {
        soundEngine.playClick();
        uiController.buildPaytableUI();
        openModal('paytable-modal');
      });
    }

    const achBtn = $('achievements-btn');
    if (achBtn) {
      achBtn.addEventListener('click', () => {
        soundEngine.playClick();
        uiController.buildAchievementsUI();
        openModal('achievements-modal');
      });
    }

    const missBtn = $('missions-btn');
    if (missBtn) {
      missBtn.addEventListener('click', () => {
        soundEngine.playClick();
        uiController.buildMissionsUI();
        openModal('missions-modal');
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
