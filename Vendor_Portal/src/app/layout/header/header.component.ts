import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { LogoutConfirmDialogComponent } from '../sidebar/logout-confirm-dialog.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule, MatDialogModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  vendorId: string | null = '';

  constructor(private authService: AuthService, private router: Router, private dialog: MatDialog) {
    this.vendorId = this.authService.getVendorId();
  }

  logout() {
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
