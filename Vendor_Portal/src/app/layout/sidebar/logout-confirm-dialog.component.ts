import { Component } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-logout-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="logout-dialog-container">
      <div class="dialog-icon">
        <mat-icon>exit_to_app</mat-icon>
      </div>
      <h2 mat-dialog-title>Confirm Logout</h2>
      <mat-dialog-content>
        <p>Are you sure you want to logout from the Vendor Portal?</p>
      </mat-dialog-content>
      <mat-dialog-actions>
        <button mat-stroked-button (click)="dialogRef.close(false)">Cancel</button>
        <button mat-flat-button color="warn" (click)="dialogRef.close(true)">
          <mat-icon>exit_to_app</mat-icon> Logout
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .logout-dialog-container {
      padding: 24px;
      text-align: center;
    }
    .dialog-icon {
      display: flex;
      justify-content: center;
      margin-bottom: 12px;
    }
    .dialog-icon mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #e63946;
    }
    h2 {
      font-size: 20px;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 8px;
    }
    mat-dialog-content p {
      color: #64748b;
      font-size: 14px;
      margin: 0;
    }
    mat-dialog-actions {
      display: flex;
      justify-content: center;
      gap: 12px;
      padding-top: 24px;
    }
  `]
})
export class LogoutConfirmDialogComponent {
  constructor(public dialogRef: MatDialogRef<LogoutConfirmDialogComponent>) {}
}
