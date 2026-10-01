/**
 * VIPEngine - Player VIP Tier calculation, benefits & XP scale.
 */
export class VIPEngine {
  constructor() {
    this.STORAGE_KEY = 'egypt_glow_platform_vip';
    this.vipXP = 0;

    this.tiers = [
      { level: 1, name: 'Neophyte', xpRequired: 0, cashback: 0.01, betMultiplier: 1.0, badge: '🌱' },
      { level: 2, name: 'Bronze Scarab', xpRequired: 500, cashback: 0.02, betMultiplier: 1.05, badge: '🥉' },
      { level: 3, name: 'Silver Ankh', xpRequired: 2500, cashback: 0.03, betMultiplier: 1.10, badge: '🥈' },
      { level: 4, name: 'Gold Pharaoh', xpRequired: 10000, cashback: 0.05, betMultiplier: 1.20, badge: '🥇' },
      { level: 5, name: 'Diamond Isis', xpRequired: 50000, cashback: 0.08, betMultiplier: 1.35, badge: '💎' },
      { level: 6, name: 'Obsidian Ra', xpRequired: 200000, cashback: 0.12, betMultiplier: 1.50, badge: '👑' }
    ];

    this.loadState();
  }

  loadState() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.vipXP === 'number') this.vipXP = parsed.vipXP;
      }
    } catch (e) {
      console.warn('VIPEngine: Failed to load state', e);
    }
  }

  saveState() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({ vipXP: this.vipXP }));
    } catch (e) {
      console.warn('VIPEngine: Failed to save state', e);
    }
  }

  addXP(amount) {
    const oldTier = this.getCurrentTier();
    this.vipXP += Math.floor(amount);
    const newTier = this.getCurrentTier();
    this.saveState();

    if (newTier.level > oldTier.level) {
      return { leveledUp: true, oldTier, newTier };
    }
    return { leveledUp: false, oldTier, newTier };
  }

  getCurrentTier() {
    let current = this.tiers[0];
    for (const tier of this.tiers) {
      if (this.vipXP >= tier.xpRequired) {
        current = tier;
      } else {
        break;
      }
    }
    return current;
  }

  getNextTier() {
    const current = this.getCurrentTier();
    const idx = this.tiers.findIndex(t => t.level === current.level);
    if (idx < this.tiers.length - 1) {
      return this.tiers[idx + 1];
    }
    return null; // Max level reached
  }

  getProgress() {
    const current = this.getCurrentTier();
    const next = this.getNextTier();
    if (!next) return 100;
    const range = next.xpRequired - current.xpRequired;
    const progress = this.vipXP - current.xpRequired;
    return Math.min(100, Math.floor((progress / range) * 100));
  }
}
