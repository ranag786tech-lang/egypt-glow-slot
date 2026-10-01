/**
 * RewardCenter - Daily rewards, wheel spins, and claims center.
 */
export class RewardCenter {
  constructor(walletEngine, vipEngine) {
    this.walletEngine = walletEngine;
    this.vipEngine = vipEngine;
    this.STORAGE_KEY = 'egypt_glow_platform_rewards';
    this.lastWheelSpin = null;
    this.lastDailyClaim = null;

    this.wheelRewards = [
      { id: 1, label: '100 Coins', type: 'USD', value: 100, color: '#2a182b' },
      { id: 2, label: '250 Coins', type: 'USD', value: 250, color: '#4a2210' },
      { id: 3, label: '500 Coins', type: 'USD', value: 500, color: '#160a14' },
      { id: 4, label: '1,000 Coins', type: 'USD', value: 1000, color: '#5a3a1a' },
      { id: 5, label: '5,000 JACKPOT', type: 'USD', value: 5000, color: '#e8a020' },
      { id: 6, label: '50 SC Bonus', type: 'USD', value: 50, color: '#1f7a4d' }
    ];

    this.loadState();
  }

  loadState() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.lastWheelSpin) this.lastWheelSpin = parsed.lastWheelSpin;
        if (parsed.lastDailyClaim) this.lastDailyClaim = parsed.lastDailyClaim;
      }
    } catch (e) {
      console.warn('RewardCenter: Failed to load state', e);
    }
  }

  saveState() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        lastWheelSpin: this.lastWheelSpin,
        lastDailyClaim: this.lastDailyClaim
      }));
    } catch (e) {
      console.warn('RewardCenter: Failed to save state', e);
    }
  }

  canClaimDailyWheel() {
    if (!this.lastWheelSpin) return true;
    const now = new Date();
    const last = new Date(this.lastWheelSpin);
    return now.toDateString() !== last.toDateString();
  }

  spinDailyWheel() {
    if (!this.canClaimDailyWheel()) {
      return { success: false, reason: 'Already spun today' };
    }

    const randomIndex = Math.floor(Math.random() * this.wheelRewards.length);
    const reward = this.wheelRewards[randomIndex];

    // VIP Multiplier bonus
    const vipTier = this.vipEngine ? this.vipEngine.getCurrentTier() : { betMultiplier: 1.0 };
    const finalVal = Math.floor(reward.value * vipTier.betMultiplier);

    if (this.walletEngine) {
      this.walletEngine.add(finalVal, 'DAILY_WHEEL_REWARD');
    }

    this.lastWheelSpin = new Date().toISOString();
    this.saveState();

    return {
      success: true,
      reward: { ...reward, value: finalVal },
      vipBonusMultiplier: vipTier.betMultiplier
    };
  }
}
