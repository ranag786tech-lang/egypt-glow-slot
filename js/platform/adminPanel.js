/**
 * AdminPanel - Backoffice operator controller & Feature configuration interface.
 */
export class AdminPanel {
  constructor(configEngine, analyticsDashboard) {
    this.configEngine = configEngine;
    this.analyticsDashboard = analyticsDashboard;
    this.modalEl = null;
    this.init();
  }

  init() {
    this.createModalDOM();
  }

  createModalDOM() {
    if (document.getElementById('adminPanelModal')) return;

    const modal = document.createElement('div');
    modal.id = 'adminPanelModal';
    modal.className = 'modal-overlay hidden';
    modal.innerHTML = `
      <div class="modal-card platform-card">
        <div class="modal-header">
          <h2>🛡️ Backoffice Admin Panel</h2>
          <button class="modal-close" id="closeAdminPanel">&times;</button>
        </div>
        <div class="modal-body platform-body">
          <div class="admin-grid">
            <div class="admin-section">
              <h3>🎯 Dynamic RTP & Math Specs</h3>
              <div class="control-group">
                <label>Target RTP (%): <span id="rtpDisplay">96.5</span>%</label>
                <input type="range" id="rtpSlider" min="88.0" max="98.0" step="0.5" value="96.5">
              </div>
            </div>

            <div class="admin-section">
              <h3>🚩 Feature Flags Control</h3>
              <div class="flag-list">
                <label><input type="checkbox" id="flagFreeSpins" checked> Free Spins Round</label>
                <label><input type="checkbox" id="flagExpandingWilds" checked> Expanding Wilds</label>
                <label><input type="checkbox" id="flagPickBonus" checked> Scarab Pick Bonus</label>
                <label><input type="checkbox" id="flagMysterySymbols" checked> Mystery Symbols</label>
                <label><input type="checkbox" id="flagRasBlessing" checked> Ra's Blessing Event</label>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" id="saveAdminConfig">Save & Apply Configuration</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.modalEl = modal;

    this.bindEvents();
  }

  bindEvents() {
    const closeBtn = document.getElementById('closeAdminPanel');
    if (closeBtn) closeBtn.onclick = () => this.hide();

    const rtpSlider = document.getElementById('rtpSlider');
    const rtpDisplay = document.getElementById('rtpDisplay');
    if (rtpSlider && rtpDisplay) {
      rtpSlider.oninput = (e) => {
        rtpDisplay.textContent = e.target.value;
      };
    }

    const saveBtn = document.getElementById('saveAdminConfig');
    if (saveBtn) {
      saveBtn.onclick = () => {
        if (this.configEngine) {
          this.configEngine.updateRTP(rtpSlider.value);
          this.configEngine.setFeatureFlag('freeSpins', document.getElementById('flagFreeSpins').checked);
          this.configEngine.setFeatureFlag('expandingWilds', document.getElementById('flagExpandingWilds').checked);
          this.configEngine.setFeatureFlag('pickBonus', document.getElementById('flagPickBonus').checked);
          this.configEngine.setFeatureFlag('mysterySymbols', document.getElementById('flagMysterySymbols').checked);
          this.configEngine.setFeatureFlag('rasBlessing', document.getElementById('flagRasBlessing').checked);
        }
        alert('Configuration saved and applied to live math engine!');
        this.hide();
      };
    }
  }

  show() {
    if (this.configEngine) {
      const cfg = this.configEngine.getConfig();
      const rtpSlider = document.getElementById('rtpSlider');
      const rtpDisplay = document.getElementById('rtpDisplay');
      if (rtpSlider) rtpSlider.value = cfg.targetRTP;
      if (rtpDisplay) rtpDisplay.textContent = cfg.targetRTP;

      document.getElementById('flagFreeSpins').checked = cfg.featureFlags.freeSpins;
      document.getElementById('flagExpandingWilds').checked = cfg.featureFlags.expandingWilds;
      document.getElementById('flagPickBonus').checked = cfg.featureFlags.pickBonus;
      document.getElementById('flagMysterySymbols').checked = cfg.featureFlags.mysterySymbols;
      document.getElementById('flagRasBlessing').checked = cfg.featureFlags.rasBlessing;
    }
    this.modalEl.classList.remove('hidden');
  }

  hide() {
    this.modalEl.classList.add('hidden');
  }
}
