import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ButtonComponent } from '../../components/ui/button.component';
import { InputComponent } from '../../components/ui/input.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, InputComponent],
  template: `
    <div class="login-page">
      <div class="ambient-background">
        <div class="blob blob-1"></div>
        <div class="blob blob-2"></div>
        <div class="blob blob-3"></div>
      </div>

      <div class="login-container">
        <div class="login-card">
          <div class="login-header">
            <div class="logo-circle">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            </div>
            <h2>{{ isForgotMode() ? 'Reset Password' : 'Welcome Back' }}</h2>
            <p>{{ isForgotMode() ? 'Enter your customer ID and set a new password.' : 'Sign in to access your SAP Customer Portal.' }}</p>
          </div>

          @if (error()) {
            <div class="alert alert-error">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>{{ error() }}</span>
            </div>
          }

          @if (success()) {
            <div class="alert alert-success">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <span>{{ success() }}</span>
            </div>
          }

          <form (ngSubmit)="onSubmit()" class="login-form">
            <div class="form-group">
              <label for="customerId">Customer ID</label>
              <input
                id="customerId"
                type="text"
                [(ngModel)]="customerId"
                name="customerId"
                class="form-input custom-input"
                placeholder="Enter your customer ID"
                required
                [disabled]="isLoading()"
              />
            </div>

            @if (!isForgotMode()) {
              <div class="form-group">
                <label for="password">Password</label>
                <div class="input-wrapper">
                  <input
                    [type]="showPassword ? 'text' : 'password'"
                    id="password"
                    [(ngModel)]="password"
                    name="password"
                    class="form-input custom-input pr-10"
                    placeholder="Enter your password"
                    required
                    [disabled]="isLoading()"
                  />
                  <button
                    type="button"
                    class="toggle-password"
                    (click)="showPassword = !showPassword"
                    [attr.aria-label]="showPassword ? 'Hide password' : 'Show password'"
                  >
                    @if (showPassword) {
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    } @else {
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>
            } @else {
              <div class="form-group">
                <label for="newPassword">New Password</label>
                <input
                  [type]="showNewPassword ? 'text' : 'password'"
                  id="newPassword"
                  [(ngModel)]="newPassword"
                  name="newPassword"
                  class="form-input custom-input"
                  placeholder="Enter new password"
                  required
                  [disabled]="isLoading()"
                />
              </div>

              <div class="form-group">
                <label for="confirmPassword">Confirm Password</label>
                <input
                  [type]="showNewPassword ? 'text' : 'password'"
                  id="confirmPassword"
                  [(ngModel)]="confirmPassword"
                  name="confirmPassword"
                  class="form-input custom-input"
                  placeholder="Confirm new password"
                  required
                  [disabled]="isLoading()"
                />
              </div>

              <label class="show-reset">
                <input type="checkbox" [(ngModel)]="showNewPassword" name="showNewPassword" [disabled]="isLoading()" />
                <span>Show passwords</span>
              </label>
            }

            <button
              type="submit"
              class="btn btn-primary login-btn"
              [disabled]="!canSubmit() || isLoading()"
            >
              @if (isLoading()) {
                <span class="spinner"></span>
              } @else {
                {{ isForgotMode() ? 'Update Password' : 'Sign In' }}
              }
            </button>
          </form>

          <div class="login-footer">
            <button type="button" class="switch-mode-btn" (click)="toggleMode()" [disabled]="isLoading()">
              {{ isForgotMode() ? 'Back to sign in' : 'Forgot your password?' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      background-color: var(--color-gray-50);
      overflow: hidden;
      padding: 24px;
    }

    .ambient-background {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      z-index: 0;
    }

    .blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.6;
      animation: float 20s ease-in-out infinite;
    }

    .blob-1 {
      top: -10%;
      right: -5%;
      width: 600px;
      height: 600px;
      background: rgba(99, 102, 241, 0.25);
      animation-delay: 0s;
    }

    .blob-2 {
      bottom: -20%;
      left: -10%;
      width: 800px;
      height: 800px;
      background: rgba(167, 139, 250, 0.2);
      animation-delay: -5s;
    }

    .blob-3 {
      top: 40%;
      right: 20%;
      width: 500px;
      height: 500px;
      background: rgba(244, 63, 94, 0.15);
      animation-delay: -10s;
    }

    @keyframes float {
      0% { transform: translate(0, 0) scale(1); }
      33% { transform: translate(30px, -50px) scale(1.1); }
      66% { transform: translate(-20px, 20px) scale(0.9); }
      100% { transform: translate(0, 0) scale(1); }
    }

    .login-container {
      width: 100%;
      max-width: 440px;
      position: relative;
      z-index: 1;
    }

    .login-card {
      background: var(--glass-bg);
      backdrop-filter: var(--glass-blur);
      -webkit-backdrop-filter: var(--glass-blur);
      border-radius: 24px;
      padding: 48px 40px;
      border: 1px solid var(--glass-border);
      box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.3);
      animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .login-header {
      text-align: center;
      margin-bottom: 36px;
    }

    .logo-circle {
      width: 56px;
      height: 56px;
      margin: 0 auto 20px;
      background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      box-shadow: 0 10px 20px rgba(99, 102, 241, 0.3);
      transform: rotate(-5deg);
    }

    .login-header h2 {
      font-size: 26px;
      font-weight: 800;
      color: var(--color-gray-900);
      margin-bottom: 8px;
      letter-spacing: -0.02em;
    }

    .login-header p {
      color: var(--color-gray-500);
      font-size: 15px;
      line-height: 1.5;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .custom-input {
      background-color: rgba(255, 255, 255, 0.8);
      border: 1px solid var(--color-gray-200);
      height: 48px;
      border-radius: 12px;
      font-size: 15px;
      padding: 0 16px;
      transition: all 0.2s ease;

      &:focus {
        background-color: #fff;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
      }
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-wrapper .custom-input.pr-10 {
      padding-right: 48px;
    }

    .toggle-password {
      position: absolute;
      right: 8px;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      color: var(--color-gray-400);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: var(--color-gray-100);
        color: var(--color-gray-700);
      }
    }

    .show-reset {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      color: var(--color-gray-600);
      cursor: pointer;
      user-select: none;
      
      input[type="checkbox"] {
        width: 16px;
        height: 16px;
        border-radius: 4px;
        accent-color: var(--color-primary);
      }
    }

    .login-btn {
      height: 48px;
      font-size: 16px;
      border-radius: 12px;
      margin-top: 8px;
      width: 100%;
    }

    .login-footer {
      margin-top: 32px;
      text-align: center;
    }

    .switch-mode-btn {
      background: transparent;
      border: none;
      color: var(--color-gray-500);
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: color 0.2s ease;

      &:hover {
        color: var(--color-primary);
      }
    }

    @media (max-width: 480px) {
      .login-card {
        padding: 32px 24px;
        border-radius: 20px;
      }
    }
  `]
})
export class LoginComponent {
  customerId = '';
  password = '';
  newPassword = '';
  confirmPassword = '';
  showPassword = false;
  showNewPassword = false;
  isForgotMode = signal(false);
  isLoading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  canSubmit(): boolean {
    if (this.isLoading() || !this.customerId) return false;
    return this.isForgotMode()
      ? !!this.newPassword && !!this.confirmPassword
      : !!this.password;
  }

  toggleMode(): void {
    this.isForgotMode.update(value => !value);
    this.error.set(null);
    this.success.set(null);
    this.password = '';
    this.newPassword = '';
    this.confirmPassword = '';
  }

  onSubmit(): void {
    if (!this.canSubmit()) return;

    this.isLoading.set(true);
    this.error.set(null);
    this.success.set(null);

    if (this.isForgotMode()) {
      this.resetPassword();
      return;
    }

    this.authService.login(this.customerId, this.password).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.set(err.error?.message || 'Login failed. Please check your credentials.');
      }
    });
  }

  private resetPassword(): void {
    if (this.newPassword !== this.confirmPassword) {
      this.isLoading.set(false);
      this.error.set('New password and confirm password must match.');
      return;
    }

    this.authService.forgotPassword(this.customerId, this.newPassword, this.confirmPassword).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.success.set('Password updated.');
        this.isForgotMode.set(false);
        this.password = '';
        this.newPassword = '';
        this.confirmPassword = '';
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.set(err.error?.message || 'Password reset failed. Please try again.');
      }
    });
  }
}
