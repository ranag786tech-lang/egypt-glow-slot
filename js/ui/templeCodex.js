/* =========================================================
   EGYPT GLOW V2 - TEMPLE CODEX & SYMBOL ENCYCLOPEDIA
   Interactive artifact panel with symbol lore, payouts, & tabs
   ========================================================= */

import { globalEventBus } from '../game/eventBus.js';

export const SYMBOL_DATABASE = [
  {
    id: 'pharaoh',
    name: 'Pharaoh Ra',
    category: 'HIGH SYMBOL',
    role: 'Highest paying ancient guardian.',
    payouts: '5x: 500 | 4x: 100 | 3x: 25',
    lore: 'The supreme ruler of the Nile, crowned with gold and sapphire gems. His gaze brings prosperity to the chamber.',
    icon: '👑'
  },
  {
    id: 'cleopatra',
    name: 'Cleopatra Queen',
    category: 'HIGH SYMBOL',
    role: 'High paying royal matriarch.',
    payouts: '5x: 350 | 4x: 75 | 3x: 20',
    lore: 'Worshipped across Alexandria, she wields the magic of emerald vipers and solar crowns.',
    icon: '👸'
  },
  {
    id: 'scarab',
    name: 'Jeweled Scarab',
    category: 'MID SYMBOL',
    role: 'Sacred beetle of resurrection.',
    payouts: '5x: 200 | 4x: 50 | 3x: 15',
    lore: 'Forged from solid emerald and lapis lazuli, the scarab pushes the golden sun across the heavens.',
    icon: '𓆣'
  },
  {
    id: 'eye_of_horus',
    name: 'Eye of Horus',
    category: 'MID SYMBOL',
    role: 'Symbol of royal protection and health.',
    payouts: '5x: 150 | 4x: 35 | 3x: 10',
    lore: 'The Wadjet eye beholds all hidden truths within the ancient pyramids.',
    icon: '𓂀'
  },
  {
    id: 'anubis',
    name: 'Anubis Guardian',
    category: 'MID SYMBOL',
    role: 'Protector of sacred tombs.',
    payouts: '5x: 120 | 4x: 30 | 3x: 10',
    lore: 'The jackal-headed deity who weighs the hearts of pharaohs against the feather of truth.',
    icon: '𓃦'
  },
  {
    id: 'wild',
    name: "Ra's Solar Wild",
    category: 'SPECIAL WILD',
    role: 'Substitutes for all symbols except Scatter.',
    payouts: 'Multipliers: x2 to x10,000',
    lore: 'Unleashes concentrated solar energy across winning paylines.',
    icon: '☀️'
  },
  {
    id: 'scatter',
    name: 'Pyramid Scatter',
    category: 'SPECIAL SCATTER',
    role: '3+ Scatters trigger 8 to 20 Bonus Spins.',
    payouts: '3x: 8 FS | 4x: 12 FS | 5x: 20 FS',
    lore: 'The golden capstone unlocks the hidden inner chamber of Ra.',
    icon: 'F'
  }
];

export class TempleCodex {
  constructor() {
    this.container = null;
    this.currentIndex = 0;
    this.activeTab = 'SYMBOLS';

    this.bindEvents();
  }

  init() {
    this.renderDOM();
  }

  bindEvents() {
    globalEventBus.on('CODEX_OPEN', (data) => this.open(data?.symbolId));
    globalEventBus.on('SYMBOL_CLICKED', (data) => this.open(data?.symbolId));
  }

  renderDOM() {
    let el = document.getElementById('v2-codex-overlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'v2-codex-overlay';
      el.className = 'v2-codex-container hidden';
      document.body.appendChild(el);
    }

    el.innerHTML = `
      <div class="v2-codex-backdrop" id="codex-backdrop"></div>
      <div class="v2-codex-card" id="codex-card">
        <header class="v2-codex-header">
          <div class="v2-codex-title-wrap">
            <span class="v2-codex-icon">🏛️</span>
            <span class="v2-codex-title">THE TEMPLE CODEX</span>
          </div>
          <button class="v2-codex-close-btn" id="codex-close-btn">✕</button>
        </header>

        <nav class="v2-codex-tabs">
          <button class="v2-codex-tab active" data-tab="SYMBOLS">SYMBOLS</button>
          <button class="v2-codex-tab" data-tab="WILDS">WILDS</button>
          <button class="v2-codex-tab" data-tab="SCATTERS">SCATTERS</button>
          <button class="v2-codex-tab" data-tab="RULES">RULES</button>
        </nav>

        <div class="v2-codex-body" id="codex-body">
          <div class="v2-symbol-detail-view" id="symbol-detail-view">
            <div class="v2-symbol-artwork" id="codex-symbol-icon">👑</div>
            <h3 class="v2-symbol-name" id="codex-symbol-name">Pharaoh Ra</h3>
            <span class="v2-symbol-category" id="codex-symbol-cat">HIGH SYMBOL</span>

            <div class="v2-symbol-info-block">
              <span class="v2-block-label">ROLE</span>
              <p class="v2-block-desc" id="codex-symbol-role">Highest paying ancient guardian.</p>
            </div>

            <div class="v2-symbol-info-block">
              <span class="v2-block-label">PAYOUTS</span>
              <p class="v2-block-desc" id="codex-symbol-pay">5x: 500 | 4x: 100 | 3x: 25</p>
            </div>

            <div class="v2-symbol-info-block">
              <span class="v2-block-label">LORE</span>
              <p class="v2-block-desc lore" id="codex-symbol-lore">The supreme ruler of the Nile...</p>
            </div>
          </div>
        </div>

        <footer class="v2-codex-nav-footer">
          <button class="v2-codex-nav-btn" id="codex-prev-btn">◄ PREV</button>
          <span class="v2-codex-page-num" id="codex-page-num">1 / 7</span>
          <button class="v2-codex-nav-btn" id="codex-next-btn">NEXT ►</button>
        </footer>
      </div>
    `;

    this.container = el;

    document.getElementById('codex-close-btn').onclick = () => this.close();
    document.getElementById('codex-backdrop').onclick = () => this.close();

    document.getElementById('codex-prev-btn').onclick = () => {
      globalEventBus.emit('UI_CLICK');
      this.currentIndex = (this.currentIndex - 1 + SYMBOL_DATABASE.length) % SYMBOL_DATABASE.length;
      this.updateSymbolView();
    };

    document.getElementById('codex-next-btn').onclick = () => {
      globalEventBus.emit('UI_CLICK');
      this.currentIndex = (this.currentIndex + 1) % SYMBOL_DATABASE.length;
      this.updateSymbolView();
    };

    const tabs = el.querySelectorAll('.v2-codex-tab');
    tabs.forEach(tab => {
      tab.onclick = (e) => {
        globalEventBus.emit('UI_CLICK');
        tabs.forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        this.activeTab = e.target.dataset.tab;
        this.handleTabChange();
      };
    });
  }

  open(symbolId = null) {
    if (symbolId) {
      const idx = SYMBOL_DATABASE.findIndex(s => s.id === symbolId);
      if (idx !== -1) this.currentIndex = idx;
    }

    this.updateSymbolView();
    this.container.classList.remove('hidden');

    if (window.gsap && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const card = document.getElementById('codex-card');
      gsap.fromTo(card, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.5)' });
    }
  }

  close() {
    globalEventBus.emit('UI_CLICK');
    this.container.classList.add('hidden');
  }

  updateSymbolView() {
    const sym = SYMBOL_DATABASE[this.currentIndex];
    if (!sym) return;

    document.getElementById('codex-symbol-icon').innerText = sym.icon;
    document.getElementById('codex-symbol-name').innerText = sym.name;
    document.getElementById('codex-symbol-cat').innerText = sym.category;
    document.getElementById('codex-symbol-role').innerText = sym.role;
    document.getElementById('codex-symbol-pay').innerText = sym.payouts;
    document.getElementById('codex-symbol-lore').innerText = `"${sym.lore}"`;
    document.getElementById('codex-page-num').innerText = `${this.currentIndex + 1} / ${SYMBOL_DATABASE.length}`;
  }

  handleTabChange() {
    if (this.activeTab === 'WILDS') {
      const wildIdx = SYMBOL_DATABASE.findIndex(s => s.id === 'wild');
      if (wildIdx !== -1) { this.currentIndex = wildIdx; this.updateSymbolView(); }
    } else if (this.activeTab === 'SCATTERS') {
      const scatIdx = SYMBOL_DATABASE.findIndex(s => s.id === 'scatter');
      if (scatIdx !== -1) { this.currentIndex = scatIdx; this.updateSymbolView(); }
    } else {
      this.currentIndex = 0;
      this.updateSymbolView();
    }
  }
}

export const templeCodex = new TempleCodex();
