/* =========================================================
   EGYPT GLOW - ENGAGEMENT ENGINE
   Handles Level Progression, XP, Daily Rewards, Streaks,
   Achievements, and Missions with Local Storage.
   ========================================================= */

class EngagementEngine {
  constructor() {
    this.storageKey = 'egypt_glow_engagement_v2';
    this.loadState();
  }

  loadState() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.level = data.level || 1;
        this.xp = data.xp || 0;
        this.xpToNextLevel = data.xpToNextLevel || 100;
        this.loginStreak = data.loginStreak || 1;
        this.lastLogin = data.lastLogin || Date.now();
        this.achievements = data.achievements || this.defaultAchievements();
        this.missions = data.missions || this.defaultMissions();
        this.recentWins = data.recentWins || [];
      } catch (e) {
        this.resetState();
      }
    } else {
      this.resetState();
    }
  }

  resetState() {
    this.level = 1;
    this.xp = 0;
    this.xpToNextLevel = 100;
    this.loginStreak = 1;
    this.lastLogin = Date.now();
    this.achievements = this.defaultAchievements();
    this.missions = this.defaultMissions();
    this.recentWins = [
      { name: 'Alex M.', win: '$250.00', symbol: '𓀔' },
      { name: 'Sarah K.', win: '$1,200.00', symbol: '𓆣' },
      { name: 'David P.', win: '$85.00', symbol: '𓁐' },
      { name: 'Elena R.', win: '$3,400.00', symbol: '𓇳' }
    ];
    this.saveState();
  }

  saveState() {
    const data = {
      level: this.level,
      xp: this.xp,
      xpToNextLevel: this.xpToNextLevel,
      loginStreak: this.loginStreak,
      lastLogin: this.lastLogin,
      achievements: this.achievements,
      missions: this.missions,
      recentWins: this.recentWins
    };
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  defaultAchievements() {
    return [
      { id: 'first_spin', title: 'First Spin', desc: 'Spin the reels for the first time', icon: '🎰', progress: 0, target: 1, completed: false, reward: 50 },
      { id: 'spins_100', title: 'Egypt Explorer', desc: 'Complete 100 spins', icon: '𓂀', progress: 0, target: 100, completed: false, reward: 200 },
      { id: 'big_winner', title: 'Big Winner', desc: 'Hit a Big Win (10x+ bet)', icon: '👑', progress: 0, target: 1, completed: false, reward: 300 },
      { id: 'lucky_scarab', title: 'Lucky Scarab', desc: 'Trigger a Scarab win tier', icon: '𓆣', progress: 0, target: 1, completed: false, reward: 150 },
      { id: 'bonus_master', title: 'Pyramid Master', desc: 'Trigger Free Spins 3 times', icon: '𓇳', progress: 0, target: 3, completed: false, reward: 500 }
    ];
  }

  defaultMissions() {
    return [
      { id: 'daily_spin_10', desc: 'Spin 10 times today', progress: 0, target: 10, completed: false, reward: 100 },
      { id: 'daily_win_50', desc: 'Win $50 total in wins', progress: 0, target: 50, completed: false, reward: 150 },
      { id: 'daily_cascade_3', desc: 'Trigger 3 cascades in one spin', progress: 0, target: 3, completed: false, reward: 200 }
    ];
  }

  addXP(amount) {
    this.xp += amount;
    let leveledUp = false;
    while (this.xp >= this.xpToNextLevel) {
      this.xp -= this.xpToNextLevel;
      this.level += 1;
      this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.35);
      leveledUp = true;
    }
    this.saveState();
    return { leveledUp, level: this.level, xp: this.xp, xpToNext: this.xpToNextLevel };
  }

  recordSpin(bet, win, isCascade, isFreeSpin) {
    const xpGained = Math.floor(bet * 10) + (win > 0 ? 15 : 5);
    const xpResult = this.addXP(xpGained);

    // Update achievements
    const unlocked = [];
    this.achievements.forEach(ach => {
      if (!ach.completed) {
        if (ach.id === 'first_spin') ach.progress += 1;
        if (ach.id === 'spins_100') ach.progress += 1;
        if (ach.id === 'big_winner' && win >= bet * 10) ach.progress += 1;
        if (ach.id === 'lucky_scarab' && win >= bet * 5) ach.progress += 1;

        if (ach.progress >= ach.target) {
          ach.completed = true;
          unlocked.push(ach);
        }
      }
    });

    // Update missions
    this.missions.forEach(m => {
      if (!m.completed) {
        if (m.id === 'daily_spin_10') m.progress += 1;
        if (m.id === 'daily_win_50') m.progress += win;
        if (m.progress >= m.target) m.completed = true;
      }
    });

    if (win >= bet * 10) {
      this.recentWins.unshift({
        name: 'You',
        win: `$${win.toFixed(2)}`,
        symbol: '𓀔'
      });
      if (this.recentWins.length > 8) this.recentWins.pop();
    }

    this.saveState();
    return { xpResult, unlockedAchievements: unlocked };
  }
}

window.EngagementEngine = EngagementEngine;
