/* =========================================================
   EGYPT GLOW - UI CONTROLLER & WIN CELEBRATION
   Handles Win Tiers (Small, Medium, Big, Mega, Epic, Legendary),
   Number Count-Up Animations, Modals, Paytables, Profile Views,
   Missions, Daily Rewards, and HUD Binding.
   ========================================================= */

class CoinParticleSystem {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.animating = false;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  spawnCoins(count = 60) {
    if (!this.canvas) return;
    this.canvas.style.display = 'block';
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: -20 - Math.random() * 100,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * 5 + 4,
        size: Math.random() * 9 + 10,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.25,
        color: Math.random() > 0.3 ? '#ffd873' : (Math.random() > 0.5 ? '#e8b544' : '#00f2fe')
      });
    }

    if (!this.animating) {
      this.animating = true;
      this.loop();
    }
  }

  loop() {
    if (this.particles.length === 0) {
      this.animating = false;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.canvas.style.display = 'none';
      return;
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.28;
      p.rotation += p.vRot;

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation);
      this.ctx.scale(Math.cos(p.rotation), 1);

      this.ctx.beginPath();
      this.ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.fill();
      this.ctx.strokeStyle = '#3a1a00';
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();
      this.ctx.restore();

      if (p.y > this.canvas.height + 30) {
        this.particles.splice(i, 1);
      }
    }

    requestAnimationFrame(() => this.loop());
  }
}

class UIController {
  constructor(slotEngine, soundEngine, engagementEngine, analyticsEngine) {
    this.slotEngine = slotEngine;
    this.soundEngine = soundEngine;
    this.engagement = engagementEngine;
    this.analytics = analyticsEngine;
    this.coinFX = new CoinParticleSystem('coin-fx-canvas');
  }

  getWinTier(winAmount, bet) {
    const ratio = winAmount / bet;
    if (ratio >= 100) return { name: 'Legendary Win', coins: 180, shake: 20 };
    if (ratio >= 50) return { name: 'Epic Win', coins: 130, shake: 16 };
    if (ratio >= 25) return { name: 'Mega Win', coins: 90, shake: 12 };
    if (ratio >= 10) return { name: 'Big Win', coins: 60, shake: 10 };
    if (ratio >= 3) return { name: 'Medium Win', coins: 25, shake: 6 };
    if (ratio > 0) return { name: 'Small Win', coins: 0, shake: 2 };
    return null;
  }

  async triggerWinCelebration(winAmount, bet) {
    const tier = this.getWinTier(winAmount, bet);
    if (!tier) return;

    if (tier.coins > 0) {
      this.coinFX.spawnCoins(tier.coins);
      this.soundEngine.playWinTierFanfare(tier.name);

      if (['Big Win', 'Mega Win', 'Epic Win', 'Legendary Win'].includes(tier.name)) {
        this.openWinModal(tier.name, winAmount);
      }
    }
  }

  openWinModal(tierName, winAmount) {
    const modal = document.getElementById('bigwin-modal');
    const badge = document.getElementById('win-tier-badge');
    const amountEl = document.getElementById('bigwin-amount');

    if (badge) badge.innerText = `✨ ${tierName.toUpperCase()} ✨`;

    // Stage camera shake effect
    const stage = document.getElementById('app-root');
    if (stage) {
      gsap.fromTo(stage,
        { x: -10 },
        { x: 10, duration: 0.08, repeat: 12, yoyo: true, ease: "sine.inOut", onComplete: () => gsap.set(stage, { x: 0 }) }
      );
    }

    if (amountEl) {
      amountEl.innerText = '$0.00';
      modal.classList.add('show');

      // Animate modal card bounce
      const card = modal.querySelector('.modal-card');
      if (card) {
        gsap.fromTo(card,
          { scale: 0.5, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(1.7)" }
        );
      }

      this.animateCountUp(amountEl, 0, winAmount, 2.2);
    }
  }

  animateCountUp(element, start, end, durationSeconds) {
    const obj = { val: start };
    gsap.to(obj, {
      val: end,
      duration: durationSeconds,
      ease: 'power2.out',
      onUpdate: () => {
        element.innerText = `$${obj.val.toFixed(2)}`;
      }
    });
  }

  refreshHUD() {
    document.getElementById('balance-val').innerText = this.slotEngine.balance.toFixed(2);
    document.getElementById('bet-val').innerText = this.slotEngine.bet.toFixed(2);
    document.getElementById('total-win-val').innerText = this.slotEngine.roundWin.toFixed(2);

    document.getElementById('mult-2').innerText = this.slotEngine.reelMultipliers[0] + '×';
    document.getElementById('mult-3').innerText = this.slotEngine.reelMultipliers[1] + '×';
    document.getElementById('mult-4').innerText = this.slotEngine.reelMultipliers[2] + '×';

    document.getElementById('mult-2').classList.toggle('active', this.slotEngine.reelMultipliers[0] > 1);
    document.getElementById('mult-3').classList.toggle('active', this.slotEngine.reelMultipliers[1] > 1);
    document.getElementById('mult-4').classList.toggle('active', this.slotEngine.reelMultipliers[2] > 1);

    // Profile & Level Header
    const levelEl = document.getElementById('player-level-val');
    const xpBar = document.getElementById('xp-bar-fill');
    if (levelEl) levelEl.innerText = this.engagement.level;
    if (xpBar) {
      const pct = Math.min(100, Math.floor((this.engagement.xp / this.engagement.xpToNextLevel) * 100));
      xpBar.style.width = `${pct}%`;
    }

    const fsOverlay = document.getElementById('fs-overlay');
    if (this.slotEngine.inFreeSpins) {
      fsOverlay.classList.add('show');
      document.getElementById('fs-count').innerText = this.slotEngine.fsRemaining;
    } else {
      fsOverlay.classList.remove('show');
    }
  }

  buildPaytableUI() {
    const list = document.getElementById('paytable-list');
    if (!list) return;
    list.innerHTML = '';
    Object.keys(PAYTABLE).forEach(id => {
      const sym = SYMBOLS[id];
      const pays = PAYTABLE[id];
      const row = document.createElement('div');
      row.className = 'paytable-row';
      row.innerHTML = `<div class="sym">${sym.glyph}</div><div class="desc">${sym.name}</div><div class="pay">5x: ${pays[5]}× | 4x: ${pays[4]}× | 3x: ${pays[3]}×</div>`;
      list.appendChild(row);
    });
  }

  buildAchievementsUI() {
    const grid = document.getElementById('achievements-grid');
    if (!grid) return;
    grid.innerHTML = '';

    this.engagement.achievements.forEach(ach => {
      const card = document.createElement('div');
      card.className = `achievement-card ${ach.completed ? 'completed' : ''}`;
      card.innerHTML = `
        <div class="achievement-icon">${ach.icon}</div>
        <div class="achievement-info">
          <div class="achievement-title">${ach.title}</div>
          <div class="achievement-desc">${ach.desc}</div>
        </div>
        <div class="achievement-status">${ach.completed ? 'COMPLETED ✓' : `${ach.progress}/${ach.target}`}</div>
      `;
      grid.appendChild(card);
    });
  }

  buildMissionsUI() {
    const grid = document.getElementById('missions-grid');
    if (!grid) return;
    grid.innerHTML = '';

    this.engagement.missions.forEach(m => {
      const card = document.createElement('div');
      card.className = `achievement-card ${m.completed ? 'completed' : ''}`;
      card.innerHTML = `
        <div class="achievement-icon">🎯</div>
        <div class="achievement-info">
          <div class="achievement-title">${m.desc}</div>
        </div>
        <div class="achievement-status">${m.completed ? 'COMPLETED ✓' : `${m.progress}/${m.target}`}</div>
      `;
      grid.appendChild(card);
    });
  }

  updateRecentWinsTicker() {
    const ticker = document.getElementById('ticker-content');
    if (!ticker) return;
    const wins = this.engagement.recentWins.map(w => `${w.symbol} ${w.name} won ${w.win}`).join('   ·   ');
    ticker.innerText = wins;
  }
}

window.UIController = UIController;
