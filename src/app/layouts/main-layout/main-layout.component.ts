import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, Subscription } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EmployeeService } from '../../services/employee.service';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
  standalone: false
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private breakpointObserver = inject(BreakpointObserver);
  private authService = inject(AuthService);
  private employeeService = inject(EmployeeService);
  private router = inject(Router);

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  showLogoutModal = false;

  empId: string | null = null;
  employeeName: string = '';
  private authSub!: Subscription;

  get displayEmpId(): string {
    return String(this.empId || '').replace(/^0+/, '') || String(this.empId || '');
  }

  ngOnInit() {
    this.authSub = this.authService.currentEmpId$.subscribe({
      next: (id) => {
        this.empId = id;
        if (id) {
          this.employeeService.getProfile(id).subscribe({
            next: (profile) => {
              if (profile && profile.EmployeeName) {
                this.employeeName = profile.EmployeeName;
              } else {
                this.employeeName = '';
              }
            },
            error: () => {
              this.employeeName = '';
            }
          });
        } else {
          this.employeeName = '';
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.authSub) {
      this.authSub.unsubscribe();
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  confirmLogout() {
    this.showLogoutModal = true;
  }

  cancelLogout() {
    this.showLogoutModal = false;
  }

  executeLogout() {
    this.showLogoutModal = false;
    this.logout();
  }
}
