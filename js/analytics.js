/* =========================================================
   EGYPT GLOW - ANALYTICS SYSTEM
   Tracks spins, session duration, retention metrics, RTP,
   average bet, and bonus frequency (Firebase Ready).
   ========================================================= */

class AnalyticsEngine {
  constructor() {
    this.sessionStartTime = Date.now();
    this.stats = {
      spinsCount: 0,
      totalWagered: 0,
      totalPaidOut: 0,
      smallWinsCount: 0,
      mediumWinsCount: 0,
      bigWinsCount: 0,
      megaWinsCount: 0,
      bonusTriggersCount: 0,
      pickBonusCount: 0
    };
  }

  trackSpin(bet, winAmount) {
    this.stats.spinsCount++;
    this.stats.totalWagered += bet;
    this.stats.totalPaidOut += winAmount;

    const ratio = winAmount / bet;
    if (ratio >= 50) this.stats.megaWinsCount++;
    else if (ratio >= 20) this.stats.bigWinsCount++;
    else if (ratio >= 5) this.stats.mediumWinsCount++;
    else if (ratio > 0) this.stats.smallWinsCount++;

    this.dispatchAnalyticsEvent('spin_completed', {
      bet,
      winAmount,
      rtp: this.getCurrentRTP(),
      totalSpins: this.stats.spinsCount
    });
  }

  trackBonusTrigger(bonusType) {
    if (bonusType === 'FREE_SPINS') this.stats.bonusTriggersCount++;
    if (bonusType === 'PICK_BONUS') this.stats.pickBonusCount++;

    this.dispatchAnalyticsEvent('bonus_triggered', {
      type: bonusType,
      spinNumber: this.stats.spinsCount
    });
  }

  getCurrentRTP() {
    if (this.stats.totalWagered === 0) return 96.5;
    return ((this.stats.totalPaidOut / this.stats.totalWagered) * 100).toFixed(2);
  }

  getSessionDurationMinutes() {
    return ((Date.now() - this.sessionStartTime) / 60000).toFixed(1);
  }

  dispatchAnalyticsEvent(eventName, eventParams) {
    // Console logging & Firebase mock hook
    if (window.gtag) {
      window.gtag('event', eventName, eventParams);
    }
  }
}

window.AnalyticsEngine = AnalyticsEngine;
