import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SapApiService, InquiryItem } from '../../services/sap-api.service';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../components/ui/card.component';
import { TableComponent } from '../../components/ui/table.component';
import { BadgeComponent } from '../../components/ui/badge.component';
import { ButtonComponent } from '../../components/ui/button.component';
import { InputComponent } from '../../components/ui/input.component';
import { TrimZerosPipe } from '../../components/ui/trim-zeros.pipe';

@Component({
  selector: 'app-inquiry',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, TableComponent, BadgeComponent, ButtonComponent, InputComponent, TrimZerosPipe],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Inquiries</h1>
        <p>View all customer inquiries from SAP</p>
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
          <span>Loading inquiries...</span>
        </div>
      } @else if (error()) {
        <div class="alert alert-error">
          {{ error() }}
        </div>
      } @else {
        <app-ui-card>
          @if (inquiries().length === 0) {
            <div class="empty-state">
              <h3>No Inquiries Found</h3>
              <p>There are no inquiries available for your account.</p>
            </div>
          } @else {
            <app-ui-table 
              (sortChange)="onSort($event)"
              [columns]="[
              { label: 'Document No', key: 'VBELN', sortable: true },
              { label: 'Date', key: 'ERDAT', sortable: true },
              { label: 'Material', key: 'MATNR', sortable: true },
              { label: 'Description', key: 'MAKTX', sortable: true },
              { label: 'Quantity', key: 'KWMENG', sortable: true },
              { label: 'Net Value', key: 'NETWR', sortable: true }
            ]">
              @for (item of inquiries(); track item.VBELN) {
                <tr>
                  <td><span class="doc-number">{{ item.VBELN | trimZeros }}</span></td>
                  <td>{{ formatDate(item.ERDAT) }}</td>
                  <td>{{ item.MATNR | trimZeros }}</td>
                  <td class="desc-cell">{{ item.MAKTX || '—' }}</td>
                  <td>{{ item.KWMENG }} {{ item.VRKME }}</td>
                  <td class="text-right amount-cell">{{ formatCurrency(item.NETWR) }} {{ item.WAERK }}</td>
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

    .desc-cell {
      color: var(--color-gray-600);
      font-size: 13.5px;
    }

    .amount-cell {
      font-weight: 500;
      color: var(--color-gray-800);
    }
  `]
})
export class InquiryComponent implements OnInit {
  allInquiries: InquiryItem[] = [];
  inquiries = signal<InquiryItem[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  startDate = '';
  endDate = '';
  currentSort = { column: '', direction: 'asc' };

  constructor(private sapApi: SapApiService) {}

  ngOnInit(): void {
    this.loadInquiries();
  }

  loadInquiries(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.sapApi.getInquiries().subscribe({
      next: (response) => {
        this.allInquiries = response.data || [];
        this.applyFilters();
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load inquiries');
        this.isLoading.set(false);
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.allInquiries];

    if (this.startDate) {
      const start = new Date(this.startDate).getTime();
      filtered = filtered.filter(inv => {
        const d = new Date(inv.ERDAT).getTime();
        return !isNaN(d) && d >= start;
      });
    }

    if (this.endDate) {
      const end = new Date(this.endDate).getTime();
      filtered = filtered.filter(inv => {
        const d = new Date(inv.ERDAT).getTime();
        return !isNaN(d) && d <= end;
      });
    }

    this.inquiries.set(this.sortData(filtered, this.currentSort.column, this.currentSort.direction));
  }

  clearFilters(): void {
    this.startDate = '';
    this.endDate = '';
    this.applyFilters();
  }

  onSort(event: { column: string, direction: 'asc' | 'desc' }) {
    this.currentSort = event;
    this.inquiries.set(this.sortData([...this.inquiries()], event.column, event.direction));
  }

  private sortData(data: InquiryItem[], column: string, direction: string): InquiryItem[] {
    if (!column) return data;
    return data.sort((a: any, b: any) => {
      const valA = a[column] || '';
      const valB = b[column] || '';
      const modifier = direction === 'asc' ? 1 : -1;
      
      if (column === 'NETWR' || column === 'KWMENG') {
        return (parseFloat(valA) - parseFloat(valB)) * modifier;
      }
      return valA.toString().localeCompare(valB.toString()) * modifier;
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
