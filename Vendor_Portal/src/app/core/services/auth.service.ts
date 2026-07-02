import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly VENDOR_KEY = 'WfVendorId';

  constructor(private router: Router) {}

  setVendorId(vendorId: string): void {
    sessionStorage.setItem(this.VENDOR_KEY, vendorId);
  }

  getVendorId(): string | null {
    return sessionStorage.getItem(this.VENDOR_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getVendorId();
  }

  logout(): void {
    sessionStorage.removeItem(this.VENDOR_KEY);
    this.router.navigate(['/login']);
  }
}
