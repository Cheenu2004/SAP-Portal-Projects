import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../../core/services/api.service';
import { InvoiceDetail, InvoiceHeader } from '../../../core/models/api-models';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    MatCardModule, 
    MatTableModule, 
    MatButtonModule, 
    MatIconModule, 
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './invoice-detail.component.html',
  styleUrl: './invoice-detail.component.css'
})
export class InvoiceDetailComponent implements OnInit {
  invoiceId: string = '';
  fiscYear: string = '';
  invoiceHeader: any = null;
  invoiceItems: InvoiceDetail[] = [];
  pdfUrl: SafeResourceUrl | null = null;
  isLoading = true;
  
  displayedColumns: string[] = ['WfItemNo', 'WfMaterial', 'WfDescription', 'WfQuantity', 'WfUom', 'WfAmount'];

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private sanitizer: DomSanitizer,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.invoiceId = params['id'];
      this.fiscYear = params['year'];
      this.loadInvoiceDetails();
    });
  }

  loadInvoiceDetails() {
    this.isLoading = true;
    
    // 1. Fetch Items
    this.apiService.getInvoiceDetails(this.invoiceId, this.fiscYear).subscribe({
      next: (res) => {
        if (res && res.d && res.d.results) {
          this.invoiceItems = res.d.results;
        }
      },
      error: (err) => {
        this.toast.error('Failed to load invoice items');
        console.error(err);
      }
    });

    // 2. Fetch PDF
    if (this.invoiceId) {
      this.apiService.getInvoicePdf(this.invoiceId, this.fiscYear).subscribe({
        next: (blob) => {
          const pdfBlob = blob.slice(0, blob.size, 'application/pdf');
          const blobUrl = URL.createObjectURL(pdfBlob);
          this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl);
          this.isLoading = false;
        },
        error: (err) => {
          this.toast.error('Failed to load invoice PDF');
          this.isLoading = false;
          console.error(err);
        }
      });
    } else {
      this.isLoading = false;
    }
  }

  private base64ToBlob(base64: string, contentType: string): Blob {
    const byteCharacters = atob(base64);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: contentType });
  }

  printPdf() {
    if (this.pdfUrl) {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = (this.pdfUrl as any).changingThisBreaksApplicationSecurity;
      document.body.appendChild(iframe);
      iframe.contentWindow?.print();
    }
  }

  downloadPdf() {
    if (this.invoiceId) {
      this.apiService.getInvoicePdf(this.invoiceId, this.fiscYear).subscribe({
        next: (blob) => {
          const pdfBlob = blob.slice(0, blob.size, 'application/pdf');
          const blobUrl = URL.createObjectURL(pdfBlob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.setAttribute('download', `Invoice_${this.invoiceId}.pdf`);
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
}
