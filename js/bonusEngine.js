/* =========================================================
   EGYPT GLOW - BONUS & MINI-GAME ENGINE
   Handles Pick Bonus (Ancient Temple Chest Pick), Random Events
   ("Ra's Blessing"), and Mystery Transformations.
   ========================================================= */

class BonusEngine {
  constructor(slotEngine, soundEngine) {
    this.slotEngine = slotEngine;
    this.soundEngine = soundEngine;
  }

  triggerPickBonus(onComplete) {
    const prizes = [10.0, 25.0, 50.0, 100.0, 150.0, 200.0];
    // Shuffle prizes
    const shuffled = [...prizes].sort(() => Math.random() - 0.5);

    let picksRemaining = 3;
    let totalWon = 0;

    const modal = document.getElementById('pick-bonus-modal');
    const grid = document.getElementById('pick-bonus-grid');
    const subtitle = document.getElementById('pick-subtitle');

    if (!modal || !grid) return;

    grid.innerHTML = '';
    subtitle.innerText = `Pick 3 Ancient Scarabs to reveal cash prizes! (${picksRemaining} picks left)`;

    for (let i = 0; i < 6; i++) {
      const card = document.createElement('div');
      card.className = 'pick-card';
      card.innerHTML = '🪲';
      card.addEventListener('click', () => {
        if (card.classList.contains('revealed') || picksRemaining <= 0) return;

        this.soundEngine.playClick();
        const prizeMult = shuffled[i];
        const prizeVal = prizeMult * this.slotEngine.betPerWay();
        totalWon += prizeVal;
        picksRemaining--;

        card.classList.add('revealed');
        card.innerHTML = `$${prizeVal.toFixed(2)}`;

        subtitle.innerText = picksRemaining > 0
          ? `(${picksRemaining} picks remaining)`
          : `Bonus Complete! Total Won: $${totalWon.toFixed(2)}`;

        if (picksRemaining <= 0) {
          setTimeout(() => {
            modal.classList.remove('show');
            if (window.walletEngine) {
              window.walletEngine.add(totalWon, 'USD', 'Pick Bonus Win');
              this.slotEngine.balance = window.walletEngine.getBalance();
            } else {
              this.slotEngine.balance += totalWon;
            }
            this.slotEngine.roundWin += totalWon;
            if (onComplete) onComplete(totalWon);
          }, 1500);
        }
      });
      grid.appendChild(card);
    }

    modal.classList.add('show');
  }

  triggerRandomEvent(onEventApplied) {
    const events = [
      { name: "RA'S BLESSING", desc: 'Wild Multipliers Upgraded!', type: 'MULT_BOOST' },
      { name: "SCARAB RUSH", desc: 'High Paying Scarabs Inbound!', type: 'SCARAB_BOOST' },
      { name: "ANCIENT MYSTERY", desc: 'Mystery Symbols Revealed!', type: 'MYSTERY_BOOST' }
    ];

    const evt = events[Math.floor(Math.random() * events.length)];
    const banner = document.getElementById('event-banner');
    if (banner) {
      banner.innerText = `✨ ${evt.name} ✨\n${evt.desc}`;
      banner.classList.add('show');
      this.soundEngine.playBonusTrigger();

      setTimeout(() => {
        banner.classList.remove('show');
        if (onEventApplied) onEventApplied(evt);
      }, 1800);
    }
  }
}

window.BonusEngine = BonusEngine;
