/**
 * EventEngine - Weekly tournaments & seasonal Live Ops events.
 */
export class EventEngine {
  constructor() {
    this.STORAGE_KEY = 'egypt_glow_platform_events';
    this.userScore = 0;

    this.activeEvents = [
      {
        id: 'evt_pharaoh_clash',
        title: '👑 Pharaoh\'s Weekly Clash',
        type: 'WEEKLY_TOURNAMENT',
        prizePool: '100,000 GC + 500 SC',
        endsInHours: 42,
        leaderboard: [
          { rank: 1, player: 'OsirisKing', score: 145200 },
          { rank: 2, player: 'Cleopatra_99', score: 122800 },
          { rank: 3, player: 'ScarabGod', score: 98400 },
          { rank: 4, player: 'AnubisHunter', score: 75000 },
          { rank: 5, player: 'GlowMaster', score: 52100 }
        ]
      },
      {
        id: 'evt_nile_fever',
        title: '🌊 Nile River Seasonal Festival',
        type: 'SEASONAL_EVENT',
        prizePool: 'Golden Scarab Badge & Exclusive Theme',
        endsInHours: 180,
        milestones: [
          { target: 1000, reward: '500 Coins', claimed: false },
          { target: 5000, reward: 'Nile Emerald Theme', claimed: false },
          { target: 20000, reward: '10,000 Coins + 20 SC', claimed: false }
        ]
      }
    ];

    this.loadState();
  }

  loadState() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.userScore === 'number') this.userScore = parsed.userScore;
      }
    } catch (e) {
      console.warn('EventEngine: Failed to load state', e);
    }
  }

  saveState() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({ userScore: this.userScore }));
    } catch (e) {
      console.warn('EventEngine: Failed to save state', e);
    }
  }

  recordSpinWin(winAmount) {
    if (winAmount <= 0) return;
    this.userScore += Math.floor(winAmount);
    this.saveState();
  }

  getActiveEvents() {
    return this.activeEvents.map(evt => {
      if (evt.type === 'WEEKLY_TOURNAMENT') {
        const userEntry = { rank: '12th', player: 'You (Player)', score: this.userScore };
        return {
          ...evt,
          userEntry
        };
      }
      return evt;
    });
  }
}
