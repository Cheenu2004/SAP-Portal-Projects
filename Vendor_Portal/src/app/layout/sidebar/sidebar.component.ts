import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/services/auth.service';
import { LogoutConfirmDialogComponent } from './logout-confirm-dialog.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatListModule, MatDialogModule, MatButtonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  isCollapsed = false;

  navItems = [
    { label: 'Dashboard', route: '/dashboard', icon: 'dashboard' },
    { label: 'Profile', route: '/profile', icon: 'person' },
    { label: 'RFQs', route: '/rfqs', icon: 'request_quote' },
    { label: 'Purchase Orders', route: '/purchase-orders', icon: 'shopping_cart' },
    { label: 'Deliveries / GR', route: '/deliveries', icon: 'local_shipping' },
    { label: 'Invoices', route: '/invoices', icon: 'receipt' },
    { label: 'Payments & Aging', route: '/payments', icon: 'account_balance_wallet' },
    { label: 'Credit/Debit Memos', route: '/memos', icon: 'note_alt' }
  ];

  constructor(private authService: AuthService, private dialog: MatDialog) {}

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  openLogoutDialog() {
    const dialogRef = this.dialog.open(LogoutConfirmDialogComponent, {
      width: '360px',
      panelClass: 'logout-dialog'
    });
    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.authService.logout();
      }
    });
  }
}
