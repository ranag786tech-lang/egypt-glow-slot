/**
 * PromotionsEngine - Bonus code redemption, free spins drops, deposit matches.
 */
export class PromotionsEngine {
  constructor(walletEngine) {
    this.walletEngine = walletEngine;
    this.STORAGE_KEY = 'egypt_glow_platform_promos';
    this.redeemedPromos = [];

    this.activePromotions = [
      { code: 'EGYPTGLOW2025', title: '2,000 Gold Coins Welcome Drop', type: 'COINS', value: 2000, active: true },
      { code: 'SCARABVIP', title: '50 Sweeps Coins Loyalty Drop', type: 'SC', value: 50, active: true },
      { code: 'PHARAOH100', title: '10,000 Pharaoh Treasury Bonus', type: 'COINS', value: 10000, active: true }
    ];

    this.loadState();
  }

  loadState() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.redeemedPromos)) this.redeemedPromos = parsed.redeemedPromos;
      }
    } catch (e) {
      console.warn('PromotionsEngine: Failed to load state', e);
    }
  }

  saveState() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        redeemedPromos: this.redeemedPromos
      }));
    } catch (e) {
      console.warn('PromotionsEngine: Failed to save state', e);
    }
  }

  redeemCode(code) {
    const cleanCode = code.trim().toUpperCase();
    if (this.redeemedPromos.includes(cleanCode)) {
      return { success: false, message: 'Promo code already redeemed' };
    }

    const promo = this.activePromotions.find(p => p.code === cleanCode && p.active);
    if (!promo) {
      return { success: false, message: 'Invalid or expired promo code' };
    }

    if (this.walletEngine) {
      if (promo.type === 'SC') {
        const currentCurrency = this.walletEngine.activeCurrency;
        this.walletEngine.setCurrency('SC');
        this.walletEngine.add(promo.value, 'PROMO_CODE_' + cleanCode);
        this.walletEngine.setCurrency(currentCurrency);
      } else {
        this.walletEngine.add(promo.value, 'PROMO_CODE_' + cleanCode);
      }
    }

    this.redeemedPromos.push(cleanCode);
    this.saveState();

    return {
      success: true,
      message: `Successfully redeemed ${promo.title}!`,
      promo
    };
  }

  getActivePromotions() {
    return this.activePromotions.map(p => ({
      ...p,
      redeemed: this.redeemedPromos.includes(p.code)
    }));
  }
}
