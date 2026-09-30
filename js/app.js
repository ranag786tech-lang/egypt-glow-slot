/* =========================================================
   EGYPT GLOW - MAIN APPLICATION LOGIC & CONTROLLER
   Integrates SoundEngine, SlotEngine, PixiRenderer, EngagementEngine,
   BonusEngine, AnalyticsEngine, and UIController.
   ========================================================= */

(function () {
  "use strict";

  const $ = id => document.getElementById(id);

  // Initialize Engines
  const slotEngine = new window.SlotEngine();
  const soundEngine = window.soundEngine;
  const engagementEngine = new window.EngagementEngine();
  const analyticsEngine = new window.AnalyticsEngine();
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

    bindEvents();
  }

  async function executeSpinSequence() {
    if (isSpinning) return;

    if (!slotEngine.inFreeSpins && slotEngine.balance < slotEngine.bet) {
      gsap.fromTo($('balance-val'), { color: '#f43f5e' }, { color: '#ffd873', duration: 0.6 });
      return;
    }

    isSpinning = true;
    $('spin-btn').classList.add('spinning');
    soundEngine.startSpinLoop();

    if (!slotEngine.inFreeSpins) {
      slotEngine.balance -= slotEngine.bet;
      slotEngine.roundWin = 0;
      slotEngine.resetMultipliers();
    }

    uiController.refreshHUD();

    slotEngine.grid = slotEngine.fillGrid(null);
    await pixiRenderer.animateDropIn(slotEngine.grid, turboMode);
    soundEngine.stopSpinLoop();

    // Random Event Check (5% chance on base spins)
    if (!slotEngine.inFreeSpins && Math.random() < 0.05) {
      await new Promise(res => {
        bonusEngine.triggerRandomEvent((evt) => {
          if (evt.type === 'MULT_BOOST') slotEngine.bumpMultiplier();
          res();
        });
      });
    }

    // Mystery Transformations
    const mysterySym = slotEngine.transformMysterySymbols(slotEngine.grid);
    if (mysterySym) {
      pixiRenderer.renderGridInstant(slotEngine.grid);
      soundEngine.playCascade();
    }

    let cascadeCount = 0;
    while (true) {
      const expandedCols = slotEngine.expandWilds(slotEngine.grid);
      if (expandedCols.length > 0) {
        await pixiRenderer.animateWildExpansion(expandedCols);
        pixiRenderer.renderGridInstant(slotEngine.grid);
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
      slotEngine.balance += payWithMult;

      $('win-amt').innerText = slotEngine.roundWin.toFixed(2);
      $('win-banner').classList.add('show');
      soundEngine.playWinChime(cascadeCount);

      await uiController.triggerWinCelebration(payWithMult, slotEngine.bet);
      uiController.refreshHUD();

      await pixiRenderer.animateDissolve(winningCells);

      winningCells.forEach(key => {
        const [c, r] = key.split(',').map(Number);
        slotEngine.grid[c][r] = null;
      });

      slotEngine.applyGravity(slotEngine.grid);
      slotEngine.fillGrid(slotEngine.grid);
      await pixiRenderer.animateDropIn(slotEngine.grid, turboMode);
    }

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

    // Optional Pick Bonus Trigger (3% chance on non-winning spins)
    if (!slotEngine.inFreeSpins && slotEngine.roundWin === 0 && Math.random() < 0.03) {
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
    uiController.refreshHUD();

    if (autoSpin && (!slotEngine.inFreeSpins || slotEngine.fsRemaining > 0)) {
      setTimeout(executeSpinSequence, turboMode ? 150 : 600);
    }
  }

  function openModal(id) {
    const el = $(id);
    if (el) el.classList.add('show');
  }

  function closeModal(id) {
    const el = $(id);
    if (el) el.classList.remove('show');
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
          if (modal) modal.classList.remove('show');
        });
      }
    });
  }

  window.addEventListener('load', () => {
    setTimeout(() => {
      const splash = $('brand-splash');
      if (splash) {
        splash.classList.add('hidden');
        setTimeout(() => splash.remove(), 800);
      }
    }, 2000);

    initApp();
  });
})();
