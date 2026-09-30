/* =========================================================
   EGYPT GLOW - PIXIJS RENDER ENGINE
   Handles WebGL 2D symbol graphics, reel grid layouts,
   motion blur drops, wild expansion flares, scatter anticipation,
   dust particles, and screen shake effects.
   ========================================================= */

class PixiRenderer {
  constructor(holderId, slotEngine, soundEngine) {
    this.holder = document.getElementById(holderId);
    this.slotEngine = slotEngine;
    this.soundEngine = soundEngine;
    this.app = null;
    this.cellSize = 64;
    this.gridW = 0;
    this.gridH = 0;
    this.symbolTextures = {};
    this.glowTextures = {};
    this.cellSprites = [];
    this.reelContainer = null;
    this.frameBg = null;
    this.dustParticles = [];
  }

  init() {
    this.app = new PIXI.Application({
      resizeTo: this.holder,
      backgroundAlpha: 0,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
    });
    this.holder.appendChild(this.app.view);

    this.buildSymbolTextures();

    this.frameBg = new PIXI.Graphics();
    this.app.stage.addChild(this.frameBg);

    this.reelContainer = new PIXI.Container();
    this.app.stage.addChild(this.reelContainer);

    this.initDustParticles();

    this.cellSprites = Array.from({ length: REELS }, () => Array.from({ length: ROWS }, () => null));
    for (let c = 0; c < REELS; c++) {
      for (let r = 0; r < ROWS; r++) {
        const spr = new PIXI.Sprite(this.symbolTextures.ANKH);
        spr.anchor.set(0.5);
        this.reelContainer.addChild(spr);
        this.cellSprites[c][r] = spr;
      }
    }

    this.layout();
    window.addEventListener('resize', () => this.layout());

    this.app.ticker.add(() => this.updateDustParticles());
  }

  buildSymbolTextures() {
    this.symbolTextures = {};
    this.glowTextures = {};

    Object.values(SYMBOLS).forEach(sym => {
      const size = 128;

      // Base texture creation
      const g = new PIXI.Container();
      const bg = new PIXI.Graphics();
      let bgColor = 0x241608;
      let borderColor = sym.color;

      if (sym.tier === 'wild') bgColor = 0x3a2400;
      if (sym.tier === 'scatter') bgColor = 0x2a1030;
      if (sym.tier === 'special') bgColor = 0x1f0a30;

      // Card Background with outer glow frame
      bg.beginFill(bgColor, 0.94);
      bg.lineStyle(5, borderColor, 0.95);
      bg.drawRoundedRect(4, 4, size - 8, size - 8, 20);
      bg.endFill();

      // Inner gold bevel highlight
      bg.lineStyle(1.5, 0xffe9a8, 0.35);
      bg.drawRoundedRect(8, 8, size - 16, size - 16, 16);

      g.addChild(bg);

      // Symbol Text Glyph
      const txt = new PIXI.Text(sym.glyph, {
        fontFamily: 'Arial Unicode MS, Segoe UI Symbol, sans-serif',
        fontSize: sym.tier === 'low' ? 56 : 66,
        fontWeight: '900',
        fill: sym.tier === 'low' ? 0xf0e0c0 : sym.color,
        align: 'center',
        stroke: 0x000000,
        strokeThickness: sym.tier === 'low' ? 2 : 4,
        dropShadow: true,
        dropShadowColor: 0x000000,
        dropShadowBlur: 8,
        dropShadowDistance: 3
      });
      txt.anchor.set(0.5);
      txt.x = size / 2;
      txt.y = size / 2;
      g.addChild(txt);

      const rt = PIXI.RenderTexture.create({ width: size, height: size, resolution: 2 });
      this.app.renderer.render(g, { renderTexture: rt });
      this.symbolTextures[sym.id] = rt;

      // Glow / Win Highlight Texture
      const glowContainer = new PIXI.Container();
      const glowBg = new PIXI.Graphics();
      glowBg.beginFill(0xffd873, 0.35);
      glowBg.lineStyle(6, 0xffffff, 1);
      glowBg.drawRoundedRect(2, 2, size - 4, size - 4, 22);
      glowBg.endFill();
      glowContainer.addChild(glowBg);
      glowContainer.addChild(g);

      const glowRt = PIXI.RenderTexture.create({ width: size, height: size, resolution: 2 });
      this.app.renderer.render(glowContainer, { renderTexture: glowRt });
      this.glowTextures[sym.id] = glowRt;
    });
  }

  layout() {
    if (!this.app) return;
    const w = this.holder.clientWidth;
    const h = this.holder.clientHeight;
    this.app.renderer.resize(w, h);

    const padding = 12;
    const maxCellW = (w - padding * 2) / REELS;
    const maxCellH = (h - padding * 2) / ROWS;
    this.cellSize = Math.floor(Math.min(maxCellW, maxCellH));

    this.gridW = this.cellSize * REELS;
    this.gridH = this.cellSize * ROWS;

    const startX = (w - this.gridW) / 2;
    const startY = (h - this.gridH) / 2;

    this.reelContainer.x = startX;
    this.reelContainer.y = startY;

    this.frameBg.clear();
    this.frameBg.beginFill(0x120a05, 0.8);
    this.frameBg.lineStyle(4, 0xe8b544, 0.9);
    this.frameBg.drawRoundedRect(startX - 8, startY - 8, this.gridW + 16, this.gridH + 16, 18);
    this.frameBg.endFill();

    for (let c = 0; c < REELS; c++) {
      for (let r = 0; r < ROWS; r++) {
        const spr = this.cellSprites[c][r];
        if (spr) {
          spr.width = this.cellSize - 4;
          spr.height = this.cellSize - 4;
          spr.x = c * this.cellSize + this.cellSize / 2;
          spr.y = r * this.cellSize + this.cellSize / 2;
        }
      }
    }
  }

  renderGridInstant(g) {
    for (let c = 0; c < REELS; c++) {
      for (let r = 0; r < ROWS; r++) {
        const sym = g[c][r];
        if (sym && this.cellSprites[c][r]) {
          this.cellSprites[c][r].texture = this.symbolTextures[sym];
          this.cellSprites[c][r].alpha = 1;
          this.cellSprites[c][r].scale.set((this.cellSize - 4) / 128);
        }
      }
    }
  }

  initDustParticles() {
    this.dustParticles = [];
    const dustContainer = new PIXI.Container();
    this.app.stage.addChild(dustContainer);

    for (let i = 0; i < 35; i++) {
      const p = new PIXI.Graphics();
      p.beginFill(0xffd873, Math.random() * 0.5 + 0.1);
      p.drawCircle(0, 0, Math.random() * 2.5 + 1);
      p.endFill();
      p.x = Math.random() * window.innerWidth;
      p.y = Math.random() * window.innerHeight;
      p.vx = (Math.random() - 0.5) * 0.5;
      p.vy = -Math.random() * 0.6 - 0.2;
      dustContainer.addChild(p);
      this.dustParticles.push(p);
    }
  }

  updateDustParticles() {
    this.dustParticles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < 0) {
        p.y = window.innerHeight;
        p.x = Math.random() * window.innerWidth;
      }
    });
  }

  async animateDropIn(g, turboMode) {
    this.renderGridInstant(g);
    const promises = [];
    const duration = turboMode ? 0.12 : 0.32;
    const delayStep = turboMode ? 0.01 : 0.035;

    for (let c = 0; c < REELS; c++) {
      for (let r = 0; r < ROWS; r++) {
        const spr = this.cellSprites[c][r];
        const targetY = r * this.cellSize + this.cellSize / 2;
        spr.y = targetY - this.gridH - 120;

        // Motion Blur Scale
        spr.scale.y = ((this.cellSize - 4) / 128) * 1.3;

        promises.push(new Promise(res => {
          gsap.to(spr, {
            y: targetY,
            duration: duration + c * (turboMode ? 0.01 : 0.04),
            ease: turboMode ? 'power2.out' : 'back.out(1.2)',
            delay: r * delayStep,
            onUpdate: () => {
              if (Math.abs(spr.y - targetY) < 10) {
                spr.scale.y = (this.cellSize - 4) / 128;
              }
            },
            onComplete: () => {
              spr.scale.set((this.cellSize - 4) / 128);
              if (r === ROWS - 1) this.soundEngine.playReelStop();
              res();
            }
          });
        }));
      }
    }
    await Promise.all(promises);
  }

  async animateDissolve(winningCells) {
    const promises = [];
    winningCells.forEach(key => {
      const [c, r] = key.split(',').map(Number);
      const spr = this.cellSprites[c][r];
      const sym = this.slotEngine.grid[c][r];
      if (sym && this.glowTextures[sym]) {
        spr.texture = this.glowTextures[sym];
      }

      promises.push(new Promise(res => {
        gsap.timeline({ onComplete: res })
          .to(spr.scale, { x: ((this.cellSize - 4) / 128) * 1.15, y: ((this.cellSize - 4) / 128) * 1.15, duration: 0.12 })
          .to(spr.scale, { x: 0, y: 0, duration: 0.22, ease: 'back.in(1.4)' });
      }));
    });
    await Promise.all(promises);
  }

  async animateWildExpansion(cols) {
    if (cols.length === 0) return;
    const flashes = cols.map(c => {
      const flare = new PIXI.Graphics();
      flare.beginFill(0xffd873, 0.6);
      flare.lineStyle(3, 0xffffff, 1);
      flare.drawRoundedRect(c * this.cellSize, 0, this.cellSize, this.gridH, 12);
      flare.endFill();
      flare.alpha = 0;
      this.reelContainer.addChild(flare);

      return new Promise(res => {
        gsap.timeline({ onComplete: () => { this.reelContainer.removeChild(flare); res(); } })
          .to(flare, { alpha: 1, duration: 0.15, ease: 'power2.in' })
          .to(flare, { alpha: 0, duration: 0.25, ease: 'power2.out' });
      });
    });

    await Promise.all(flashes);
  }

  triggerScreenShake(intensity = 8, duration = 0.35) {
    const stage = document.getElementById('stage-wrap');
    gsap.fromTo(stage,
      { x: 0, y: 0 },
      {
        x: () => (Math.random() - 0.5) * intensity,
        y: () => (Math.random() - 0.5) * intensity,
        duration: 0.04,
        repeat: Math.floor(duration / 0.04),
        yoyo: true,
        ease: 'power1.inOut',
        onComplete: () => gsap.set(stage, { x: 0, y: 0 })
      }
    );
  }
}

window.PixiRenderer = PixiRenderer;
