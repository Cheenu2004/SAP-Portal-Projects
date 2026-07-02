import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SapApiService, InquiryItem, SalesOrderItem, DeliveryItem, InvoiceItem } from '../../services/sap-api.service';
import { AuthService } from '../../services/auth.service';
import { forkJoin } from 'rxjs';
import { CardComponent } from '../../components/ui/card.component';
import { TableComponent } from '../../components/ui/table.component';
import { TrimZerosPipe } from '../../components/ui/trim-zeros.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, CardComponent, TableComponent, TrimZerosPipe],
  template: `
    <div class="page dashboard-page">
      <div class="page-header">
        <div class="header-main">
          <h1>Welcome, <span class="accent-text">{{ customerName }}</span></h1>
          <p>Here's what's happening with your SAP business operations today.</p>
        </div>
      </div>

      @if (isLoading()) {
        <div class="loading-container">
          <div class="spinner"></div>
          <p>Fetching real-time data from SAP...</p>
        </div>
      } @else {
        <!-- Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card-wrapper" routerLink="/inquiry">
            <app-ui-card class="stat-card">
              <div class="stat-header">
                <div class="stat-icon inquiry-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </div>
                <div class="trend-badge positive">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                </div>
              </div>
              <div class="stat-content">
                <span class="stat-value">{{ inquiries().length }}</span>
                <span class="stat-label">Active Inquiries</span>
              </div>
              <div class="stat-footer">
                <span class="stat-action">View all inquiries &rarr;</span>
              </div>
            </app-ui-card>
          </div>

          <div class="stat-card-wrapper" routerLink="/sales-orders">
            <app-ui-card class="stat-card">
              <div class="stat-header">
                <div class="stat-icon orders-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                </div>
                <div class="trend-badge positive">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                </div>
              </div>
              <div class="stat-content">
                <span class="stat-value">{{ salesOrders().length }}</span>
                <span class="stat-label">Sales Orders</span>
              </div>
              <div class="stat-footer">
                <span class="stat-action">Manage orders &rarr;</span>
              </div>
            </app-ui-card>
          </div>

          <div class="stat-card-wrapper" routerLink="/delivery">
            <app-ui-card class="stat-card">
              <div class="stat-header">
                <div class="stat-icon delivery-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                </div>
                <div class="trend-badge neutral">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </div>
              </div>
              <div class="stat-content">
                <span class="stat-value">{{ deliveries().length }}</span>
                <span class="stat-label">Deliveries</span>
              </div>
              <div class="stat-footer">
                <span class="stat-action">Track shipments &rarr;</span>
              </div>
            </app-ui-card>
          </div>

          <div class="stat-card-wrapper" routerLink="/invoices">
            <app-ui-card class="stat-card">
              <div class="stat-header">
                <div class="stat-icon invoices-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                </div>
                <div class="trend-badge neutral">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </div>
              </div>
              <div class="stat-content">
                <span class="stat-value">{{ invoices().length }}</span>
                <span class="stat-label">Invoices</span>
              </div>
              <div class="stat-footer">
                <span class="stat-action">View financials &rarr;</span>
              </div>
            </app-ui-card>
          </div>
        </div>

        <div class="dashboard-grid">
          <!-- Recent Activity -->
          <div class="recent-section">
            <app-ui-card class="activity-card">
              <div class="section-header">
                <div class="header-titles">
                  <h3>Recent Sales Orders</h3>
                  <p>Latest confirmed orders from SAP</p>
                </div>
                <a routerLink="/sales-orders" class="view-all-btn">
                  View all
                </a>
              </div>
              
              @if (salesOrders().length === 0) {
                <div class="empty-state">
                  <div class="empty-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
                  </div>
                  <p>No sales orders found</p>
                </div>
              } @else {
                <div class="modern-table-wrapper">
                  <table class="modern-table">
                    <thead>
                      <tr>
                        <th>Document No</th>
                        <th>Date</th>
                        <th>Net Value</th>
                        <th>Currency</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (order of salesOrders().slice(0, 5); track order.VBELN) {
                        <tr>
                          <td><span class="doc-badge">{{ order.VBELN | trimZeros }}</span></td>
                          <td>{{ formatDate(order.ERDAT) }}</td>
                          <td class="font-medium">{{ formatCurrency(order.NETWR) }}</td>
                          <td class="currency-cell"><span class="currency-tag">{{ order.WAERK }}</span></td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </app-ui-card>
          </div>

          <!-- Recent Invoices -->
          <div class="recent-section">
            <app-ui-card class="activity-card">
              <div class="section-header">
                <div class="header-titles">
                  <h3>Recent Invoices</h3>
                  <p>Latest billing documents</p>
                </div>
                <a routerLink="/invoices" class="view-all-btn">
                  View all
                </a>
              </div>

              @if (invoices().length === 0) {
                <div class="empty-state">
                  <div class="empty-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  <p>No invoices found</p>
                </div>
              } @else {
                <div class="modern-table-wrapper">
                  <table class="modern-table">
                    <thead>
                      <tr>
                        <th>Invoice No</th>
                        <th>Date</th>
                        <th>Net Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (invoice of invoices().slice(0, 5); track invoice.VBELN) {
                        <tr>
                          <td><span class="doc-badge success">{{ invoice.VBELN | trimZeros }}</span></td>
                          <td>{{ formatDate(invoice.FKDAT) }}</td>
                          <td class="font-medium">{{ formatCurrency(invoice.NETWR) }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </app-ui-card>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard-page {
      padding-top: 16px;
    }

    .accent-text {
      color: var(--color-primary);
      font-weight: 800;
      background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 24px;
      margin-bottom: 32px;
    }

    @media (max-width: 1200px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }
    }

    .stat-card-wrapper {
      text-decoration: none;
      cursor: pointer;
    }

    .stat-card {
      padding: 24px !important;
      display: flex;
      flex-direction: column;
      gap: 20px;
      height: 100%;
      border: 1px solid var(--glass-border) !important;
      background: rgba(255, 255, 255, 0.4) !important;
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      position: relative;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.04) !important;
    }

    .stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 4px;
      background: var(--color-gray-200);
      transition: background 0.3s ease;
    }

    .stat-card-wrapper:nth-child(1) .stat-card::before { background: linear-gradient(90deg, var(--color-primary), var(--color-accent)); }
    .stat-card-wrapper:nth-child(2) .stat-card::before { background: linear-gradient(90deg, var(--color-success), #34d399); }
    .stat-card-wrapper:nth-child(3) .stat-card::before { background: linear-gradient(90deg, var(--color-warning), #fbbf24); }
    .stat-card-wrapper:nth-child(4) .stat-card::before { background: linear-gradient(90deg, #0284C7, #38bdf8); }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 16px 32px -8px rgba(99, 102, 241, 0.12), 0 0 0 1px rgba(99, 102, 241, 0.2) inset !important;
      border-color: rgba(99, 102, 241, 0.3) !important;
    }

    .stat-card:hover .stat-action {
      opacity: 1;
      transform: translateX(4px);
      color: var(--color-primary);
    }

    .stat-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }

    .inquiry-icon { background: linear-gradient(135deg, #EEF2FF, #E0E7FF); color: var(--color-primary); }
    .orders-icon { background: linear-gradient(135deg, #ECFDF5, #D1FAE5); color: var(--color-success); }
    .delivery-icon { background: linear-gradient(135deg, #FFFBEB, #FEF3C7); color: var(--color-warning); }
    .invoices-icon { background: linear-gradient(135deg, #F0F9FF, #E0F2FE); color: #0284C7; }

    .trend-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 50%;
    }
    
    .trend-badge.positive { background-color: #ECFDF5; color: var(--color-success); }
    .trend-badge.neutral { background-color: var(--color-gray-100); color: var(--color-gray-500); }

    .stat-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .stat-value {
      font-size: 32px;
      font-weight: 800;
      color: var(--color-gray-900);
      letter-spacing: -0.02em;
      line-height: 1.1;
    }

    .stat-label {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-gray-500);
    }

    .stat-footer {
      margin-top: auto;
      padding-top: 16px;
      border-top: 1px solid var(--color-gray-100);
    }

    .stat-action {
      font-size: 13px;
      font-weight: 600;
      color: var(--color-gray-400);
      transition: all 0.2s ease;
      display: inline-block;
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
    }

    @media (max-width: 1024px) {
      .dashboard-grid {
        grid-template-columns: 1fr;
      }
    }

    .activity-card {
      padding: 0 !important;
      height: 100%;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid var(--color-gray-100);
    }

    .header-titles h3 {
      font-size: 16px;
      font-weight: 700;
      color: var(--color-gray-900);
      margin: 0 0 4px 0;
    }

    .header-titles p {
      font-size: 13px;
      color: var(--color-gray-500);
      margin: 0;
    }

    .view-all-btn {
      font-size: 13px;
      font-weight: 600;
      color: var(--color-primary);
      background: var(--color-accent-soft);
      padding: 6px 12px;
      border-radius: var(--radius-sm);
      text-decoration: none;
      transition: all 0.2s ease;
    }

    .view-all-btn:hover {
      background: var(--color-primary);
      color: var(--color-white);
    }

    .modern-table-wrapper {
      padding: 0;
      overflow-x: auto;
    }

    .modern-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .modern-table th {
      font-size: 12px;
      font-weight: 600;
      color: var(--color-gray-500);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 16px 24px;
      background: #FAFAFA;
      border-bottom: 1px solid var(--color-gray-100);
    }

    .modern-table td {
      padding: 16px 24px;
      font-size: 14px;
      color: var(--color-gray-700);
      border-bottom: 1px solid var(--color-gray-50);
      vertical-align: middle;
    }

    .modern-table tr:last-child td {
      border-bottom: none;
    }

    .modern-table tbody tr {
      transition: background-color 0.2s ease;
    }

    .modern-table tbody tr:hover {
      background-color: var(--color-gray-50);
    }

    .font-medium {
      font-weight: 600;
      color: var(--color-gray-900);
    }

    .doc-badge {
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 13px;
      background-color: var(--color-gray-100);
      color: var(--color-gray-700);
      padding: 4px 10px;
      border-radius: 6px;
      font-weight: 500;
    }

    .doc-badge.success {
      background-color: var(--color-success-soft);
      color: var(--color-success);
    }

    .currency-tag {
      font-size: 11px;
      font-weight: 700;
      color: var(--color-gray-500);
      background: var(--color-gray-100);
      padding: 2px 6px;
      border-radius: 4px;
      letter-spacing: 0.05em;
    }

    .empty-state {
      padding: 48px 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--color-gray-500);
    }

    .empty-icon {
      color: var(--color-gray-300);
      margin-bottom: 16px;
    }
  `]
})
export class DashboardComponent implements OnInit {
  inquiries = signal<InquiryItem[]>([]);
  salesOrders = signal<SalesOrderItem[]>([]);
  deliveries = signal<DeliveryItem[]>([]);
  invoices = signal<InvoiceItem[]>([]);
  isLoading = signal(true);

  constructor(private sapApi: SapApiService, private authService: AuthService) {}

  get customerName(): string {
    return this.authService.currentCustomer()?.NAME1 || 'Customer';
  }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading.set(true);

    forkJoin({
      inquiries: this.sapApi.getInquiries(),
      salesOrders: this.sapApi.getSalesOrders(),
      deliveries: this.sapApi.getDeliveries(),
      invoices: this.sapApi.getInvoices()
    }).subscribe({
      next: (results) => {
        this.inquiries.set(results.inquiries.data || []);
        this.salesOrders.set(results.salesOrders.data || []);
        this.deliveries.set(results.deliveries.data || []);
        this.invoices.set(results.invoices.data || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr || dateStr === '0000-00-00') return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString();
    } catch {
      return dateStr;
    }
  }

  formatCurrency(value: string): string {
    if (!value) return '0.00';
    const num = parseFloat(value);
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
