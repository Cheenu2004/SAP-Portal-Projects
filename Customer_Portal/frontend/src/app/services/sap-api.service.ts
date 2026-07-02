import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { AuthService } from './auth.service';

// ─── Response Interfaces ────────────────────────────────────────────────────
// All responses follow the shape: { success, status, message, data }
// 'data' is always the raw SAP response — field names match your ABAP FM output.

export interface SapResponse<T> {
  success: boolean;
  status:  string;
  message: string;
  data:    T;
}

// Profile — matches KNA1 / ES_PROFILE fields from ZSD_PRF_FM902065
export interface CustomerProfile {
  KUNNR:     string;
  NAME1:     string;
  ORT01:     string;   // City
  PSTLZ:     string;   // Postal Code
  STRAS:     string;   // Street
  LAND1:     string;   // Country
  REGIO:     string;   // Region
  TELF1:     string;   // Phone
  ADRNR:     string;   // Address No.
  SMTP_ADDR: string;   // Email
}

// Inquiry — ET_INQUIRY row from ZSD_INQ_FM902065
export interface InquiryItem {
  VBELN: string;
  ERDAT: string;
  ERZET: string;
  ERNAM: string;
  ANGDT: string;
  BNDDT: string;
  AUART: string;
  AUGRU: string;
  NETWR: string;
  WAERK: string;
  KUNNR: string;
  VKORG: string;
  VTWEG: string;
  SPART: string;
  VKBUR: string;
  VKGRP: string;
  MATNR: string; // Material
  KWMENG: string; // Quantity
  VRKME: string; // Unit
  MAKTX?: string; // Material Description
}

// Sales Order — ET_SO row from ZSD_SO_FM902065
export interface SalesOrderItem {
  VBELN: string;
  ERDAT: string;
  ERZET: string;
  ERNAM: string;
  AUDAT: string;
  VBTYP: string;
  AUART: string;
  NETWR: string;
  WAERK: string;
  VKORG: string;
  VTWEG: string;
  SPART: string;
  VKBUR: string;
  VKGRP: string;
  MATNR: string; // Material
  KWMENG: string; // Quantity
  VRKME: string; // Unit
  MAKTX?: string; // Material Description
  BSTNK?: string; // Reference
}

// Delivery — ET_DEL row from ZSD_DEL_FM902065
export interface DeliveryItem {
  VBELN:    string;
  ERDAT:    string; // Created Date
  LFART:    string;
  LDDAT:    string;
  LFDAT:    string;
  KODAT:    string;
  ABLAD:    string;
  INCO1:    string;
  INCO2:    string;
  BTGEW:    string;
  NTGEW:    string;
  GEESSION: string;
  VOLUM:    string;
  VOLEH:    string;
  ANZPK:    string;
  KUNNR:    string;
  WERKS:    string;
  VSTEL:    string;
  VKORG:    string;
  LFUHR:    string;
  MATNR:    string; // Material
  LFIMG:    string; // Quantity
  VRKME:    string; // Unit
  WBSTK:    string; // Status
  MAKTX?:   string; // Material Description
}

// Invoice — ET_INV row from ZSD_INV_FM902065
export interface InvoiceItem {
  VBELN: string;
  FKART: string;
  FKTYP: string;
  VBTYP: string;
  WAERK: string;
  VKORG: string;
  VTWEG: string;
  SPART: string;
  FKDAT: string;
  KUNRG: string;
  KUNAG: string;
  NETWR: string;
  ZTERM: string;
  MATNR: string; // Material
  QTY:   string; // Quantity
  UNIT:  string; // Unit
}

// Payment — ET_PAY row from ZSD_PAY_FM902065
export interface PaymentItem {
  BUKRS: string;
  BELNR: string;
  GJAHR: string;
  BLART: string;
  BLDAT: string;
  BUDAT: string;
  MONAT: string;
  CPUDT: string;
  CPUTM: string;
  USNAM: string;
  TCODE: string;
  WAERS: string;
  KURSF: string;
  BSTAT: string;
  AWTYP: string;
  AWKEY: string;
  HWAER: string;
  XBLNR: string;
  DMBTR: string;
  AGING: string; // Aging Days
  STATUS: string; // Payment Status
}

// Memo — ET_MEM row from ZSD_MEM_FM902065
export interface MemoItem {
  VBELN: string;
  FKART: string;
  FKTYP: string;
  VBTYP: string;
  WAERK: string;
  VKORG: string;
  VTWEG: string;
  SPART: string;
  FKDAT: string;
  KUNRG: string;
  KUNAG: string;
  NETWR: string;
  ZTERM: string;
  MATNR: string; // Material
}

// Sales Summary — ES_SUMMARY from ZSD_SUM_902065_FM (single structure)
export interface SalesSummary {
  KUNNR: string;
  TOTAL_ORDERS: string;
  TOTAL_VALUE: string;
  OPEN_ORDERS: string;
  CLOSED_ORDERS: string;
  CURRENCY: string;
}

// Invoice PDF response
export interface InvoicePdfResponse {
  success:   boolean;
  status:    string;
  message:   string;
  pdfBase64: string;
  fileName:  string;
}

// ─── Service ────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class SapApiService {

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /** Get KUNNR from the currently logged-in customer. */
  private get kunnr(): string {
    return this.authService.currentCustomer()?.KUNNR || '';
  }

  // ── Profile ──────────────────────────────────────────────────────────────

  /**
   * POST /api/profile
   * Fetches full customer profile from SAP ZSD_PRF_FM902065.
   * Token is auto-attached by the AuthInterceptor.
   */
  getProfile(): Observable<SapResponse<CustomerProfile>> {
    return this.http.post<SapResponse<CustomerProfile>>(
      `${environment.apiUrl}/profile`,
      { kunnr: this.kunnr }
    );
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────

  /**
   * POST /api/dashboard/inquiry
   * Fetches inquiry list from SAP ZSD_INQ_FM902065.
   */
  getInquiries(): Observable<SapResponse<InquiryItem[]>> {
    return this.http.post<SapResponse<InquiryItem[]>>(
      `${environment.apiUrl}/dashboard/inquiry`,
      { kunnr: this.kunnr }
    );
  }

  /**
   * POST /api/dashboard/sales-orders
   * Fetches sales order list from SAP ZSD_SO_FM902065.
   */
  getSalesOrders(): Observable<SapResponse<SalesOrderItem[]>> {
    return this.http.post<SapResponse<SalesOrderItem[]>>(
      `${environment.apiUrl}/dashboard/sales-orders`,
      { kunnr: this.kunnr }
    );
  }

  /**
   * POST /api/dashboard/delivery
   * Fetches delivery list from SAP ZSD_DEL_FM902065.
   */
  getDeliveries(): Observable<SapResponse<DeliveryItem[]>> {
    return this.http.post<SapResponse<DeliveryItem[]>>(
      `${environment.apiUrl}/dashboard/delivery`,
      { kunnr: this.kunnr }
    );
  }

  // ── Financial ─────────────────────────────────────────────────────────────

  /**
   * POST /api/financial/invoices
   * Fetches invoice list from SAP ZSD_INV_FM902065.
   */
  getInvoices(): Observable<SapResponse<InvoiceItem[]>> {
    return this.http.post<SapResponse<InvoiceItem[]>>(
      `${environment.apiUrl}/financial/invoices`,
      { kunnr: this.kunnr }
    );
  }

  /**
   * POST /api/financial/invoice-details
   * Downloads invoice PDF (Base64) from SAP ZSD_INVDET_FM902065.
   *
   * Usage in component:
   *   this.sapApi.getInvoicePdf(vbeln).subscribe(res => {
   *     if (res.pdfBase64) this.downloadPdf(res.pdfBase64, res.fileName);
   *   });
   */
  getInvoicePdf(vbeln: string): Observable<InvoicePdfResponse> {
    return this.http.post<InvoicePdfResponse>(
      `${environment.apiUrl}/financial/invoice-details`,
      { vbeln }
    );
  }

  /**
   * Convert a Base64 PDF string and trigger browser download.
   * Call this inside your component after getInvoicePdf() resolves.
   *
   * @param base64  - The EV_PDF_BASE64 string from SAP
   * @param fileName - e.g. 'invoice_0090001234.pdf'
   */
  downloadPdfFromBase64(base64: string, fileName: string): void {
    const byteChars = atob(base64);
    const byteArray = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteArray[i] = byteChars.charCodeAt(i);
    }
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  getPayments(dateFrom: string, dateTo: string): Observable<SapResponse<PaymentItem[]>> {
    return this.http.post<SapResponse<PaymentItem[]>>(
      `${environment.apiUrl}/financial/payments`,
      { kunnr: this.kunnr, dateFrom, dateTo }
    );
  }

  /**
   * POST /api/financial/memo
   * Fetches credit/debit memo data from SAP ZSD_MEM_FM902065.
   */
  getMemos(dateFrom = '', dateTo = ''): Observable<SapResponse<MemoItem[]>> {
    return this.http.post<SapResponse<MemoItem[]>>(
      `${environment.apiUrl}/financial/memo`,
      { kunnr: this.kunnr, dateFrom, dateTo }
    );
  }

  /**
   * POST /api/financial/sales-summary
   * Fetches sales summary totals from SAP ZSD_SUM_902065_FM.
   *
   * @param dateFrom Optional start date YYYYMMDD
   * @param dateTo   Optional end date   YYYYMMDD
   */
  getSalesSummary(dateFrom?: string, dateTo?: string): Observable<SapResponse<SalesSummary>> {
    const body: any = { kunnr: this.kunnr };
    if (dateFrom) body.dateFrom = dateFrom;
    if (dateTo) body.dateTo = dateTo;
    return this.http.post<SapResponse<SalesSummary>>(
      `${environment.apiUrl}/financial/sales-summary`,
      body
    );
  }
}
