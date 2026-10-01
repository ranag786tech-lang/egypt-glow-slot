/**
 * ConfigEngine - Dynamic RTP manager, Feature Flags, and Math specs.
 */
export class ConfigEngine {
  constructor(slotMath) {
    this.slotMath = slotMath;
    this.STORAGE_KEY = 'egypt_glow_platform_config';

    this.config = {
      targetRTP: 96.5,          // 88.0% to 98.0%
      volatility: 'HIGH',       // LOW, MEDIUM, HIGH, EXTREME
      minBet: 1.0,
      maxBet: 500.0,
      featureFlags: {
        freeSpins: true,
        expandingWilds: true,
        pickBonus: true,
        mysterySymbols: true,
        rasBlessing: true,
        turboMode: true,
        autoSpin: true
      }
    };

    this.loadState();
    this.applyConfigToMath();
  }

  loadState() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.targetRTP) this.config.targetRTP = parsed.targetRTP;
        if (parsed.volatility) this.config.volatility = parsed.volatility;
        if (parsed.featureFlags) this.config.featureFlags = { ...this.config.featureFlags, ...parsed.featureFlags };
      }
    } catch (e) {
      console.warn('ConfigEngine: Failed to load state', e);
    }
  }

  saveState() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.config));
    } catch (e) {
      console.warn('ConfigEngine: Failed to save state', e);
    }
  }

  updateRTP(targetRTP) {
    this.config.targetRTP = Math.max(88.0, Math.min(98.0, parseFloat(targetRTP)));
    this.applyConfigToMath();
    this.saveState();
  }

  setFeatureFlag(featureKey, enabled) {
    if (this.config.featureFlags[featureKey] !== undefined) {
      this.config.featureFlags[featureKey] = !!enabled;
      this.applyConfigToMath();
      this.saveState();
    }
  }

  applyConfigToMath() {
    if (!this.slotMath) return;
    this.slotMath.setRTP(this.config.targetRTP);
    this.slotMath.setFeatureFlags(this.config.featureFlags);
  }

  getConfig() {
    return { ...this.config };
  }
}
