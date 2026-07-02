import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { InvoiceHeader } from '../../core/models/api-models';
import { ToastService } from '../../shared/toast/toast.service';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule,
    MatSelectModule,
    FormsModule
  ],
  templateUrl: './invoices.component.html',
  styleUrl: './invoices.component.css'
})
export class InvoicesComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['WfInvDoc', 'WfInvDate', 'WfPostDate', 'WfAmount', 'WfCurrency', 'actions'];
  dataSource = new MatTableDataSource<InvoiceHeader>([]);

  totalInvoices = 0;
  totalAmount = 0;

  filterSearch = '';
  selectedSort = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private toast: ToastService,
    private router: Router
  ) {}

  viewDetails(invoice: InvoiceHeader) {
    this.router.navigate(['/invoices', invoice.WfInvDoc, invoice.WfFiscYear]);
  }

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
      this.apiService.getInvoiceHeaders(vendorId).subscribe({
        next: (res) => {
          if (res && res.d && res.d.results) {
            this.dataSource.data = res.d.results;

            this.totalInvoices = res.d.results.length;
            this.totalAmount = res.d.results.reduce((sum, inv) => sum + (parseFloat(inv.WfAmount) || 0), 0);
          }
        },
        error: (err) => {
          this.toast.error('Failed to load Invoices');
          console.error(err);
        }
      });
    }
  }

  setupFilterPredicate() {
    this.dataSource.filterPredicate = (data: InvoiceHeader, filter: string) => {
      if (!filter) return true;
      const searchTerms = JSON.parse(filter);
      const query = searchTerms.search?.toLowerCase() || '';
      
      return !query ||
        (data.WfInvDoc?.toLowerCase().includes(query)) ||
        (data.WfAmount?.toLowerCase().includes(query)) ||
        (data.WfCurrency?.toLowerCase().includes(query));
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

  viewPdf(invoice: InvoiceHeader) {
    if (!invoice.WfInvDoc) return;
    this.apiService.getInvoicePdf(invoice.WfInvDoc, invoice.WfFiscYear).subscribe({
      next: (blob) => {
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      },
      error: (err) => {
        this.toast.error('Failed to load PDF');
        console.error(err);
      }
    });
  }

  downloadPdf(invoice: InvoiceHeader) {
    if (!invoice.WfInvDoc) return;
    this.apiService.getInvoicePdf(invoice.WfInvDoc, invoice.WfFiscYear).subscribe({
      next: (blob) => {
        const pdfBlob = blob.slice(0, blob.size, 'application/pdf');
        const blobUrl = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', `Invoice_${invoice.WfInvDoc}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      },
      error: (err) => {
        this.toast.error('Failed to download PDF');
        console.error(err);
      }
    });
  }
}
