/* =========================================================
   EGYPT GLOW - SLOT MATH ENGINE & CONFIG
   Handles symbol definitions, paytables, weighted rng,
   grid calculations, cascading logic, and RTP balancing.
   ========================================================= */

const REELS = 5;
const ROWS = 5;

const SYMBOLS = {
  PHARAOH: { id: 'PHARAOH', glyph: '👑', color: 0xffd873, tier: 'high', name: 'Golden Pharaoh', payFactor: 10.0 },
  QUEEN:   { id: 'QUEEN',   glyph: '👸', color: 0xe85a9d, tier: 'high', name: 'Queen Cleopatra', payFactor: 8.0 },
  SCARAB:  { id: 'SCARAB',  glyph: '🪲', color: 0x00f2fe, tier: 'high', name: 'Jeweled Scarab', payFactor: 6.0 },
  HORUS:   { id: 'HORUS',   glyph: '🦅', color: 0xc8203f, tier: 'high', name: 'Eye of Horus', payFactor: 5.0 },
  ANUBIS:  { id: 'ANUBIS',  glyph: '🐕', color: 0x1c3d6e, tier: 'high', name: 'Anubis Idol', payFactor: 4.0 },
  CAT:     { id: 'CAT',     glyph: '🐱', color: 0xff9d3c, tier: 'high', name: 'Bastet Cat', payFactor: 3.5 },
  ANKH:    { id: 'ANKH',    glyph: '☥', color: 0x1f7a4d, tier: 'low',  name: 'Golden Ankh', payFactor: 2.0 },
  CHEST:   { id: 'CHEST',   glyph: '💎', color: 0xd8a040, tier: 'low',  name: 'Treasure Chest', payFactor: 1.8 },
  A:       { id: 'A',       glyph: 'A', color: 0xd8c090, tier: 'low',  name: 'Royal A', payFactor: 1.2 },
  K:       { id: 'K',       glyph: 'K', color: 0xd8c090, tier: 'low',  name: 'Royal K', payFactor: 1.0 },
  Q:       { id: 'Q',       glyph: 'Q', color: 0xd8c090, tier: 'low',  name: 'Royal Q', payFactor: 0.8 },
  J:       { id: 'J',       glyph: 'J', color: 0xd8c090, tier: 'low',  name: 'Royal J', payFactor: 0.6 },
  WILD:    { id: 'WILD',    glyph: '☀', color: 0xffcf3c, tier: 'wild', name: 'Solar Orb Wild' },
  SCATTER: { id: 'SCATTER', glyph: '🏛️', color: 0xff733c, tier: 'scatter', name: 'Pyramid Scatter' },
  MYSTERY: { id: 'MYSTERY', glyph: '❓', color: 0xa85aff, tier: 'special', name: 'Mystery Symbol' }
};

const PAYTABLE = {
  PHARAOH: { 5: 10.0, 4: 4.0, 3: 1.5 },
  QUEEN:   { 5: 8.0,  4: 3.0, 3: 1.2 },
  SCARAB:  { 5: 6.0,  4: 2.5, 3: 1.0 },
  HORUS:   { 5: 5.0,  4: 2.0, 3: 0.8 },
  ANUBIS:  { 5: 4.0,  4: 1.6, 3: 0.6 },
  CAT:     { 5: 3.5,  4: 1.4, 3: 0.5 },
  ANKH:    { 5: 2.0,  4: 0.8, 3: 0.3 },
  CHEST:   { 5: 1.8,  4: 0.7, 3: 0.25 },
  A:       { 5: 1.2,  4: 0.5, 3: 0.2 },
  K:       { 5: 1.0,  4: 0.4, 3: 0.15 },
  Q:       { 5: 0.8,  4: 0.3, 3: 0.12 },
  J:       { 5: 0.6,  4: 0.2, 3: 0.10 }
};

const BASE_WEIGHTS = [
  ['PHARAOH', 2], ['QUEEN', 3], ['SCARAB', 4], ['HORUS', 5],
  ['ANUBIS', 6], ['CAT', 7], ['ANKH', 9], ['CHEST', 9],
  ['A', 11], ['K', 12], ['Q', 13], ['J', 14],
  ['WILD', 3], ['SCATTER', 3], ['MYSTERY', 2]
];

const FS_WEIGHTS = [
  ['PHARAOH', 4], ['QUEEN', 5], ['SCARAB', 6], ['HORUS', 7],
  ['ANUBIS', 8], ['CAT', 9], ['ANKH', 10], ['CHEST', 10],
  ['A', 10], ['K', 10], ['Q', 11], ['J', 11],
  ['WILD', 5], ['SCATTER', 2], ['MYSTERY', 4]
];

function weightedPick(table) {
  const total = table.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [sym, w] of table) {
    if (r < w) return sym;
    r -= w;
  }
  return table[0][0];
}

class SlotEngine {
  constructor() {
    this.balance = 1000.00;
    this.bet = 1.00;
    this.betLevels = [0.2, 0.5, 1.0, 2.0, 5.0, 10.0, 25.0, 50.0, 100.0];
    this.grid = this._emptyGrid();
    this.reelMultipliers = [1, 1, 1];
    this.inFreeSpins = false;
    this.fsRemaining = 0;
    this.fsTotal = 8;
    this.fsTotalWin = 0;
    this.roundWin = 0;
    this.totalSpins = 0;
    this.totalWagered = 0;
    this.totalPaid = 0;
    this.targetRTP = 96.5;
    this.featureFlags = {
      freeSpins: true,
      expandingWilds: true,
      pickBonus: true,
      mysterySymbols: true,
      rasBlessing: true
    };
  }

  setRTP(targetRTP) {
    this.targetRTP = targetRTP;
  }

  setFeatureFlags(flags) {
    if (flags) {
      this.featureFlags = { ...this.featureFlags, ...flags };
    }
  }

  _emptyGrid() {
    return Array.from({ length: REELS }, () => Array.from({ length: ROWS }, () => null));
  }

  betPerWay() {
    return this.bet / 25;
  }

  incBet() {
    let i = this.betLevels.indexOf(this.bet);
    if (i < this.betLevels.length - 1) this.bet = this.betLevels[i + 1];
  }

  decBet() {
    let i = this.betLevels.indexOf(this.bet);
    if (i > 0) this.bet = this.betLevels[i - 1];
  }

  weightTable() {
    return this.inFreeSpins ? FS_WEIGHTS : BASE_WEIGHTS;
  }

  fillGrid(existingGrid) {
    const g = existingGrid || this._emptyGrid();
    for (let c = 0; c < REELS; c++) {
      for (let r = 0; r < ROWS; r++) {
        if (g[c][r] === null) {
          g[c][r] = weightedPick(this.weightTable());
        }
      }
    }
    return g;
  }

  applyGravity(g) {
    for (let c = 0; c < REELS; c++) {
      const col = g[c].filter(v => v !== null);
      const missing = ROWS - col.length;
      g[c] = new Array(missing).fill(null).concat(col);
    }
    return g;
  }

  expandWilds(g) {
    const expandedCols = [];
    for (let c = 0; c < REELS; c++) {
      if (g[c].some(s => s === 'WILD')) {
        for (let r = 0; r < ROWS; r++) g[c][r] = 'WILD';
        expandedCols.push(c);
      }
    }
    return expandedCols;
  }

  transformMysterySymbols(g) {
    let hasMystery = false;
    for (let c = 0; c < REELS; c++) {
      for (let r = 0; r < ROWS; r++) {
        if (g[c][r] === 'MYSTERY') {
          hasMystery = true;
          break;
        }
      }
    }
    if (!hasMystery) return null;

    const highTierSyms = ['PHARAOH', 'QUEEN', 'SCARAB', 'HORUS', 'ANUBIS'];
    const chosenSym = highTierSyms[Math.floor(Math.random() * highTierSyms.length)];

    for (let c = 0; c < REELS; c++) {
      for (let r = 0; r < ROWS; r++) {
        if (g[c][r] === 'MYSTERY') {
          g[c][r] = chosenSym;
        }
      }
    }
    return chosenSym;
  }

  evaluateWins(g) {
    const wins = [];
    const winningCells = new Set();
    for (const symId of Object.keys(PAYTABLE)) {
      let ways = 1;
      let consecutiveReels = 0;
      const reelHitCells = [];
      for (let c = 0; c < REELS; c++) {
        const hits = [];
        for (let r = 0; r < ROWS; r++) {
          if (g[c][r] === symId || g[c][r] === 'WILD') hits.push(r);
        }
        if (hits.length === 0) break;
        consecutiveReels++;
        ways *= hits.length;
        reelHitCells.push(hits.map(r => `${c},${r}`));
      }
      if (consecutiveReels >= 3) {
        const payTiers = PAYTABLE[symId];
        const tier = Math.min(consecutiveReels, 5);
        const payMult = payTiers[tier] || 0;
        if (payMult > 0) {
          const pay = payMult * ways * this.betPerWay();
          wins.push({ symbol: symId, ways, reels: consecutiveReels, pay });
          reelHitCells.forEach(cells => cells.forEach(k => winningCells.add(k)));
        }
      }
    }
    const totalPay = wins.reduce((s, w) => s + w.pay, 0);
    return { wins, winningCells, totalPay };
  }

  countScatters(g) {
    let n = 0;
    for (let c = 0; c < REELS; c++) {
      for (let r = 0; r < ROWS; r++) {
        if (g[c][r] === 'SCATTER') n++;
      }
    }
    return n;
  }

  effectiveMultiplier() {
    return Math.max(...this.reelMultipliers);
  }

  bumpMultiplier() {
    const idx = Math.floor(Math.random() * 3);
    const steps = [1, 2, 3, 5, 8, 10, 15, 20];
    const cur = this.reelMultipliers[idx];
    const curIdx = steps.indexOf(cur);
    this.reelMultipliers[idx] = steps[Math.min(curIdx + 1, steps.length - 1)];
    return idx;
  }

  resetMultipliers() {
    if (!this.inFreeSpins) this.reelMultipliers = [1, 1, 1];
  }
}

window.SlotEngine = SlotEngine;
window.SYMBOLS = SYMBOLS;
window.PAYTABLE = PAYTABLE;
