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

  function initApp() {
    pixiRenderer = new window.PixiRenderer('pixi-holder', slotEngine, soundEngine);
    pixiRenderer.init();

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
  }

  function updatePlatformHUD() {
    // Wallet Sync
    const currentBal = walletEngine.getBalance();
    slotEngine.balance = currentBal;
    $('balance-val').innerText = currentBal.toFixed(2);

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
      gsap.fromTo($('balance-val'), { color: '#f43f5e' }, { color: '#ffd873', duration: 0.6 });
      return;
    }

    isSpinning = true;
    $('spin-btn').classList.add('spinning');
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
      slotEngine.roundWin += payWithMult;
      if (slotEngine.inFreeSpins) slotEngine.fsTotalWin += payWithMult;

      walletEngine.add(payWithMult, 'SPIN_WIN');

      $('win-amt').innerText = slotEngine.roundWin.toFixed(2);
      $('win-banner').classList.add('show');
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
    eventEngine.recordSpinWin(slotEngine.roundWin);

    // Record Analytics & Engagement
    analyticsEngine.trackSpin(slotEngine.bet, slotEngine.roundWin);
    const engResult = engagementEngine.recordSpin(
      slotEngine.bet,
      slotEngine.roundWin,
      cascadeCount > 1,
      slotEngine.inFreeSpins
    );

    if (engResult.xpResult.leveledUp) {
      soundEngine.playLevelUp();
      openModal('levelup-modal');
      $('levelup-num').innerText = engResult.xpResult.level;
    }

    // Scatter Free Spins Trigger
    if (configEngine.getConfig().featureFlags.freeSpins) {
      const scatters = slotEngine.countScatters(slotEngine.grid);
      if (scatters >= 3 && !slotEngine.inFreeSpins) {
        slotEngine.inFreeSpins = true;
        slotEngine.fsRemaining = 8;
        slotEngine.fsTotalWin = 0;
        soundEngine.playBonusTrigger();
        analyticsEngine.trackBonusTrigger('FREE_SPINS');
        openModal('bigwin-modal');
        $('bigwin-amount').innerText = "8 FREE SPINS!";
      }
    }

    // Pick Bonus Trigger
    if (configEngine.getConfig().featureFlags.pickBonus && !slotEngine.inFreeSpins && slotEngine.roundWin === 0 && Math.random() < 0.03) {
      analyticsEngine.trackBonusTrigger('PICK_BONUS');
      await new Promise(res => {
        bonusEngine.triggerPickBonus(() => res());
      });
    }

    if (slotEngine.inFreeSpins) {
      slotEngine.fsRemaining--;
      if (slotEngine.fsRemaining <= 0) {
        slotEngine.inFreeSpins = false;
        openModal('summary-modal');
        $('summary-amount').innerText = slotEngine.fsTotalWin.toFixed(2);
        uiController.coinFX.spawnCoins(120);
      }
    }

    $('spin-btn').classList.remove('spinning');
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
    $('platform-wallet-btn').onclick = () => {
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
    $('closeWalletModal').onclick = () => closeModal('wallet-modal');

    // Reward Center Modal
    $('platform-rewards-btn').onclick = () => {
      soundEngine.playClick();
      openModal('rewards-modal');
    };
    $('closeRewardsModal').onclick = () => closeModal('rewards-modal');

    $('spinWheelBtn').onclick = () => {
      soundEngine.playClick();
      const res = rewardCenter.spinDailyWheel();
      const resultDiv = $('wheelRewardResult');
      if (res.success) {
        resultDiv.textContent = `🎉 You won ${res.reward.value} ${res.reward.type}!`;
        updatePlatformHUD();
      } else {
        resultDiv.textContent = `⏳ ${res.reason}`;
      }
    };

    // Promotions Modal
    $('platform-promos-btn').onclick = () => {
      soundEngine.playClick();
      renderPromotionsList();
      openModal('promos-modal');
    };
    $('closePromosModal').onclick = () => closeModal('promos-modal');

    $('redeemPromoBtn').onclick = () => {
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

    function renderPromotionsList() {
      const promos = promotionsEngine.getActivePromotions();
      $('promosList').innerHTML = promos.map(p => `
        <div style="background:rgba(0,0,0,0.4); padding:8px; border-radius:8px; border:1px solid rgba(232,181,68,0.3); display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-weight:800; color:var(--gold-bright);">${p.title}</div>
            <div style="font-size:10px; opacity:0.8;">Code: ${p.code}</div>
          </div>
          <span style="font-weight:800; color:${p.redeemed ? '#7ad89a' : 'var(--gold)'};">${p.redeemed ? 'CLAIMED' : 'ACTIVE'}</span>
        </div>
      `).join('');
    }

    // Events Modal
    $('platform-events-btn').onclick = () => {
      soundEngine.playClick();
      const events = eventEngine.getActiveEvents();
      $('eventsContainer').innerHTML = events.map(e => `
        <div style="background:rgba(0,0,0,0.5); padding:10px; border-radius:10px; border:1px solid var(--gold);">
          <div style="font-weight:900; color:var(--gold-bright); font-size:14px;">${e.title}</div>
          <div style="font-size:11px; margin:4px 0;">Prize Pool: <strong>${e.prizePool}</strong> · Ends in ${e.endsInHours}h</div>
          ${e.userEntry ? `<div style="font-size:11px; color:#00f2fe;">Your Standings: Rank <strong>${e.userEntry.rank}</strong> (${e.userEntry.score.toLocaleString()} pts)</div>` : ''}
        </div>
      `).join('');
      openModal('events-modal');
    };
    $('closeEventsModal').onclick = () => closeModal('events-modal');

    // Admin & Analytics
    $('platform-admin-btn').onclick = () => {
      soundEngine.playClick();
      adminPanel.show();
    };

    $('platform-analytics-btn').onclick = () => {
      soundEngine.playClick();
      analyticsDashboard.show();
    };

    // Localization & Theme Dropdowns
    $('lang-select').onchange = (e) => {
      i18nEngine.setLanguage(e.target.value);
    };

    $('theme-select').onchange = (e) => {
      themeEngine.applyTheme(e.target.value);
    };
  }

  function bindEvents() {
    // Menu & Lobby
    $('play-game-btn').addEventListener('click', () => {
      soundEngine.playClick();
      soundEngine.startMusic();
      $('main-menu').classList.add('hidden');

      const doors = $('door-container');
      if (doors) {
        doors.classList.add('open');
        setTimeout(() => doors.remove(), 1300);
      }
    });

    $('spin-btn').addEventListener('click', () => {
      soundEngine.playClick();
      executeSpinSequence();
    });

    $('bet-plus').addEventListener('click', () => {
      soundEngine.playClick();
      if (!isSpinning) {
        slotEngine.incBet();
        uiController.refreshHUD();
      }
    });

    $('bet-minus').addEventListener('click', () => {
      soundEngine.playClick();
      if (!isSpinning) {
        slotEngine.decBet();
        uiController.refreshHUD();
      }
    });

    $('turbo-btn').addEventListener('click', () => {
      soundEngine.playClick();
      turboMode = !turboMode;
      $('turbo-btn').classList.toggle('on', turboMode);
    });

    $('auto-btn').addEventListener('click', () => {
      soundEngine.playClick();
      autoSpin = !autoSpin;
      $('auto-btn').classList.toggle('on', autoSpin);
      if (autoSpin && !isSpinning) executeSpinSequence();
    });

    $('info-btn').addEventListener('click', () => {
      soundEngine.playClick();
      uiController.buildPaytableUI();
      openModal('paytable-modal');
    });

    $('achievements-btn').addEventListener('click', () => {
      soundEngine.playClick();
      uiController.buildAchievementsUI();
      openModal('achievements-modal');
    });

    $('missions-btn').addEventListener('click', () => {
      soundEngine.playClick();
      uiController.buildMissionsUI();
      openModal('missions-modal');
    });

    $('sound-toggle').addEventListener('click', () => {
      soundEngine.unlock();
      const nowMuted = soundEngine.toggleMute();
      $('sound-toggle').textContent = nowMuted ? '🔇' : '🔊';
      $('sound-toggle').classList.toggle('muted', nowMuted);
    });

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
