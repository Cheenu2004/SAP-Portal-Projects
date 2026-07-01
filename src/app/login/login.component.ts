import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../environments/environment';
import { timeout } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  standalone: false
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  hidePassword = true;

  // Forgot password modal state
  showForgotModal = false;
  forgotEmpId = '';
  forgotNewPassword = '';
  forgotConfirmPassword = '';
  forgotHideNewPassword = true;
  forgotHideConfirmPassword = true;
  forgotIsSubmitting = false;
  forgotErrorMessage = '';

  constructor() {
    this.loginForm = this.fb.group({
      empId: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
    
    // If already logged in, redirect to dashboard
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';
    const { empId, password } = this.loginForm.value;

    this.authService.login(empId.trim(), password).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response && response.d && response.d.Status === 'SUCCESS') {
          this.router.navigate(['/dashboard']);
        } else {
          this.loginForm.reset();
          this.showLoginError(response?.d?.Message || 'Invalid credentials', 4000);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.loginForm.reset();
        const message = error?.name === 'TimeoutError'
          ? 'Login timed out. Please check your credentials or SAP connectivity.'
          : 'Connection failed. Please check SAP backend connectivity.';
        this.showLoginError(message, 5000);
        console.error('Login error:', error);
      }
    });
  }

  private showLoginError(message: string, duration: number) {
    setTimeout(() => {
      this.errorMessage = message;
      this.snackBar.open(message, 'Close', { duration });
    });
  }

  // --- Forgot Password ---

  openForgotModal() {
    this.showForgotModal = true;
    this.forgotEmpId = '';
    this.forgotNewPassword = '';
    this.forgotConfirmPassword = '';
    this.forgotHideNewPassword = true;
    this.forgotHideConfirmPassword = true;
    this.forgotErrorMessage = '';
    this.forgotIsSubmitting = false;
  }

  closeForgotModal() {
    this.showForgotModal = false;
  }

  get forgotFormValid(): boolean {
    return (
      !!this.forgotEmpId.trim() &&
      !!this.forgotNewPassword &&
      !!this.forgotConfirmPassword &&
      this.forgotNewPassword === this.forgotConfirmPassword
    );
  }

  get passwordsMismatch(): boolean {
    return (
      !!this.forgotConfirmPassword &&
      !!this.forgotNewPassword &&
      this.forgotNewPassword !== this.forgotConfirmPassword
    );
  }

  submitForgotPassword() {
    // Clear previous error
    this.forgotErrorMessage = '';

    if (!this.forgotEmpId.trim()) {
      this.forgotErrorMessage = 'Employee ID is required.';
      return;
    }
    if (!this.forgotNewPassword) {
      this.forgotErrorMessage = 'New Password is required.';
      return;
    }
    if (!this.forgotConfirmPassword) {
      this.forgotErrorMessage = 'Please confirm your new password.';
      return;
    }
    if (this.forgotNewPassword !== this.forgotConfirmPassword) {
      this.forgotErrorMessage = 'Passwords do not match.';
      return;
    }

    this.forgotIsSubmitting = true;

    const apiUrl = environment.apiUrl + 'LoginSet';
    const body = {
      EmpId: this.forgotEmpId.trim(),
      Password: this.forgotNewPassword,
      Action: 'FORGOT'
    };
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    });

    this.http.post(apiUrl, body, { headers }).pipe(
      timeout(12000)
    ).subscribe({
      next: (response: any) => {
        console.log('Forgot password SAP response:', JSON.stringify(response));
        this.forgotIsSubmitting = false;
        // Treat any 2xx HTTP response as success; SAP may return different status strings
        const status = response?.d?.Status?.toUpperCase?.() || '';
        if (status === 'FAILED' || status === 'ERROR') {
          // Explicit failure from SAP
          this.forgotEmpId = '';
          this.forgotNewPassword = '';
          this.forgotConfirmPassword = '';
          this.forgotErrorMessage = response?.d?.Message || 'Failed to update password. Please check your Employee ID.';
        } else {
          // Success — any non-error response means the password was updated
          this.showForgotModal = false;
          this.snackBar.open('Password Updated Successfully', 'Close', { duration: 4000 });
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.forgotIsSubmitting = false;
        // Wipe fields on failure
        this.forgotEmpId = '';
        this.forgotNewPassword = '';
        this.forgotConfirmPassword = '';
        const message = error?.name === 'TimeoutError'
          ? 'Request timed out. Please try again.'
          : 'Connection failed. Please check SAP backend connectivity.';
        this.forgotErrorMessage = message;
        this.cdr.detectChanges();
        console.error('Forgot password error:', error);
      }
    });
  }
}
