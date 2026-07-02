import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Memo } from '../../core/models/api-models';
import { ToastService } from '../../shared/toast/toast.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-memos',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatCardModule,
    MatIconModule,
    MatSelectModule,
    FormsModule
  ],
  templateUrl: './memos.component.html',
  styleUrl: './memos.component.css'
})
export class MemosComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['WfMemoDoc', 'WfDocDate', 'WfPostDate', 'WfDocType', 'TransactionType', 'WfAmount', 'WfCurrency', 'WfStatus'];
  dataSource = new MatTableDataSource<Memo>([]);

  totalMemos = 0;
  totalCredit = 0;
  totalDebit = 0;

  filterSearch = '';
  filterStatus = '';
  filterCategory = '';
  filterDocType = '';
  selectedSort = '';

  statuses: string[] = ['OPEN', 'CLOSED'];
  categories: string[] = ['Credit', 'Debit'];
  docTypes: string[] = [];

  isCredit(docType: string): boolean {
    return docType === 'RE' || docType === 'KG' || docType.toLowerCase().includes('credit');
  }

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.setupFilterPredicate();
    this.loadData();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadData() {
    const vendorId = this.authService.getVendorId();
    if (vendorId) {
      this.apiService.getMemos(vendorId).subscribe({
        next: (res) => {
          if (res && res.d && res.d.results) {
            this.dataSource.data = res.d.results;

            this.totalMemos = res.d.results.length;
            
            // Calculate totals
            this.totalCredit = res.d.results.filter(m => this.isCredit(m.WfDocType)).length;
            this.totalDebit = res.d.results.filter(m => !this.isCredit(m.WfDocType)).length;

            // Dynamically populate Document Types
            this.docTypes = [...new Set(res.d.results.map(r => r.WfDocType).filter(Boolean))];
          }
        },
        error: (err) => {
          this.toast.error('Failed to load Memos');
          console.error(err);
        }
      });
    }
  }

  setupFilterPredicate() {
    this.dataSource.filterPredicate = (data: Memo, filter: string) => {
      if (!filter) return true;
      const searchTerms = JSON.parse(filter);
      
      const query = searchTerms.search?.toLowerCase() || '';
      const statusFilter = searchTerms.status;
      const categoryFilter = searchTerms.category;
      const docTypeFilter = searchTerms.docType;

      const matchGeneral = !query ||
        (data.WfMemoDoc?.toLowerCase().includes(query)) ||
        (data.WfDocType?.toLowerCase().includes(query)) ||
        (data.WfAmount?.toLowerCase().includes(query)) ||
        (data.WfCurrency?.toLowerCase().includes(query));

      const rowStatus = data.WfStatus || 'OPEN';
      const matchStatus = !statusFilter || rowStatus === statusFilter;
      
      const rowCategory = this.isCredit(data.WfDocType) ? 'Credit' : 'Debit';
      const matchCategory = !categoryFilter || rowCategory === categoryFilter;
      
      const matchDocType = !docTypeFilter || data.WfDocType === docTypeFilter;

      return matchGeneral && matchStatus && matchCategory && matchDocType;
    };
  }

  applyFilters() {
    const searchTerms = {
      search: this.filterSearch,
      status: this.filterStatus,
      category: this.filterCategory,
      docType: this.filterDocType
    };
    this.dataSource.filter = JSON.stringify(searchTerms);

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  resetFilters() {
    this.filterSearch = '';
    this.filterStatus = '';
    this.filterCategory = '';
    this.filterDocType = '';
    this.selectedSort = '';

    this.dataSource.filter = JSON.stringify({ search: '', status: '', category: '', docType: '' });

    if (this.dataSource.sort) {
      this.sort.active = '';
      this.sort.direction = '';
      this.sort.sortChange.emit();
    }

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  applySort(value: string) {
    if (value === 'reset') {
      this.resetFilters();
      return;
    }
    this.selectedSort = value;
    if (!value) return;
    const [column, direction] = value.split('_');
    this.dataSource.sort?.sort({ id: column, start: direction as 'asc' | 'desc', disableClear: true });
  }
}
