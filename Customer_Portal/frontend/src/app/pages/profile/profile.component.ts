import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SapApiService, CustomerProfile } from '../../services/sap-api.service';
import { CardComponent } from '../../components/ui/card.component';
import { BadgeComponent } from '../../components/ui/badge.component';
import { TrimZerosPipe } from '../../components/ui/trim-zeros.pipe';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, CardComponent, BadgeComponent, TrimZerosPipe],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Customer Profile</h1>
        <p>Your account information from SAP</p>
      </div>

      @if (isLoading()) {
        <div class="loading-container">
          <span class="spinner"></span>
          <span>Loading profile...</span>
        </div>
      } @else if (error()) {
        <div class="alert alert-error">
          {{ error() }}
        </div>
      } @else if (profile()) {
        <div class="profile-layout-grid">
          <!-- Hero Card -->
          <div class="profile-left-column">
            <app-ui-card class="profile-hero-card">
              <div class="profile-banner"></div>
              <div class="profile-hero-content">
                <div class="profile-avatar-wrap">
                  <div class="profile-avatar">
                    {{ getInitials(profile()!.NAME1) }}
                  </div>
                </div>
                <div class="profile-hero-info">
                  <h2>{{ profile()!.NAME1 }}</h2>
                  <div class="profile-badge-row">
                    <span class="profile-id-badge">ID: {{ profile()!.KUNNR | trimZeros }}</span>
                    @if (profile()!.LAND1) {
                      <span class="profile-country-badge">{{ profile()!.LAND1 }}</span>
                    }
                  </div>
                </div>
              </div>
            </app-ui-card>
          </div>

          <!-- Details Columns -->
          <div class="profile-right-column">
            @if (profile()!.SMTP_ADDR || profile()!.TELF1 || profile()!.ADRNR) {
              <app-ui-card title="Contact Information" class="profile-details-card">
                <div class="details-list">
                  @if (profile()!.SMTP_ADDR) {
                    <div class="detail-item-new">
                      <div class="item-icon-wrapper">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      </div>
                      <div class="detail-content">
                        <span class="detail-label">Email Address</span>
                        <span class="detail-value">{{ profile()!.SMTP_ADDR }}</span>
                      </div>
                    </div>
                  }
                  @if (profile()!.TELF1) {
                    <div class="detail-item-new">
                      <div class="item-icon-wrapper">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      </div>
                      <div class="detail-content">
                        <span class="detail-label">Phone Number</span>
                        <span class="detail-value">{{ profile()!.TELF1 }}</span>
                      </div>
                    </div>
                  }
                  @if (profile()!.ADRNR) {
                    <div class="detail-item-new">
                      <div class="item-icon-wrapper">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 3a8 8 0 0 1 8 7.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>
                      </div>
                      <div class="detail-content">
                        <span class="detail-label">Address Reference</span>
                        <span class="detail-value">{{ profile()!.ADRNR }}</span>
                      </div>
                    </div>
                  }
                </div>
              </app-ui-card>
            }

            @if (profile()!.STRAS || profile()!.ORT01 || profile()!.PSTLZ || profile()!.REGIO || profile()!.LAND1) {
              <app-ui-card title="Address Details" class="profile-details-card">
                <div class="details-list">
                  @if (profile()!.STRAS) {
                    <div class="detail-item-new">
                      <div class="item-icon-wrapper">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                      </div>
                      <div class="detail-content">
                        <span class="detail-label">Street Address</span>
                        <span class="detail-value">{{ profile()!.STRAS }}</span>
                      </div>
                    </div>
                  }
                  @if (profile()!.ORT01) {
                    <div class="detail-item-new">
                      <div class="item-icon-wrapper">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>
                      </div>
                      <div class="detail-content">
                        <span class="detail-label">City</span>
                        <span class="detail-value">{{ profile()!.ORT01 }}</span>
                      </div>
                    </div>
                  }
                  @if (profile()!.REGIO || profile()!.PSTLZ) {
                    <div class="detail-item-new">
                      <div class="item-icon-wrapper">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      </div>
                      <div class="detail-content">
                        <span class="detail-label">Region / Postal Code</span>
                        <span class="detail-value">
                          {{ profile()!.REGIO || 'N/A' }} {{ profile()!.PSTLZ ? '(' + profile()!.PSTLZ + ')' : '' }}
                        </span>
                      </div>
                    </div>
                  }
                </div>
              </app-ui-card>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .profile-layout-grid {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 32px;
      align-items: start;
    }

    @media (max-width: 1024px) {
      .profile-layout-grid {
        grid-template-columns: 1fr;
      }
    }

    .profile-hero-card {
      padding: 0 !important;
      overflow: hidden;
      border: 1px solid var(--glass-border) !important;
      background: rgba(255, 255, 255, 0.4) !important;
      backdrop-filter: blur(16px);
      border-radius: 24px !important;
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.04) !important;
    }

    .profile-hero-card ::ng-deep .card-content {
      padding: 0 !important;
      margin-top: 0 !important;
    }

    .profile-banner {
      height: 140px;
      background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
      position: relative;
    }

    .profile-hero-content {
      padding: 0 32px 32px;
      position: relative;
      text-align: center;
      margin-top: -55px;
    }

    .profile-avatar-wrap {
      display: inline-block;
      border-radius: 50%;
      background: var(--color-white);
      padding: 6px;
      box-shadow: var(--shadow-lg);
      margin-bottom: 16px;
    }

    .profile-avatar {
      width: 100px;
      height: 100px;
      background: linear-gradient(135deg, #4338CA, #6366F1);
      color: var(--color-white);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      font-weight: 800;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
    }

    .profile-hero-info h2 {
      font-size: 22px;
      font-weight: 800;
      color: var(--color-gray-900);
      margin-bottom: 12px;
      letter-spacing: -0.02em;
    }

    .profile-badge-row {
      display: flex;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .profile-id-badge {
      font-size: 13px;
      font-weight: 700;
      color: var(--color-primary);
      background-color: var(--color-accent-soft);
      padding: 6px 16px;
      border-radius: var(--radius-full);
    }

    .profile-country-badge {
      font-size: 13px;
      font-weight: 700;
      color: #047857;
      background-color: var(--color-success-soft);
      padding: 6px 16px;
      border-radius: var(--radius-full);
    }

    .profile-right-column {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .profile-details-card {
      border: 1px solid var(--glass-border) !important;
      background: rgba(255, 255, 255, 0.45) !important;
      backdrop-filter: blur(16px);
      border-radius: 20px !important;
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.04) !important;
    }

    .details-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .detail-item-new {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 16px;
      background-color: rgba(255, 255, 255, 0.5);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      transition: all 0.2s ease;
    }

    .detail-item-new:hover {
      background-color: rgba(255, 255, 255, 0.9);
      transform: translateX(4px);
      box-shadow: var(--shadow-sm);
    }

    .item-icon-wrapper {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background-color: var(--color-accent-soft);
      color: var(--color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .detail-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .detail-label {
      font-size: 11px;
      font-weight: 700;
      color: var(--color-gray-400);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .detail-value {
      font-size: 15px;
      font-weight: 600;
      color: var(--color-gray-800);
    }
  `]
})
export class ProfileComponent implements OnInit {
  profile = signal<CustomerProfile | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

  constructor(private sapApi: SapApiService) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.sapApi.getProfile().subscribe({
      next: (response) => {
        this.profile.set(response.data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load profile');
        this.isLoading.set(false);
      }
    });
  }

  getInitials(name: string): string {
    if (!name) return 'C';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }
}
