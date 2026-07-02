import { Component, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TrimZerosPipe } from '../../components/ui/trim-zeros.pipe';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, TrimZerosPipe],
  template: `
    <div class="layout" [class.sidebar-collapsed]="sidebarCollapsed()">
      <!-- Sidebar Overlay (mobile) -->
      @if (!sidebarCollapsed()) {
        <div class="sidebar-overlay" (click)="toggleSidebar()"></div>
      }

      <!-- Sidebar -->
      <aside class="sidebar" [class.collapsed]="sidebarCollapsed()">
        <div class="sidebar-header">
          <div class="logo">
            <div class="logo-icon-new">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            </div>
            <span class="logo-text">SAP Portal</span>
          </div>
        </div>

        <nav class="sidebar-nav">
          <div class="nav-section">
            <span class="nav-section-title">Main</span>
            <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
              Dashboard
            </a>
            <a routerLink="/profile" routerLinkActive="active" class="nav-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Profile
            </a>
          </div>

          <div class="nav-section">
            <span class="nav-section-title">Sales</span>
            <a routerLink="/inquiry" routerLinkActive="active" class="nav-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              Inquiry
            </a>
            <a routerLink="/sales-orders" routerLinkActive="active" class="nav-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              Sales Orders
            </a>
            <a routerLink="/delivery" routerLinkActive="active" class="nav-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
              Delivery
            </a>
          </div>

          <div class="nav-section">
            <span class="nav-section-title">Financials</span>
            <a routerLink="/invoices" routerLinkActive="active" class="nav-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              Invoices
            </a>
            <a routerLink="/payments" routerLinkActive="active" class="nav-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              Payments
            </a>
            <a routerLink="/memos" routerLinkActive="active" class="nav-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
              Credit/Debit Memos
            </a>
            <a routerLink="/sales-summary" routerLinkActive="active" class="nav-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              Sales Summary
            </a>
          </div>
        </nav>
      </aside>

      <!-- Main Content -->
      <main class="main-content" [class.expanded]="sidebarCollapsed()">
        <!-- Header -->
        <header class="header">
          <div class="header-left">
            <button class="sidebar-toggle" (click)="toggleSidebar()" [attr.aria-label]="sidebarCollapsed() ? 'Open sidebar' : 'Close sidebar'">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                @if (sidebarCollapsed()) {
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="3" y1="12" x2="21" y2="12"/>
                  <line x1="3" y1="18" x2="21" y2="18"/>
                } @else {
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="3" y1="12" x2="15" y2="12"/>
                  <line x1="3" y1="18" x2="18" y2="18"/>
                }
              </svg>
            </button>
            <h2>{{ pageTitle }}</h2>
          </div>
          <div class="header-right">
            <span class="customer-id">ID: {{ customerId | trimZeros }}</span>
            <a routerLink="/profile" class="header-profile-btn" title="Profile">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span class="header-profile-name">{{ customerName }}</span>
            </a>
            <button class="header-logout-btn" (click)="showLogoutModal.set(true)" title="Logout">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </header>

        <!-- Page Content -->
        <div class="page-content">
          <router-outlet></router-outlet>
        </div>
      </main>

      <!-- Logout Confirmation Modal -->
      @if (showLogoutModal()) {
        <div class="modal-overlay" (click)="showLogoutModal.set(false)">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </div>
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to logout?</p>
            <div class="modal-actions">
              <button class="modal-btn modal-btn-cancel" (click)="showLogoutModal.set(false)">Cancel</button>
              <button class="modal-btn modal-btn-confirm" (click)="confirmLogout()">Logout</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .layout {
      display: flex;
      min-height: 100vh;
    }

    /* Sidebar Overlay for mobile */
    .sidebar-overlay {
      display: none;
    }

    @media (max-width: 768px) {
      .sidebar-overlay {
        display: block;
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(15, 23, 42, 0.4);
        backdrop-filter: blur(4px);
        z-index: 19;
        animation: fadeIn 0.2s ease;
      }
    }

    .sidebar {
      width: 270px;
      background: rgba(255, 255, 255, 0.4);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-right: 1px solid var(--glass-border);
      display: flex;
      flex-direction: column;
      position: fixed;
      height: 100vh;
      overflow-y: auto;
      z-index: 20;
      box-shadow: 4px 0 24px rgba(0, 0, 0, 0.02);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease;
      transform: translateX(0);
    }

    .sidebar.collapsed {
      transform: translateX(-100%);
      box-shadow: none;
    }

    .sidebar-header {
      padding: 24px 20px;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 4px;
    }

    .logo-icon-new {
      width: 32px;
      height: 32px;
      color: var(--color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .logo-text {
      font-size: 18px;
      font-weight: 800;
      letter-spacing: -0.03em;
      background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .sidebar-nav {
      flex: 1;
      padding: 16px 16px;
    }

    .nav-section {
      margin-bottom: 28px;
    }

    .nav-section-title {
      display: block;
      font-size: 11px;
      font-weight: 700;
      color: var(--color-gray-400);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 0 12px;
      margin-bottom: 10px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      color: var(--color-gray-600);
      text-decoration: none;
      border-radius: var(--radius-sm);
      font-size: 14px;
      font-weight: 600;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      margin-bottom: 4px;

      &:hover {
        background-color: var(--color-white);
        color: var(--color-gray-900);
        box-shadow: 0 2px 4px rgba(0,0,0,0.02);

        svg {
          color: var(--color-gray-700);
          transform: translateX(2px);
        }
      }

      &.active {
        background-color: rgba(79, 70, 229, 0.08);
        color: var(--color-primary);
        border-left: 3px solid var(--color-primary);
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
        box-shadow: none;

        svg {
          color: var(--color-primary);
        }
      }

      svg {
        color: var(--color-gray-400);
        flex-shrink: 0;
        transition: all 0.2s ease;
      }
    }

    /* Main Content */
    .main-content {
      flex: 1;
      margin-left: 270px;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .main-content.expanded {
      margin-left: 0;
    }

    /* Header */
    .header {
      height: 72px;
      background: var(--glass-bg);
      backdrop-filter: var(--glass-blur);
      -webkit-backdrop-filter: var(--glass-blur);
      border-bottom: 1px solid var(--glass-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 32px;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .header-left h2 {
      font-size: 16px;
      font-weight: 600;
      color: var(--color-gray-600);
      letter-spacing: -0.01em;
      margin: 0;
    }

    /* Sidebar Toggle Button */
    .sidebar-toggle {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      border: 1px solid var(--glass-border);
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(8px);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-gray-500);
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      flex-shrink: 0;
    }

    .sidebar-toggle:hover {
      background: var(--color-white);
      color: var(--color-primary);
      border-color: rgba(99, 102, 241, 0.3);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.12);
      transform: scale(1.05);
    }

    .sidebar-toggle:active {
      transform: scale(0.95);
    }

    .sidebar-toggle svg {
      transition: transform 0.3s ease;
    }

    .accent-text {
      color: var(--color-gray-900);
      font-weight: 800;
    }

    /* Header Right Section */
    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .customer-id {
      font-size: 13px;
      font-weight: 700;
      color: var(--color-primary);
      background-color: var(--color-accent-soft);
      padding: 6px 16px;
      border-radius: var(--radius-full);
      box-shadow: inset 0 0 0 1px rgba(99, 102, 241, 0.2);
    }

    /* Profile Button in Header */
    .header-profile-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px 6px 10px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.7);
      border: 1px solid var(--glass-border);
      text-decoration: none;
      color: var(--color-gray-700);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .header-profile-btn:hover {
      background: var(--color-white);
      border-color: rgba(99, 102, 241, 0.3);
      color: var(--color-primary);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1);
    }

    .header-profile-btn svg {
      color: var(--color-primary);
      flex-shrink: 0;
    }

    .header-profile-name {
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Logout Button in Header */
    .header-logout-btn {
      width: 38px;
      height: 38px;
      border-radius: 12px;
      border: 1px solid var(--color-gray-200);
      background: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-gray-500);
      transition: all 0.2s ease;
    }

    .header-logout-btn:hover {
      background-color: #FEF2F2;
      border-color: #FECACA;
      color: #DC2626;
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.12);
    }

    .page-content {
      flex: 1;
      padding: 0;
    }

    /* Logout Modal */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.5);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fadeIn 0.2s ease;
    }

    .modal-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.6);
      border-radius: 20px;
      padding: 36px 40px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
      min-width: 340px;
      animation: slideUp 0.25s ease;
    }

    .modal-icon {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      background: linear-gradient(135deg, #fee2e2, #fecaca);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      color: #ef4444;
    }

    .modal-card h3 {
      font-size: 20px;
      font-weight: 700;
      color: var(--color-gray-800);
      margin-bottom: 8px;
    }

    .modal-card p {
      font-size: 14px;
      color: var(--color-gray-500);
      margin-bottom: 28px;
    }

    .modal-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
    }

    .modal-btn {
      padding: 10px 28px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
    }

    .modal-btn-cancel {
      background: var(--color-gray-100);
      color: var(--color-gray-600);
    }

    .modal-btn-cancel:hover {
      background: var(--color-gray-200);
    }

    .modal-btn-confirm {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
      box-shadow: 0 4px 14px rgba(239, 68, 68, 0.3);
    }

    .modal-btn-confirm:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
  `]
})
export class MainLayoutComponent {
  showLogoutModal = signal(false);
  sidebarCollapsed = signal(false);
  private currentRoute = '';

  private pageTitles: Record<string, string> = {
    '/dashboard': '',
    '/sales-summary': 'Sales Summary',
    '/profile': 'My Profile'
  };

  constructor(private authService: AuthService, private router: Router) {
    this.currentRoute = this.router.url;
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(e => this.currentRoute = e.urlAfterRedirects);
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  get customerName(): string {
    return this.authService.currentCustomer()?.NAME1 || 'Customer';
  }

  get customerId(): string {
    return this.authService.currentCustomer()?.KUNNR || '';
  }

  get pageTitle(): string {
    if (this.currentRoute === '/dashboard') {
      return `Welcome back, ${this.customerName}`;
    }
    return this.pageTitles[this.currentRoute] || '';
  }

  confirmLogout(): void {
    this.showLogoutModal.set(false);
    this.authService.logout();
  }
}
