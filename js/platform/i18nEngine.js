/**
 * I18nEngine - Multi-language localization support.
 */
export class I18nEngine {
  constructor() {
    this.STORAGE_KEY = 'egypt_glow_platform_lang';
    this.currentLang = 'en';

    this.translations = {
      en: {
        spin: 'SPIN',
        auto: 'AUTO',
        turbo: 'TURBO',
        bet: 'BET',
        balance: 'BALANCE',
        win: 'WIN',
        paytable: 'Paytable & Rules',
        lobby: 'Game Lobby',
        wallet: 'Wallet',
        vip: 'VIP Status',
        rewards: 'Reward Center',
        events: 'Weekly Events',
        admin: 'Admin Backoffice',
        deposit: 'Claim / Deposit',
        settings: 'Settings'
      },
      es: {
        spin: 'GIRAR',
        auto: 'AUTO',
        turbo: 'TURBO',
        bet: 'APUESTA',
        balance: 'SALDO',
        win: 'PREMIO',
        paytable: 'Tabla de Pagos',
        lobby: 'Lobby de Juego',
        wallet: 'Billetera',
        vip: 'Nivel VIP',
        rewards: 'Recompensas',
        events: 'Eventos Semanales',
        admin: 'Administración',
        deposit: 'Reclamar / Depósito',
        settings: 'Ajustes'
      },
      de: {
        spin: 'DREHEN',
        auto: 'AUTO',
        turbo: 'TURBO',
        bet: 'EINSATZ',
        balance: 'GUTHABEN',
        win: 'GEWINN',
        paytable: 'Auszahlungstabelle',
        lobby: 'Lobby',
        wallet: 'Brieftasche',
        vip: 'VIP-Status',
        rewards: 'Belohnungen',
        events: 'Wochen-Events',
        admin: 'Admin-Bereich',
        deposit: 'Einzahlen',
        settings: 'Einstellungen'
      },
      ja: {
        spin: 'スピン',
        auto: 'オート',
        turbo: 'ターボ',
        bet: 'ベット',
        balance: '残高',
        win: '勝利金',
        paytable: 'ペイテーブル',
        lobby: 'ロビー',
        wallet: 'ウォレット',
        vip: 'VIPステータス',
        rewards: 'リワード',
        events: 'イベント',
        admin: '管理パネル',
        deposit: 'チャージ',
        settings: '設定'
      },
      ar: {
        spin: 'دوران',
        auto: 'تلقائي',
        turbo: 'سريع',
        bet: 'الرهان',
        balance: 'الرصيد',
        win: 'الفوز',
        paytable: 'جدول الأرباح',
        lobby: 'الرئيسية',
        wallet: 'المحفظة',
        vip: 'كبار الشخصيات',
        rewards: 'المكافآت',
        events: 'الفعاليات',
        admin: 'الإدارة',
        deposit: 'إيداع',
        settings: 'الإعدادات'
      }
    };

    this.loadState();
  }

  loadState() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved && this.translations[saved]) {
        this.currentLang = saved;
      }
    } catch (e) {
      console.warn('I18nEngine: Failed to load state', e);
    }
  }

  setLanguage(lang) {
    if (this.translations[lang]) {
      this.currentLang = lang;
      try {
        localStorage.setItem(this.STORAGE_KEY, lang);
      } catch (e) {}
      this.updateDOM();
    }
  }

  t(key) {
    return (this.translations[this.currentLang] && this.translations[this.currentLang][key]) ||
           (this.translations.en && this.translations.en[key]) ||
           key;
  }

  updateDOM() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) el.textContent = this.t(key);
    });
  }
}
