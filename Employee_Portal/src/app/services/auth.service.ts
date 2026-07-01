import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, timeout } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl + 'LoginSet';

  private empIdSubject = new BehaviorSubject<string | null>(sessionStorage.getItem('EmpId'));
  currentEmpId$ = this.empIdSubject.asObservable();

  constructor(private http: HttpClient) {
    localStorage.removeItem('EmpId');
  }

  login(EmpId: string, Password: string): Observable<any> {
    const body = { EmpId, Password };
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    });

    return this.http.post(this.apiUrl, body, { headers }).pipe(
      timeout(12000),
      tap((loginResponse: any) => {
        if (loginResponse?.d?.Status === 'SUCCESS') {
          const loginEmpId = loginResponse.d.EmpId || EmpId;
          sessionStorage.setItem('EmpId', loginEmpId);
          this.empIdSubject.next(loginEmpId);
        }
      })
    );
  }

  logout() {
    sessionStorage.removeItem('EmpId');
    this.empIdSubject.next(null);
  }

  isLoggedIn(): boolean {
    const empId = sessionStorage.getItem('EmpId');
    return !!empId && empId !== 'null' && empId !== 'undefined' && empId.trim() !== '';
  }

  getEmpId(): string | null {
    return sessionStorage.getItem('EmpId');
  }
}
