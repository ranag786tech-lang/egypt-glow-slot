/* =========================================================
   EGYPT GLOW V2 - PHYSICAL REEL ENGINE & STATE MACHINE
   State machine with Scatter anticipation & physical reel physics
   ========================================================= */

import { globalEventBus } from './eventBus.js';
import { gameState } from './gameState.js';

export const REEL_STATES = {
  IDLE: 'IDLE',
  STARTING: 'STARTING',
  ACCELERATING: 'ACCELERATING',
  SPINNING: 'SPINNING',
  ANTICIPATING: 'ANTICIPATING',
  DECELERATING: 'DECELERATING',
  STOPPING: 'STOPPING',
  LANDING: 'LANDING',
  EVALUATING: 'EVALUATING',
  WIN_PRESENTATION: 'WIN_PRESENTATION'
};

export class ReelEngine {
  constructor(slotEngine, pixiRenderer) {
    this.slotEngine = slotEngine;
    this.pixiRenderer = pixiRenderer;
    this.state = REEL_STATES.IDLE;
    this.scatterCount = 0;
  }

  setState(newState, payload = {}) {
    this.state = newState;
    globalEventBus.emit('REEL_STATE_CHANGED', { state: newState, ...payload });
  }

  async spinSequence(turbo = false) {
    if (this.state !== REEL_STATES.IDLE) return;

    // 1. STARTING
    this.setState(REEL_STATES.STARTING);
    this.scatterCount = 0;
    gameState.totalSpins++;
    globalEventBus.emit('SPIN_START');

    // 2. ACCELERATING
    this.setState(REEL_STATES.ACCELERATING);
    if (window.gsap) {
      const container = document.getElementById('v2-pixi-holder');
      if (container) {
        gsap.to(container, { y: 4, duration: 0.1, yoyo: true, repeat: 1 });
      }
    }

    // 3. SPINNING
    this.setState(REEL_STATES.SPINNING);
    this.slotEngine.grid = this.slotEngine.fillGrid(null);

    // Analyze target grid for scatters across columns
    const scattersPerCol = [];
    for (let c = 0; c < 5; c++) {
      let colScatters = 0;
      for (let r = 0; r < 5; r++) {
        const sym = this.slotEngine.grid[c][r];
        if (sym === 'SCATTER' || sym === 'scatter' || sym === 'PYRAMID') {
          colScatters++;
        }
      }
      scattersPerCol.push(colScatters);
    }

    // Spin reels sequentially with Scatter Anticipation
    for (let c = 0; c < 5; c++) {
      const hasAnticipation = !turbo && this.scatterCount >= 2 && c >= 2;

      if (hasAnticipation) {
        // 4. ANTICIPATING
        this.setState(REEL_STATES.ANTICIPATING, { colIndex: c });
        globalEventBus.emit('SCATTER_ANTICIPATION', { colIndex: c });

        // Slowdown delay curve for tension
        await new Promise(res => setTimeout(res, 800));
      }

      // 5. DECELERATING & STOPPING
      this.setState(REEL_STATES.DECELERATING, { colIndex: c });
      await this.pixiRenderer.animateColumnDrop(c, this.slotEngine.grid[c], turbo);

      // 6. LANDING
      this.setState(REEL_STATES.LANDING, { colIndex: c });

      if (scattersPerCol[c] > 0) {
        this.scatterCount += scattersPerCol[c];
        globalEventBus.emit('SCATTER_LANDED', { colIndex: c, count: this.scatterCount });

        if (window.gsap && !gameState.reducedMotion) {
          const container = document.getElementById('v2-pixi-holder');
          if (container) {
            gsap.fromTo(container, { y: -8 }, { y: 0, duration: 0.25, ease: 'bounce.out' });
          }
        }
      } else {
        globalEventBus.emit('REEL_STOPPED', { reelIndex: c, isLast: c === 4 });
      }
    }

    // 7. EVALUATING & CASCADING LOOP
    this.setState(REEL_STATES.EVALUATING);
    let cascadeCount = 0;
    let roundTotalWin = 0;

    while (true) {
      if (this.slotEngine.featureFlags?.expandingWilds) {
        const expandedCols = this.slotEngine.expandWilds(this.slotEngine.grid);
        if (expandedCols.length > 0) {
          await this.pixiRenderer.animateWildExpansion(expandedCols);
          this.pixiRenderer.renderGridInstant(this.slotEngine.grid);
        }
      }

      const { wins, winningCells, totalPay } = this.slotEngine.evaluateWins(this.slotEngine.grid);
      if (wins.length === 0) break;

      cascadeCount++;
      if (cascadeCount > 1) {
        this.slotEngine.bumpMultiplier();
      }

      const mult = this.slotEngine.effectiveMultiplier();
      const payWithMult = totalPay * mult;
      roundTotalWin += payWithMult;

      // 8. WIN PRESENTATION
      this.setState(REEL_STATES.WIN_PRESENTATION);
      globalEventBus.emit('WIN_DETECTED', { wins, pay: payWithMult });
      globalEventBus.emit('WIN_CELEBRATION', { totalWin: payWithMult, betAmount: this.slotEngine.bet });

      // Dissolve winning cells
      await this.pixiRenderer.animateDissolve(winningCells);

      winningCells.forEach(key => {
        const [c, r] = key.split(',').map(Number);
        this.slotEngine.grid[c][r] = null;
      });

      // Apply gravity & cascade drop
      this.slotEngine.applyGravity(this.slotEngine.grid);
      this.slotEngine.fillGrid(this.slotEngine.grid);
      await this.pixiRenderer.animateDropIn(this.slotEngine.grid, turbo);
    }

    // Award XP and Glow Points
    gameState.addXP(this.slotEngine.bet * 10);

    // Scatter Bonus Check
    if (this.scatterCount >= 3) {
      globalEventBus.emit('BONUS_TRIGGERED', { count: this.scatterCount });
    }

    // 9. IDLE
    this.setState(REEL_STATES.IDLE);
  }
}
