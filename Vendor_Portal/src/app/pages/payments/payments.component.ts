import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/toast/toast.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-payments',
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
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.css'
})
export class PaymentsComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['WfInvDoc', 'WfDueDate', 'WfAging', 'WfAmount', 'WfCurrency', 'WfStatus'];
  dataSource = new MatTableDataSource<any>([]);

  totalPayments = 0;
  totalAmount = 0;
  
  filterSearch = '';
  selectedSort = '';

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
      this.apiService.getPayments(vendorId).subscribe({
        next: (res) => {
          if (res && res.d && res.d.results) {
            const data = res.d.results.map((item: any) => {
              return {
                ...item,
                WfAging: this.calculateAging(item.WfDueDate || item.WfPostDate)
              };
            });
            this.dataSource.data = data;

            this.totalPayments = data.length;
            this.totalAmount = data.reduce((sum: number, p: any) => sum + (parseFloat(p.WfAmount) || 0), 0);
          }
        },
        error: (err) => {
          this.toast.error('Failed to load Payments');
          console.error(err);
        }
      });
    }
  }

  calculateAging(dueDate: string | Date): number {
    if (!dueDate) return 0;
    const due = new Date(dueDate);
    const today = new Date();
    
    // Set both to midnight for accurate day calculation
    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  }

  setupFilterPredicate() {
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      if (!filter) return true;
      const searchTerms = JSON.parse(filter);
      const query = searchTerms.search?.toLowerCase() || '';
      
      return !query ||
        (data.WfInvDoc?.toLowerCase().includes(query)) ||
        (data.WfMemoDoc?.toLowerCase().includes(query)) ||
        (data.WfAmount?.toLowerCase().includes(query)) ||
        (data.WfCurrency?.toLowerCase().includes(query)) ||
        (data.WfStatus?.toLowerCase().includes(query));
    };
  }

  applyFilters() {
    const searchTerms = {
      search: this.filterSearch
    };
    this.dataSource.filter = JSON.stringify(searchTerms);

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  resetFilters() {
    this.filterSearch = '';
    this.selectedSort = '';

    this.dataSource.filter = JSON.stringify({ search: '' });

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
