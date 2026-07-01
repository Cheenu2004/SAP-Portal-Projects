import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, retry, timeout } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PayslipService {
  private apiUrl = environment.apiUrl + 'PaySlipSet';

  constructor(private http: HttpClient) { }

  getPayslips(empId: string): Observable<any[]> {
    const url = `${this.apiUrl}?$filter=EmpId eq '${empId}'&$format=json`;
    return this.http.get(url).pipe(
      timeout(15000),
      retry({ count: 1, delay: 1000 }),
      map((response: any) => {
        // SAP may ignore $filter — enforce isolation on the client using normalized EmpId
        const all = (response.d && response.d.results) ? response.d.results : (response.d || []);
        const normalizeId = (id: any) => String(id || '').replace(/^0+/, '').toLowerCase() || '0';
        const filtered = all.filter((item: any) => normalizeId(item.EmpId) === normalizeId(empId));

        // Sort by ValidFrom descending (latest first)
        return filtered.sort((a: any, b: any) => {
          const dateA = a.ValidFrom || '';
          const dateB = b.ValidFrom || '';
          return dateB.localeCompare(dateA);
        });
      })
    );
  }

  downloadPayslipPdf(empId: string, month: string, year: string): Observable<Blob> {
    const url = `${environment.apiUrl}PaySlipPdfSet(EmpId='${empId}',Month='${month}',Year='${year}')/$value`;
    return this.http.get(url, { responseType: 'blob' }).pipe(
      timeout(20000),
      retry({ count: 1, delay: 1000 })
    );
  }
}
