import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { retry, delay } from 'rxjs/operators';
import { LoginResponse, VendorProfile, DashboardResponse, RFQ, PurchaseOrder, Delivery, InvoiceHeader, Memo, ODataResponse, InvoiceDetail } from '../models/api-models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  login(Lifnr: string, Password: string): Observable<LoginResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    const paddedLifnr = Lifnr.padStart(10, '0');
    return this.http.post<LoginResponse>(`${this.apiUrl}/LoginSet`, { Lifnr: paddedLifnr, Password }, { headers });
  }

  forgotPassword(Lifnr: string, Newpassword: string, Confirmpassword: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    const paddedLifnr = Lifnr.padStart(10, '0');
    return this.http.post<any>(`${this.apiUrl}/LoginSet`, { Lifnr: paddedLifnr, Newpassword, Confirmpassword }, { headers });
  }

  getProfile(vendorId: string): Observable<VendorProfile> {
    return this.http.get<VendorProfile>(`${this.apiUrl}/VendorProfileSet(WfVendorId='${vendorId}')?$format=json`).pipe(
      retry({ count: 2, delay: 1000 })
    );
  }

  getDashboard(vendorId: string): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(`${this.apiUrl}/DashboardSet('${vendorId}')?$format=json`).pipe(
      retry({ count: 2, delay: 1000 })
    );
  }

  getRFQs(vendorId: string): Observable<ODataResponse<RFQ>> {
    return this.http.get<ODataResponse<RFQ>>(`${this.apiUrl}/RFQSet?$filter=WfVendorId eq '${vendorId}'&$format=json`).pipe(
      retry({ count: 2, delay: 1000 })
    );
  }

  getPurchaseOrders(vendorId: string): Observable<ODataResponse<PurchaseOrder>> {
    return this.http.get<ODataResponse<PurchaseOrder>>(`${this.apiUrl}/PurchaseOrder001Set?$filter=WfVendorId eq '${vendorId}'&$format=json`).pipe(
      retry({ count: 2, delay: 1000 })
    );
  }

  getDeliveries(vendorId: string): Observable<ODataResponse<Delivery>> {
    return this.http.get<ODataResponse<Delivery>>(`${this.apiUrl}/DeliverySet?$filter=WfVendorId eq '${vendorId}'&$format=json`).pipe(
      retry({ count: 2, delay: 1000 })
    );
  }

  getInvoiceHeaders(vendorId: string): Observable<ODataResponse<InvoiceHeader>> {
    return this.http.get<ODataResponse<InvoiceHeader>>(`${this.apiUrl}/InvoiceHeaderSet?$filter=WfVendorId eq '${vendorId}'&$format=json`).pipe(
      retry({ count: 2, delay: 1000 })
    );
  }

  getInvoiceDetails(invDoc: string, fiscYear: string): Observable<ODataResponse<InvoiceDetail>> {
    return this.http.get<ODataResponse<InvoiceDetail>>(`${this.apiUrl}/InvoiceDetailSet?$filter=WfInvDoc eq '${invDoc}' and WfFiscYear eq '${fiscYear}'&$format=json`).pipe(
      retry({ count: 2, delay: 1000 })
    );
  }

  getInvoicePdf(invDoc: string, fiscYear: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/InvoicePdfSet(WfInvDoc='${invDoc}',WfFiscYear='${fiscYear}')/$value`, {
      responseType: 'blob'
    }).pipe(
      retry({ count: 2, delay: 1000 })
    );
  }

  getPayments(vendorId: string): Observable<ODataResponse<any>> {
    return this.http.get<ODataResponse<any>>(`${this.apiUrl}/PaymentSet?$filter=WfVendorId eq '${vendorId}'&$format=json`).pipe(
      retry({ count: 2, delay: 1000 })
    );
  }

  getMemos(vendorId: string): Observable<ODataResponse<Memo>> {
    return this.http.get<ODataResponse<Memo>>(`${this.apiUrl}/MemoSet?$filter=WfVendorId eq '${vendorId}'&$format=json`).pipe(
      retry({ count: 2, delay: 1000 })
    );
  }
}
