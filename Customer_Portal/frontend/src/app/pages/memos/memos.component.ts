import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SapApiService, MemoItem } from '../../services/sap-api.service';
import { CardComponent } from '../../components/ui/card.component';
import { TableComponent } from '../../components/ui/table.component';
import { BadgeComponent } from '../../components/ui/badge.component';
import { ButtonComponent } from '../../components/ui/button.component';
import { InputComponent } from '../../components/ui/input.component';

@Component({
  selector: 'app-memos',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, TableComponent, BadgeComponent, ButtonComponent, InputComponent],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Credit/Debit Memos</h1>
        <p>View all credit and debit memo documents from SAP</p>
      </div>

      <!-- Filters -->
      <app-ui-card class="filter-card">
        <div class="filter-row">
          <app-ui-input
            label="Search Memos"
            [(value)]="searchTerm"
            placeholder="Search by Document No or Material..."
            class="filter-input search-input"
            (valueChange)="applyFilters()"
          ></app-ui-input>

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
            <app-ui-button (click)="loadMemos()" [disabled]="isLoading()">
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
          <span>Loading memos...</span>
        </div>
      } @else if (error()) {
        <div class="alert alert-error">
          {{ error() }}
        </div>
      } @else {
        <app-ui-card>
          @if (filteredMemos().length === 0) {
            <div class="empty-state">
              <h3>No Memos Found</h3>
              <p>There are no credit or debit memos available for the selected criteria.</p>
            </div>
          } @else {
            <app-ui-table [columns]="[
              { label: 'Document No' },
              { label: 'Date' },
              { label: 'Memo Type' },
              { label: 'Material' },
              { label: 'Amount' },
              { label: 'Currency' }
            ]">
              @for (memo of filteredMemos(); track memo.VBELN) {
                <tr>
                  <td><span class="doc-number">{{ memo.VBELN }}</span></td>
                  <td>{{ formatDate(memo.FKDAT) }}</td>
                  <td>
                    <app-ui-badge [variant]="(memo.FKART || '').includes('CREDIT') ? 'success' : 'warning'">
                      {{ memo.FKART }}
                    </app-ui-badge>
                  </td>
                  <td>{{ memo.MATNR || 'N/A' }}</td>
                  <td class="text-right">{{ formatCurrency(memo.NETWR) }}</td>
                  <td>{{ memo.WAERK }}</td>
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
export class MemosComponent implements OnInit {
  memos = signal<MemoItem[]>([]);
  filteredMemos = signal<MemoItem[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  
  searchTerm = '';
  startDate = '';
  endDate = '';

  constructor(private sapApi: SapApiService) {}

  ngOnInit(): void {
    this.loadMemos();
  }

  loadMemos(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.sapApi.getMemos(this.startDate, this.endDate).subscribe({
      next: (response) => {
        this.memos.set(response.data || []);
        this.filteredMemos.set(response.data || []);
        this.isLoading.set(false);
        this.applyFilters();
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load memos');
        this.isLoading.set(false);
      }
    });
  }

  applyFilters(): void {
    const term = this.searchTerm.toLowerCase().trim();
    let filtered = [...this.memos()];

    if (term) {
      filtered = filtered.filter(memo => 
        (memo.VBELN && memo.VBELN.toLowerCase().includes(term)) ||
        (memo.MATNR && memo.MATNR.toLowerCase().includes(term)) ||
        (memo.FKART && memo.FKART.toLowerCase().includes(term))
      );
    }

    if (this.startDate) {
      const start = new Date(this.startDate).getTime();
      filtered = filtered.filter(memo => {
        const d = new Date(memo.FKDAT).getTime();
        return !isNaN(d) && d >= start;
      });
    }

    if (this.endDate) {
      const end = new Date(this.endDate).getTime();
      filtered = filtered.filter(memo => {
        const d = new Date(memo.FKDAT).getTime();
        return !isNaN(d) && d <= end;
      });
    }

    this.filteredMemos.set(filtered);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.startDate = '';
    this.endDate = '';
    this.loadMemos();
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
