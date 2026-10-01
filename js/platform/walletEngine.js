/**
 * WalletEngine - Multi-currency player wallet and transaction ledger.
 */
export class WalletEngine {
  constructor() {
    this.STORAGE_KEY = 'egypt_glow_platform_wallet';
    this.balances = {
      GC: 10000,   // Gold Coins (Virtual Fun Currency)
      SC: 50.00,    // Sweeps / Premium Coins
      USD: 100.00   // Real Fiat Currency
    };
    this.activeCurrency = 'GC';
    this.transactions = [];
    this.listeners = [];

    this.loadState();
  }

  loadState() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.balances) this.balances = { ...this.balances, ...parsed.balances };
        if (parsed.activeCurrency) this.activeCurrency = parsed.activeCurrency;
        if (parsed.transactions) this.transactions = parsed.transactions.slice(0, 50);
      }
    } catch (e) {
      console.warn('WalletEngine: Failed to load state', e);
    }
  }

  saveState() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        balances: this.balances,
        activeCurrency: this.activeCurrency,
        transactions: this.transactions
      }));
    } catch (e) {
      console.warn('WalletEngine: Failed to save state', e);
    }
  }

  subscribe(callback) {
    this.listeners.push(callback);
    callback(this.getBalance(), this.activeCurrency);
  }

  notify() {
    const bal = this.getBalance();
    this.listeners.forEach(cb => cb(bal, this.activeCurrency));
    this.saveState();
  }

  getBalance(currency = this.activeCurrency) {
    return this.balances[currency] || 0;
  }

  setCurrency(currency) {
    if (this.balances[currency] !== undefined) {
      this.activeCurrency = currency;
      this.notify();
    }
  }

  deduct(amount, type = 'SPIN_BET', referenceId = null) {
    const current = this.getBalance();
    if (current < amount) {
      return false;
    }
    this.balances[this.activeCurrency] -= amount;
    this.recordTransaction(type, -amount, referenceId);
    this.notify();
    return true;
  }

  add(amount, type = 'SPIN_WIN', referenceId = null) {
    if (amount <= 0) return;
    this.balances[this.activeCurrency] += amount;
    this.recordTransaction(type, amount, referenceId);
    this.notify();
  }

  recordTransaction(type, amount, referenceId = null) {
    const tx = {
      id: 'tx_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString(),
      type,
      currency: this.activeCurrency,
      amount,
      balanceAfter: this.getBalance(),
      referenceId
    };
    this.transactions.unshift(tx);
    if (this.transactions.length > 50) this.transactions.pop();
  }

  getTransactionHistory() {
    return this.transactions;
  }
}
