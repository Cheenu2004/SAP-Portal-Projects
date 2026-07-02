import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { VendorProfile } from '../../core/models/api-models';
import { ToastService } from '../../shared/toast/toast.service';
import { TrimZerosPipe } from '../../shared/pipes/trim-zeros.pipe';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatListModule, TrimZerosPipe],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  profile: VendorProfile['d'] | null = null;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    const vendorId = this.authService.getVendorId();
    if (vendorId) {
      this.apiService.getProfile(vendorId).subscribe({
        next: (res) => {
          this.profile = res.d;
        },
        error: (err) => {
          this.toast.error('Failed to load profile details');
          console.error(err);
        }
      });
    }
  }
}
