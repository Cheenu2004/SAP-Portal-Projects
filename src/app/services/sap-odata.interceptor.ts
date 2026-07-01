import { Injectable, Injector } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse,
  HttpErrorResponse,
  HttpClient,
  HttpHeaders
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable()
export class SapOdataInterceptor implements HttpInterceptor {
  private csrfToken: string | null = null;

  constructor(private injector: Injector) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Only handle SAP OData requests
    if (!request.url.includes('/sap/')) {
      return next.handle(request);
    }

    const authService = this.injector.get(AuthService);
    const router = this.injector.get(Router);

    // 1. Always ensure we request JSON from SAP
    let headers = request.headers
      .set('Accept', 'application/json')
      .set('X-Requested-With', 'XMLHttpRequest');

    // 2. For GET requests
    if (request.method === 'GET') {
      return next.handle(request.clone({ headers })).pipe(
        tap(event => {
          if (event instanceof HttpResponse) {
            const token = event.headers.get('x-csrf-token');
            if (token && token !== 'Required') this.csrfToken = token;
          }
        }),
        catchError((error: HttpErrorResponse) => {
          if (error.status === 401 || error.status === 403) {
            console.warn('[INTERCEPTOR] Auth failure (401/403) detected. Logging out...');
            authService.logout();
            router.navigate(['/login']);
          }
          return throwError(() => error);
        })
      );
    }

    // 3. For POST/PUT/DELETE, handle CSRF token
    if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
      const http = this.injector.get(HttpClient);
      
      const handleWithToken = (token: string) => {
        const finalHeaders = headers.set('x-csrf-token', token);
        return next.handle(request.clone({ headers: finalHeaders })).pipe(
          catchError((error: HttpErrorResponse) => {
            if (error.status === 401 || error.status === 403) {
              console.warn('[INTERCEPTOR] Auth failure (401/403) detected. Logging out...');
              authService.logout();
              router.navigate(['/login']);
            }
            return throwError(() => error);
          })
        );
      };

      if (this.csrfToken) {
        return handleWithToken(this.csrfToken);
      } else {
        // Fetch token on-demand if missing
        return http.get(environment.apiUrl, { 
          headers: new HttpHeaders({ 
            'x-csrf-token': 'fetch',
            'Accept': 'application/json' 
          }), 
          observe: 'response' 
        }).pipe(
          switchMap(response => {
            this.csrfToken = response.headers.get('x-csrf-token') || 'fetch';
            return handleWithToken(this.csrfToken);
          }),
          catchError((error: HttpErrorResponse) => {
            if (error.status === 401 || error.status === 403) {
              console.warn('[INTERCEPTOR] Auth failure (401/403) during token fetch. Logging out...');
              authService.logout();
              router.navigate(['/login']);
            }
            return throwError(() => error);
          })
        );
      }
    }

    return next.handle(request.clone({ headers }));
  }
}
