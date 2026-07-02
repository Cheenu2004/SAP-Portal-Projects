import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SapApiService, SalesSummary } from '../../services/sap-api.service';
import { CardComponent } from '../../components/ui/card.component';
import { TableComponent } from '../../components/ui/table.component';
import { ButtonComponent } from '../../components/ui/button.component';
import { InputComponent } from '../../components/ui/input.component';
import { BadgeComponent } from '../../components/ui/badge.component';
import { TrimZerosPipe } from '../../components/ui/trim-zeros.pipe';

@Component({
  selector: 'app-sales-summary',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, TableComponent, ButtonComponent, InputComponent, BadgeComponent, TrimZerosPipe],
  template: `
    <div class="page">
      <div class="page-header">
        <div class="header-main">
          <h1>Sales Summary Analytics</h1>
          <p>Comprehensive performance metrics and business intelligence overview</p>
        </div>
        <div class="header-badge">
          @if (salesSummary()) {
            <span class="badge badge-success">
              <span class="pulse-dot"></span>
              Live Data
            </span>
          }
        </div>
      </div>



      @if (isLoading()) {
        <div class="loading-container">
          <div class="spinner"></div>
          <p>Processing SAP Data Warehouse...</p>
        </div>
      } @else if (error()) {
        <div class="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {{ error() }}
        </div>
      } @else if (salesSummary()) {
        <!-- Key KPI Dashboard -->
        <div class="kpi-grid">
          <!-- Card 1: Total Orders -->
          <div class="card kpi-card">
            <div class="kpi-header">
              <span class="kpi-title">Total Volumes</span>
              <div class="kpi-icon blue">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
            </div>
            <div class="kpi-body">
              <span class="kpi-value">{{ salesSummary()?.TOTAL_ORDERS }}</span>
              <span class="kpi-unit">Orders</span>
            </div>
            <div class="kpi-footer">
              <span>All recorded transactions</span>
            </div>
          </div>

          <!-- Card 2: Pipeline Infographic -->
          <div class="card kpi-card highlight-card">
            <div class="kpi-header">
              <span class="kpi-title">Order Pipeline</span>
              <div class="kpi-icon primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>
              </div>
            </div>
            <div class="kpi-body pipeline-infographic">
              <div class="pipeline-bar">
                <div class="pipeline-segment success" [style.width]="calculatePercentage(salesSummary()?.CLOSED_ORDERS, salesSummary()?.TOTAL_ORDERS) + '%'"></div>
                <div class="pipeline-segment warning" [style.width]="calculatePercentage(salesSummary()?.OPEN_ORDERS, salesSummary()?.TOTAL_ORDERS) + '%'"></div>
              </div>
              <div class="pipeline-legend">
                <div class="legend-item">
                  <span class="dot success"></span>
                  <span class="legend-label">Completed: {{ salesSummary()?.CLOSED_ORDERS }}</span>
                </div>
                <div class="legend-item">
                  <span class="dot warning"></span>
                  <span class="legend-label">Processing: {{ salesSummary()?.OPEN_ORDERS }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Card 3: Completion Rate -->
          <div class="card kpi-card">
            <div class="kpi-header">
              <span class="kpi-title">Fulfillment Efficiency</span>
              <div class="kpi-icon green">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
            </div>
            <div class="kpi-body">
              <span class="kpi-value">{{ calculatePercentage(salesSummary()?.CLOSED_ORDERS, salesSummary()?.TOTAL_ORDERS) }}%</span>
            </div>
            <div class="kpi-footer">
              <div class="progress-bar-bg">
                <div class="progress-bar-fill primary" [style.width]="calculatePercentage(salesSummary()?.CLOSED_ORDERS, salesSummary()?.TOTAL_ORDERS) + '%'"></div>
              </div>
              <span>Order Completion Rate</span>
            </div>
          </div>
        </div>

        <div class="main-stats-container">
          <!-- Left: Order Breakdown -->
          <div class="card breakdown-card">
            <div class="section-header">
              <h3>Order Status Breakdown</h3>
              <p>Granular distribution of sales documents</p>
            </div>
            
            <div class="breakdown-list">
              <div class="breakdown-item">
                <div class="item-main">
                  <div class="item-icon blue">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  <div class="item-info">
                    <span class="item-name">Total Orders Generated</span>
                    <span class="item-desc">Total count for selected period</span>
                  </div>
                </div>
                <div class="item-value">{{ salesSummary()?.TOTAL_ORDERS }}</div>
              </div>

              <div class="breakdown-item">
                <div class="item-main">
                  <div class="item-icon yellow">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  </div>
                  <div class="item-info">
                    <span class="item-name">Processing (Open)</span>
                    <span class="item-desc">Awaiting fulfillment/delivery</span>
                  </div>
                </div>
                <div class="item-value warning">{{ salesSummary()?.OPEN_ORDERS }}</div>
              </div>

              <div class="breakdown-item">
                <div class="item-main">
                  <div class="item-icon green">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  </div>
                  <div class="item-info">
                    <span class="item-name">Completed (Closed)</span>
                    <span class="item-desc">Fully processed and cleared</span>
                  </div>
                </div>
                <div class="item-value success">{{ salesSummary()?.CLOSED_ORDERS }}</div>
              </div>
            </div>
          </div>

          <!-- Right: Visual Analytics -->
          <div class="card visual-card">
            <div class="section-header">
              <h3>Distribution</h3>
            </div>
            <div class="chart-container">
              <div class="donut-wrapper">
                <div class="donut-chart" [style.background]="getDonutGradient()">
                  <div class="donut-hole">
                    <span class="donut-value">{{ salesSummary()?.TOTAL_ORDERS }}</span>
                    <span class="donut-label">Total</span>
                  </div>
                </div>
              </div>
              <div class="chart-legend">
                <div class="legend-row">
                  <div class="legend-marker completed"></div>
                  <div class="legend-text">
                    <span class="l-name">Completed</span>
                    <span class="l-val">{{ calculatePercentage(salesSummary()?.CLOSED_ORDERS, salesSummary()?.TOTAL_ORDERS) }}%</span>
                  </div>
                </div>
                <div class="legend-row">
                  <div class="legend-marker processing"></div>
                  <div class="legend-text">
                    <span class="l-name">Processing</span>
                    <span class="l-val">{{ calculatePercentage(salesSummary()?.OPEN_ORDERS, salesSummary()?.TOTAL_ORDERS) }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      } @else {
        <div class="empty-state">
          <div class="empty-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
          </div>
          <h3>Ready for Analysis</h3>
          <p>Please select your desired date range above to generate a comprehensive sales intelligence report.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .header-badge {
      display: flex;
      align-items: center;
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      background-color: var(--color-success);
      border-radius: 50%;
      margin-right: 6px;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
      70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
      100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }

    .premium-filter {
      position: relative;
      z-index: 5;
    }

    .filter-separator {
      color: var(--color-gray-300);
      display: flex;
      align-items: center;
      padding-bottom: 8px;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
      margin-bottom: 32px;
    }

    .kpi-card {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-height: 160px;
    }

    .highlight-card {
      background: linear-gradient(135deg, var(--color-white) 0%, var(--color-accent-soft) 100%);
      border: 1px solid var(--color-primary-light);
      box-shadow: 0 10px 20px -5px rgba(67, 56, 202, 0.15);
    }

    .kpi-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .kpi-title {
      font-size: 13px;
      font-weight: 700;
      color: var(--color-gray-500);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .highlight-card .kpi-title {
      color: var(--color-primary-dark);
    }

    .kpi-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .kpi-icon.blue { background-color: var(--color-accent-soft); color: var(--color-primary); }
    .kpi-icon.primary { background-color: var(--color-primary); color: var(--color-white); }
    .kpi-icon.green { background-color: var(--color-success-soft); color: var(--color-success); }

    .kpi-body {
      display: flex;
      align-items: baseline;
      gap: 8px;
    }

    .kpi-value {
      font-size: 36px;
      font-weight: 800;
      color: var(--color-gray-900);
      letter-spacing: -0.03em;
      line-height: 1;
    }

    .highlight-card .kpi-value {
      color: var(--color-primary-dark);
    }

    .kpi-unit {
      font-size: 16px;
      font-weight: 600;
      color: var(--color-gray-400);
    }

    .kpi-footer {
      margin-top: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 13px;
      color: var(--color-gray-500);
      font-weight: 500;
    }

    .progress-bar-bg {
      height: 6px;
      background-color: var(--color-gray-100);
      border-radius: 3px;
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .progress-bar-fill.primary { background-color: var(--color-primary); }

    .pipeline-infographic {
      display: flex;
      flex-direction: column;
      gap: 16px;
      width: 100%;
      padding-top: 8px;
    }

    .pipeline-bar {
      width: 100%;
      height: 12px;
      border-radius: 6px;
      display: flex;
      overflow: hidden;
      background-color: rgba(255,255,255,0.5);
      box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);
    }

    .pipeline-segment {
      height: 100%;
      transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .pipeline-segment.success { background-color: var(--color-success); }
    .pipeline-segment.warning { background-color: var(--color-warning); }

    .pipeline-legend {
      display: flex;
      gap: 16px;
      font-size: 13px;
      color: var(--color-primary-dark);
      font-weight: 600;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .dot.success { background-color: var(--color-success); }
    .dot.warning { background-color: var(--color-warning); }

    .main-stats-container {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 24px;
    }

    .section-header {
      padding: 24px 28px;
      border-bottom: 1px solid var(--glass-border);
    }

    .section-header h3 { margin: 0; font-size: 18px; font-weight: 800; color: var(--color-gray-900); }
    .section-header p { margin: 4px 0 0; font-size: 14px; color: var(--color-gray-500); }

    .breakdown-list {
      padding: 12px 0;
    }

    .breakdown-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 28px;
      border-bottom: 1px solid var(--color-gray-50);
      transition: all 0.2s ease;
    }

    .breakdown-item:hover { 
      background-color: var(--color-gray-50); 
      transform: translateX(4px);
    }
    
    .breakdown-item:last-child { border-bottom: none; }

    .item-main {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .item-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    }

    .item-icon.blue { background-color: var(--color-accent-soft); color: var(--color-primary); }
    .item-icon.yellow { background-color: var(--color-warning-soft); color: #D97706; }
    .item-icon.green { background-color: var(--color-success-soft); color: var(--color-success); }

    .item-info { display: flex; flex-direction: column; }
    .item-name { font-weight: 700; font-size: 15px; color: var(--color-gray-900); margin-bottom: 2px; }
    .item-desc { font-size: 13px; color: var(--color-gray-500); font-weight: 500; }

    .item-value { font-size: 20px; font-weight: 800; letter-spacing: -0.02em; }
    .item-value.warning { color: #D97706; }
    .item-value.success { color: var(--color-success); }

    .chart-container {
      padding: 40px 28px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 40px;
    }

    .donut-wrapper {
      position: relative;
      width: 180px;
      height: 180px;
    }

    .donut-chart {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: inset 0 2px 10px rgba(0,0,0,0.05);
      transition: background 0.5s ease;
    }

    .donut-hole {
      width: 136px;
      height: 136px;
      background-color: var(--color-white);
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }

    .donut-value {
      font-size: 28px;
      font-weight: 800;
      color: var(--color-gray-900);
      line-height: 1;
      letter-spacing: -0.03em;
    }

    .donut-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--color-gray-500);
      margin-top: 6px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .chart-legend {
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 100%;
    }

    .legend-row {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 20px;
      background-color: var(--color-gray-50);
      border-radius: 12px;
      transition: background-color 0.2s ease;
    }
    
    .legend-row:hover {
      background-color: var(--color-gray-100);
    }

    .legend-marker {
      width: 14px;
      height: 14px;
      border-radius: 4px;
    }

    .legend-marker.completed { background-color: var(--color-success); box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3); }
    .legend-marker.processing { background-color: var(--color-warning); box-shadow: 0 2px 4px rgba(245, 158, 11, 0.3); }

    .legend-text {
      display: flex;
      justify-content: space-between;
      flex: 1;
      align-items: center;
    }

    .l-name { font-size: 14px; font-weight: 600; color: var(--color-gray-700); }
    .l-val { font-size: 15px; font-weight: 800; color: var(--color-gray-900); }

    .empty-icon {
      color: var(--color-primary-light);
      margin-bottom: 24px;
      opacity: 0.8;
      display: flex;
      justify-content: center;
    }
    
    @media (max-width: 1024px) {
      .kpi-grid, .main-stats-container {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class SalesSummaryComponent implements OnInit {
  salesSummary = signal<SalesSummary | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);
  startDate = '';
  endDate = '';

  constructor(private sapApi: SapApiService) {}

  ngOnInit(): void {
    this.loadSalesSummary();
  }

  loadSalesSummary(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const sapFrom = this.startDate ? this.startDate.replace(/-/g, '') : undefined;
    const sapTo   = this.endDate ? this.endDate.replace(/-/g, '') : undefined;

    this.sapApi.getSalesSummary(sapFrom, sapTo).subscribe({
      next: (response) => {
        this.salesSummary.set(response.data || null);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load sales summary');
        this.isLoading.set(false);
      }
    });
  }

  applyFilters(): void {
    this.loadSalesSummary();
  }

  clearFilters(): void {
    this.startDate = '';
    this.endDate = '';
    this.loadSalesSummary();
  }

  calculatePercentage(part: string | undefined, total: string | undefined): string {
    const p = parseInt(part || '0');
    const t = parseInt(total || '0');
    if (t === 0) return '0';
    return Math.round((p / t) * 100).toString();
  }

  formatCurrency(value: string | number): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0.00';
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  getDonutGradient(): string {
    if (!this.salesSummary()) return 'conic-gradient(#e2e8f0 0% 100%)';
    const closedPercent = parseFloat(this.calculatePercentage(this.salesSummary()?.CLOSED_ORDERS, this.salesSummary()?.TOTAL_ORDERS));
    return `conic-gradient(#10b981 0% ${closedPercent}%, #f59e0b ${closedPercent}% 100%)`;
  }
}
