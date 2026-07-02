import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { PurchaseOrder } from '../../core/models/api-models';
import { ToastService } from '../../shared/toast/toast.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-purchase-orders',
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
  templateUrl: './purchase-orders.component.html',
  styleUrl: './purchase-orders.component.css'
})
export class PurchaseOrdersComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['WfPoNumber', 'WfPoItem', 'WfPoDate', 'WfMaterial', 'WfQty', 'WfUom', 'WfNetPrice', 'WfCurrency'];
  dataSource = new MatTableDataSource<PurchaseOrder>([]);

  totalPOs = 0;
  uniqueMaterials = 0;

  filterSearch = '';
  filterMaterial = '';
  filterCurrency = '';
  selectedSort = '';

  materials: string[] = [];
  currencies: string[] = [];

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
      this.apiService.getPurchaseOrders(vendorId).subscribe({
        next: (res) => {
          if (res && res.d && res.d.results) {
            this.dataSource.data = res.d.results;

            this.totalPOs = res.d.results.length;

            // Build dropdown options from real data
            this.materials = [...new Set(res.d.results.map(r => r.WfMaterial).filter(Boolean))];
            this.currencies = [...new Set(res.d.results.map(r => r.WfCurrency).filter(Boolean))];
            this.uniqueMaterials = this.materials.length;
          }
        },
        error: (err) => {
          this.toast.error('Failed to load Purchase Orders');
          console.error(err);
        }
      });
    }
  }

  setupFilterPredicate() {
    this.dataSource.filterPredicate = (data: PurchaseOrder, filter: string) => {
      if (!filter) return true;
      const searchTerms = JSON.parse(filter);

      // General search — partial match across all text fields
      const query = searchTerms.search?.toLowerCase() || '';
      const matchGeneral = !query ||
        (data.WfPoNumber?.toLowerCase().includes(query)) ||
        (data.WfPoItem?.toLowerCase().includes(query)) ||
        (data.WfMaterial?.toLowerCase().includes(query)) ||
        (data.WfUom?.toLowerCase().includes(query)) ||
        (data.WfCurrency?.toLowerCase().includes(query)) ||
        (data.WfNetPrice?.toLowerCase().includes(query));

      // Dropdown filters — exact match
      const matchMaterial = !searchTerms.material || data.WfMaterial === searchTerms.material;
      const matchCurrency = !searchTerms.currency || data.WfCurrency === searchTerms.currency;

      return matchGeneral && matchMaterial && matchCurrency;
    };
  }

  applyFilters() {
    const searchTerms = {
      search: this.filterSearch,
      material: this.filterMaterial,
      currency: this.filterCurrency
    };
    this.dataSource.filter = JSON.stringify(searchTerms);

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  resetFilters() {
    this.filterSearch = '';
    this.filterMaterial = '';
    this.filterCurrency = '';
    this.selectedSort = '';

    this.dataSource.filter = JSON.stringify({ search: '', material: '', currency: '' });

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
