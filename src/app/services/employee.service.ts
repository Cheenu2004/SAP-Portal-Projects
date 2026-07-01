import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay, timeout } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiUrl = environment.apiUrl + 'EmployeeProfileSet';

  constructor(private http: HttpClient) { }

  private profileCache = new Map<string, Observable<any>>();

  getProfile(empId: string): Observable<any> {
    if (!this.profileCache.has(empId)) {
      const request = this.http.get(`${this.apiUrl}?$filter=EmpId eq '${empId}'&$format=json`).pipe(
        timeout(15000),
        map((response: any) => {
          let data: any = {};
          if (response?.d?.results && response.d.results.length > 0) {
            data = response.d.results[0];
          } else if (response?.d) {
            data = response.d;
          } else {
            data = response;
          }

          if (data) {
            // Map FullName or parts to EmployeeName
            if (!data.EmployeeName && data.FullName) {
              data.EmployeeName = data.FullName.trim();
            } else if (!data.EmployeeName && (data.FirstName || data.LastName)) {
              data.EmployeeName = `${data.FirstName || ''} ${data.LastName || ''}`.trim();
            }

            // Map EmailId to Email
            if (!data.Email && data.EmailId) {
              data.Email = data.EmailId;
            }

            // Map MobileNo to Mobile/Phone
            if (!data.Mobile && data.MobileNo) {
              data.Mobile = data.MobileNo;
            }
            if (!data.Phone && data.MobileNo) {
              data.Phone = data.MobileNo;
            }

            // Map JoinDate to JoiningDate
            if (!data.JoiningDate && data.JoinDate) {
              data.JoiningDate = data.JoinDate;
            }
          }
          return data;
        }),
        shareReplay(1)
      );
      this.profileCache.set(empId, request);
    }
    return this.profileCache.get(empId)!;
  }
}
