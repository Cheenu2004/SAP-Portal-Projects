import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SapApiService, PaymentItem } from '../../services/sap-api.service';
import { CardComponent } from '../../components/ui/card.component';
import { TableComponent } from '../../components/ui/table.component';
import { BadgeComponent } from '../../components/ui/badge.component';
import { ButtonComponent } from '../../components/ui/button.component';
import { InputComponent } from '../../components/ui/input.component';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, TableComponent, BadgeComponent, ButtonComponent, InputComponent],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Payments</h1>
        <p>View all payment documents from SAP</p>
      </div>

      <!-- Filters -->
      <app-ui-card class="filter-card">
        <div class="filter-row">
          <div class="filter-group">
            <label class="filter-label">Status</label>
            <select [(ngModel)]="statusFilter" class="filter-select">
              <option value="">All Statuses</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>

          <app-ui-input
            type="date"
            label="Start Date"
            [(value)]="startDate"
            class="filter-input"
          ></app-ui-input>
          
          <app-ui-input
            type="date"
            label="End Date"
            [(value)]="endDate"
            class="filter-input"
          ></app-ui-input>

          <div class="filter-actions">
            <app-ui-button (click)="applyFilters()" [disabled]="isLoading()">
              Apply Filters
            </app-ui-button>
            <app-ui-button variant="outline" (click)="clearFilters()" [disabled]="isLoading()">
              Clear
            </app-ui-button>
          </div>
        </div>
      </app-ui-card>

      @if (isLoading()) {
        <div class="loading-container">
          <span class="spinner"></span>
          <span>Loading payments...</span>
        </div>
      } @else if (error()) {
        <div class="alert alert-error">
          {{ error() }}
        </div>
      } @else {
        <app-ui-card>
          @if (payments().length === 0) {
            <div class="empty-state">
              <h3>No Payments Found</h3>
              <p>There are no payments available for the selected criteria.</p>
            </div>
          } @else {
            <app-ui-table [columns]="[
              { label: 'Document No' },
              { label: 'Date' },
              { label: 'Amount' },
              { label: 'Currency' },
              { label: 'Aging (Days)' },
              { label: 'Status' }
            ]">
              @for (payment of payments(); track payment.BELNR) {
                <tr>
                  <td><span class="doc-number">{{ payment.BELNR }}</span></td>
                  <td>{{ formatDate(payment.BUDAT) }}</td>
                  <td class="text-right">{{ formatCurrency(payment.DMBTR) }}</td>
                  <td>{{ payment.WAERS }}</td>
                  <td>{{ payment.AGING }}</td>
                  <td>
                    <app-ui-badge [variant]="payment.STATUS === 'OVERDUE' ? 'error' : 'success'">
                      {{ payment.STATUS }}
                    </app-ui-badge>
                  </td>
                </tr>
              }
            </app-ui-table>
          }
        </app-ui-card>
      }
    </div>
  `,
  styles: [`
    .doc-number {
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 13px;
      background-color: var(--color-gray-50);
      padding: 3px 8px;
      border-radius: 6px;
      color: var(--color-gray-700);
    }

    .text-right {
      text-align: right;
    }
  `]
})
export class PaymentsComponent implements OnInit {
  allPayments: PaymentItem[] = [];
  payments = signal<PaymentItem[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  
  // Filters
  startDate = '';
  endDate = '';
  statusFilter = '';

  constructor(private sapApi: SapApiService) {}

  ngOnInit(): void {
    this.loadPayments();
  }

  loadPayments(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.sapApi.getPayments('', '').subscribe({
      next: (response) => {
        this.allPayments = response.data || [];
        this.applyFilters();
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load payments');
        this.isLoading.set(false);
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.allPayments];

    if (this.statusFilter) {
      filtered = filtered.filter(p => p.STATUS?.toUpperCase() === this.statusFilter.toUpperCase());
    }

    if (this.startDate) {
      const start = new Date(this.startDate).getTime();
      filtered = filtered.filter(p => {
        const d = new Date(p.BUDAT || p.BLDAT).getTime();
        return !isNaN(d) && d >= start;
      });
    }

    if (this.endDate) {
      const end = new Date(this.endDate).getTime();
      filtered = filtered.filter(p => {
        const d = new Date(p.BUDAT || p.BLDAT).getTime();
        return !isNaN(d) && d <= end;
      });
    }

    this.payments.set(filtered);
  }

  clearFilters(): void {
    this.startDate = '';
    this.endDate = '';
    this.statusFilter = '';
    this.applyFilters();
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
