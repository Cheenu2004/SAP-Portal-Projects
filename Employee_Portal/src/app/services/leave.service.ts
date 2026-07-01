import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, timeout } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LeaveService {
  private apiUrl = environment.apiUrl + 'LeaveDataSet';

  constructor(private http: HttpClient) { }

  getLeaveData(empId: string): Observable<any[]> {
    const url = `${this.apiUrl}?$filter=EmpId eq '${empId}'&$format=json`;
    return this.http.get(url).pipe(
      timeout(8000),
      map((response: any) => {
        // SAP ignores $filter — enforce isolation on the client using normalized EmpId
        const all = (response.d && response.d.results) ? response.d.results : (response.d || []);
        const normalizeId = (id: any) => String(id || '').replace(/^0+/, '').toLowerCase() || '0';
        const filtered = all.filter((item: any) => normalizeId(item.EmpId) === normalizeId(empId));
        return filtered.map((item: any) => {
          const balanceCL = parseFloat(item.BalanceCL) || 0;
          const balanceSL = parseFloat(item.BalanceSL) || 0;
          const balancePL = parseFloat(item.BalancePL) || 0;
          return {
            ...item,
            TotalLeave: item.TotalDays !== undefined ? item.TotalDays : (item.TotalLeave || 0),
            RemainingLeave: (item.RemainingLeave !== undefined && item.RemainingLeave !== null && String(item.RemainingLeave).trim() !== '')
              ? item.RemainingLeave 
              : String(balanceCL + balanceSL + balancePL)
          };
        });
      })
    );
  }
}
