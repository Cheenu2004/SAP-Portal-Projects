import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PayslipEmailRequest {
  empId: string;
  month: string;
  year: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  private apiUrl = '/api/payslip/email';

  constructor(private http: HttpClient) {}

  /**
   * Send payslip PDF to the provided email address.
   * @param payload The request payload containing employee, period and target email.
   */
  sendPayslipEmail(payload: PayslipEmailRequest): Observable<any> {
    return this.http.post<any>(this.apiUrl, payload);
  }
}
