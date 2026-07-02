import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SapApiService, InvoiceItem } from '../../services/sap-api.service';
import { CardComponent } from '../../components/ui/card.component';
import { TableComponent } from '../../components/ui/table.component';
import { BadgeComponent } from '../../components/ui/badge.component';
import { ButtonComponent } from '../../components/ui/button.component';
import { InputComponent } from '../../components/ui/input.component';

import { TrimZerosPipe } from '../../components/ui/trim-zeros.pipe';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, TableComponent, BadgeComponent, ButtonComponent, InputComponent, TrimZerosPipe],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Invoices</h1>
        <p>View and download invoice documents from SAP</p>
      </div>

      <!-- Filters -->
      <app-ui-card class="filter-card">
        <div class="filter-row">
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
          <span>Loading invoices...</span>
        </div>
      } @else if (error()) {
        <div class="alert alert-error">
          {{ error() }}
        </div>
      } @else {
        <app-ui-card>
          @if (invoices().length === 0) {
            <div class="empty-state">
              <h3>No Invoices Found</h3>
              <p>There are no invoices available for your account.</p>
            </div>
          } @else {
            <app-ui-table 
              (sortChange)="onSort($event)"
              [columns]="[
              { label: 'Invoice No', key: 'VBELN', sortable: true },
              { label: 'Date', key: 'FKDAT', sortable: true },
              { label: 'Material', key: 'MATNR', sortable: true },
              { label: 'Quantity', key: 'QTY', sortable: true },
              { label: 'Net Value', key: 'NETWR', sortable: true },
              { label: 'Currency' },
              { label: 'Actions', width: '100px' }
            ]">
              @for (invoice of invoices(); track invoice.VBELN) {
                <tr>
                  <td><span class="doc-number">{{ invoice.VBELN | trimZeros }}</span></td>
                  <td>{{ formatDate(invoice.FKDAT) }}</td>
                  <td>{{ invoice.MATNR | trimZeros }}</td>
                  <td>{{ invoice.QTY }}</td>
                  <td class="text-right">{{ formatCurrency(invoice.NETWR) }}</td>
                  <td>{{ invoice.WAERK || 'EUR' }}</td>
                  <td>
                    <app-ui-button 
                      variant="outline"
                      size="sm"
                      (click)="downloadPdf(invoice.VBELN)"
                      [loading]="downloadingInvoice() === invoice.VBELN"
                    >
                      <svg *ngIf="downloadingInvoice() !== invoice.VBELN" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      PDF
                    </app-ui-button>
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
export class InvoicesComponent implements OnInit {
  allInvoices: InvoiceItem[] = [];
  invoices = signal<InvoiceItem[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  downloadingInvoice = signal<string | null>(null);
  startDate = '';
  endDate = '';
  currentSort = { column: '', direction: 'asc' };

  constructor(private sapApi: SapApiService) {}

  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.sapApi.getInvoices().subscribe({
      next: (response) => {
        this.allInvoices = response.data || [];
        this.applyFilters();
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load invoices');
        this.isLoading.set(false);
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.allInvoices];

    if (this.startDate) {
      const start = new Date(this.startDate).getTime();
      filtered = filtered.filter(inv => {
        const d = new Date(inv.FKDAT).getTime();
        return !isNaN(d) && d >= start;
      });
    }

    if (this.endDate) {
      const end = new Date(this.endDate).getTime();
      filtered = filtered.filter(inv => {
        const d = new Date(inv.FKDAT).getTime();
        return !isNaN(d) && d <= end;
      });
    }

    this.invoices.set(this.sortData(filtered, this.currentSort.column, this.currentSort.direction));
  }

  clearFilters(): void {
    this.startDate = '';
    this.endDate = '';
    this.applyFilters();
  }

  onSort(event: { column: string, direction: 'asc' | 'desc' }) {
    this.currentSort = event;
    this.invoices.set(this.sortData([...this.invoices()], event.column, event.direction));
  }

  private sortData(data: InvoiceItem[], column: string, direction: string): InvoiceItem[] {
    if (!column) return data;
    return data.sort((a: any, b: any) => {
      const valA = a[column] || '';
      const valB = b[column] || '';
      const modifier = direction === 'asc' ? 1 : -1;
      
      if (column === 'NETWR' || column === 'QTY') {
        return (parseFloat(valA) - parseFloat(valB)) * modifier;
      }
      return valA.toString().localeCompare(valB.toString()) * modifier;
    });
  }

  downloadPdf(invoiceNumber: string): void {
    this.downloadingInvoice.set(invoiceNumber);

    this.sapApi.getInvoicePdf(invoiceNumber).subscribe({
      next: (res) => {
        if (res.success && res.pdfBase64) {
          this.sapApi.downloadPdfFromBase64(res.pdfBase64, res.fileName);
        } else {
          alert('Invoice PDF not available from SAP');
        }
        this.downloadingInvoice.set(null);
      },
      error: () => {
        alert('Failed to download invoice PDF');
        this.downloadingInvoice.set(null);
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
