import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { RFQ } from '../../core/models/api-models';
import { ToastService } from '../../shared/toast/toast.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-rfqs',
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
  templateUrl: './rfqs.component.html',
  styleUrl: './rfqs.component.css'
})
export class RfqsComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['WfRfqNo', 'WfRfqDate', 'WfMaterial', 'WfQuantity', 'WfUom', 'WfNetPrice', 'WfCurrency', 'WfPlant'];
  dataSource = new MatTableDataSource<RFQ>([]);

  totalRfqs = 0;
  recentRfqDate: string | null = null;
  uniqueMaterials = 0;

  filterRfqNo = '';
  filterMaterial = '';
  filterPlant = '';
  selectedSort = '';

  rfqNumbers: string[] = [];
  materials: string[] = [];
  plants: string[] = [];

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
      this.apiService.getRFQs(vendorId).subscribe({
        next: (res) => {
          if (res && res.d && res.d.results) {
            this.dataSource.data = res.d.results;

            this.totalRfqs = res.d.results.length;

            // Build dropdown options from real data
            this.rfqNumbers = [...new Set(res.d.results.map(r => r.WfRfqNo).filter(Boolean))];
            this.materials = [...new Set(res.d.results.map(r => r.WfMaterial).filter(Boolean))];
            this.plants = [...new Set(res.d.results.map(r => r.WfPlant?.Werks).filter((v): v is string => !!v))];

            if (res.d.results.length > 0) {
              const dates = res.d.results.map(r => new Date(r.WfRfqDate).getTime());
              const maxDate = new Date(Math.max(...dates));
              this.recentRfqDate = maxDate.toISOString();
              this.uniqueMaterials = this.materials.length;
            }
          }
        },
        error: (err) => {
          this.toast.error('Failed to load RFQs');
          console.error(err);
        }
      });
    }
  }

  setupFilterPredicate() {
    this.dataSource.filterPredicate = (data: RFQ, filter: string) => {
      if (!filter) return true;
      const searchTerms = JSON.parse(filter);

      // General search — partial match across all text fields
      const query = searchTerms.rfqNo?.toLowerCase() || '';
      const matchGeneral = !query ||
        (data.WfRfqNo?.toLowerCase().includes(query)) ||
        (data.WfMaterial?.toLowerCase().includes(query)) ||
        (data.WfUom?.toLowerCase().includes(query)) ||
        (data.WfCurrency?.toLowerCase().includes(query)) ||
        (data.WfPlant?.Werks?.toLowerCase().includes(query));

      // Dropdown filters — exact match
      const matchMaterial = !searchTerms.material || data.WfMaterial === searchTerms.material;
      const matchPlant = !searchTerms.plant || (data.WfPlant?.Werks === searchTerms.plant);

      return matchGeneral && matchMaterial && matchPlant;
    };
  }

  applyFilters() {
    const searchTerms = {
      rfqNo: this.filterRfqNo,
      material: this.filterMaterial,
      plant: this.filterPlant
    };
    this.dataSource.filter = JSON.stringify(searchTerms);

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  resetFilters() {
    this.filterRfqNo = '';
    this.filterMaterial = '';
    this.filterPlant = '';
    this.selectedSort = '';
    
    this.dataSource.filter = JSON.stringify({rfqNo: '', material: '', plant: ''});
    
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
