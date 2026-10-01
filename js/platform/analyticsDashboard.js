/**
 * AnalyticsDashboard - Real-time Business Intelligence and Telemetry visualizer.
 */
export class AnalyticsDashboard {
  constructor(analytics) {
    this.analytics = analytics;
    this.modalEl = null;
    this.init();
  }

  init() {
    this.createModalDOM();
  }

  createModalDOM() {
    if (document.getElementById('analyticsDashboardModal')) return;

    const modal = document.createElement('div');
    modal.id = 'analyticsDashboardModal';
    modal.className = 'modal-overlay hidden';
    modal.innerHTML = `
      <div class="modal-card platform-card">
        <div class="modal-header">
          <h2>📊 Analytics & Operator BI Dashboard</h2>
          <button class="modal-close" id="closeAnalyticsDashboard">&times;</button>
        </div>
        <div class="modal-body platform-body">
          <div class="analytics-kpi-grid">
            <div class="kpi-card">
              <span class="kpi-title">Gross Gaming Revenue (GGR)</span>
              <span class="kpi-val" id="kpiGGR">0.00 Coins</span>
            </div>
            <div class="kpi-card">
              <span class="kpi-title">Observed RTP</span>
              <span class="kpi-val" id="kpiRTP">96.50%</span>
            </div>
            <div class="kpi-card">
              <span class="kpi-title">Total Spins</span>
              <span class="kpi-val" id="kpiSpins">0</span>
            </div>
            <div class="kpi-card">
              <span class="kpi-title">Hit Frequency</span>
              <span class="kpi-val" id="kpiHitFreq">32.4%</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="closeAnalyticsBtn">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.modalEl = modal;

    document.getElementById('closeAnalyticsDashboard').onclick = () => this.hide();
    document.getElementById('closeAnalyticsBtn').onclick = () => this.hide();
  }

  show() {
    if (this.analytics) {
      const stats = typeof this.analytics.getStats === 'function' ? this.analytics.getStats() : (this.analytics.metrics || {});
      const spins = stats.spins || stats.totalSpins || 0;
      const totalWagered = stats.totalWagered || stats.totalBet || 0;
      const totalWon = stats.totalWon || stats.totalPayout || 0;
      const ggr = totalWagered - totalWon;
      const rtp = totalWagered > 0 ? ((totalWon / totalWagered) * 100).toFixed(2) : '96.50';

      const ggrEl = document.getElementById('kpiGGR');
      const rtpEl = document.getElementById('kpiRTP');
      const spinsEl = document.getElementById('kpiSpins');

      if (ggrEl) ggrEl.textContent = `${ggr >= 0 ? '+' : ''}${ggr.toFixed(2)} Coins`;
      if (rtpEl) rtpEl.textContent = `${rtp}%`;
      if (spinsEl) spinsEl.textContent = spins;
    }
    this.modalEl.classList.remove('hidden');
  }

  hide() {
    this.modalEl.classList.add('hidden');
  }
}
