import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatInputModule, MatButtonModule, MatIconModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  vendorId = '';
  password = '';
  hidePassword = true;

  isForgotPassword = false;
  newPassword = '';
  confirmPassword = '';
  hideNewPassword = true;
  hideConfirmPassword = true;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router,
    private toast: ToastService
  ) {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  toggleForgotPassword() {
    this.isForgotPassword = !this.isForgotPassword;
    this.password = '';
    this.newPassword = '';
    this.confirmPassword = '';
  }

  onLogin() {
    if (!this.vendorId || !this.password) {
      this.toast.error('Please enter Vendor ID and Password');
      return;
    }

    this.apiService.login(this.vendorId, this.password).subscribe({
      next: (res) => {
        if (res && res.d && res.d.Lifnr) {
          this.toast.success('Login Successful');
          this.authService.setVendorId(res.d.Lifnr);
          this.router.navigate(['/dashboard']);
        } else {
          this.toast.error('Invalid credentials');
        }
      },
      error: (err) => {
        this.toast.error('Login Failed. Please try again.');
        console.error('Login error', err);
      }
    });
  }

  onForgotPassword() {
    if (!this.vendorId || !this.newPassword || !this.confirmPassword) {
      this.toast.error('Please fill all fields');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.toast.error('Passwords do not match');
      return;
    }

    this.apiService.forgotPassword(this.vendorId, this.newPassword, this.confirmPassword).subscribe({
      next: (res) => {
        if (res && res.d && res.d.Lifnr) {
          this.toast.success('Password reset successful');
          this.toggleForgotPassword();
        } else {
          this.toast.error('Password reset failed');
        }
      },
      error: (err) => {
        this.toast.error('Password reset failed. Please try again.');
        console.error('Forgot password error', err);
      }
    });
  }
}
