import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '@environments/environment';

export interface LoginRequest {
  customerId: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  customer: {
    KUNNR: string;
    NAME1: string;
    ORT01: string;
    PSTLZ: string;
    STRAS: string;
    LAND1: string;
    REGIO: string;
    TELF1: string;
    ADRNR: string;
    SMTP_ADDR: string;
  };
}

export interface ForgotPasswordResponse {
  success: boolean;
  status?: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'sap_auth_token';
  private readonly CUSTOMER_KEY = 'sap_customer';

  isAuthenticated = signal<boolean>(this.hasToken());
  currentCustomer = signal<LoginResponse['customer'] | null>(this.getStoredCustomer());

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(customerId: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, { customerId, password }).pipe(
      tap(response => {
        if (response.success && response.token) {
          sessionStorage.setItem(this.TOKEN_KEY, response.token);
          sessionStorage.setItem(this.CUSTOMER_KEY, JSON.stringify(response.customer));
          this.isAuthenticated.set(true);
          this.currentCustomer.set(response.customer);
        }
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  forgotPassword(customerId: string, newPassword: string, confirmPassword: string): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(`${environment.apiUrl}/auth/forgot-password`, {
      customerId,
      newPassword,
      confirmPassword
    }).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.CUSTOMER_KEY);
    this.isAuthenticated.set(false);
    this.currentCustomer.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  private hasToken(): boolean {
    return !!sessionStorage.getItem(this.TOKEN_KEY);
  }

  private getStoredCustomer(): LoginResponse['customer'] | null {
    const stored = sessionStorage.getItem(this.CUSTOMER_KEY);
    return stored ? JSON.parse(stored) : null;
  }
}
