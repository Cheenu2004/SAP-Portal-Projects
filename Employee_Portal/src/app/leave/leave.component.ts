import { ChangeDetectorRef, Component, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { LeaveService } from '../services/leave.service';
import { AuthService } from '../services/auth.service';
import { finalize, Subscription, take } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-leave',
  templateUrl: './leave.component.html',
  styleUrl: './leave.component.css',
  standalone: false
})
export class LeaveComponent implements OnInit, OnDestroy {
  private leaveService = inject(LeaveService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);

  displayedColumns: string[] = ['LeaveType', 'FromDate', 'ToDate', 'TotalDays', 'LeaveStatus'];
  dataSource = new MatTableDataSource<any>([]);
  leaveData: any[] = [];
  isLoading = true;
  hasError = false;
  filterText = '';
  loadedOnce = false;
  private currentEmpId = '';
  private authSub!: Subscription;
  private loadingFallbackTimer: ReturnType<typeof setTimeout> | null = null;


  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
    this.authSub = this.authService.currentEmpId$.subscribe({
      next: (id) => {
        if (id) {
          this.currentEmpId = id;
          this.loadLeaveData(id);
        } else {
          this.currentEmpId = '';
          this.leaveData = [];
          this.dataSource.data = [];
          this.isLoading = false;
          this.loadedOnce = true;
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.authSub) {
      this.authSub.unsubscribe();
    }
    this.clearLoadingFallback();
  }

  loadLeaveData(empId: string) {
    this.isLoading = true;
    this.hasError = false;
    this.loadedOnce = false;
    this.clearLoadingFallback();
    this.loadingFallbackTimer = setTimeout(() => {
      if (this.isLoading) {
        this.isLoading = false;
        this.hasError = true;
        this.loadedOnce = true;
        this.snackBar.open('Leave data is taking too long to respond from SAP. Please retry.', 'Close', { duration: 5000 });
        this.cdr.detectChanges();
      }
    }, 12000);

    this.leaveService.getLeaveData(empId).pipe(
      take(1),
      finalize(() => {
        this.clearLoadingFallback();
        this.isLoading = false;
        this.loadedOnce = true;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (data) => {
        this.leaveData = (data || []).map((row: any) => ({
          ...row,
          TotalDays: this.calculateDays(row.FromDate, row.ToDate, row.TotalDays)
        }));
        this.dataSource.data = this.leaveData;
        
        let clTaken = 0;
        let slTaken = 0;
        let plTaken = 0;

        this.leaveData.forEach((row: any) => {
          if (String(row.LeaveStatus).toUpperCase() === 'APPROVED') {
            const days = parseFloat(row.TotalDays) || 0;
            const desc = String(row.LeaveDesc || '').toLowerCase();
            const type = String(row.LeaveType || '').trim();
            
            if (type === '0100' || desc.includes('casual')) {
              clTaken += days;
            } else if (type === '0200' || desc.includes('sick')) {
              slTaken += days;
            } else if (type === '0300' || desc.includes('privilege') || desc.includes('earned')) {
              plTaken += days;
            }
          }
        });

        if (this.leaveData && this.leaveData.length > 0) {
          // Do nothing, balances removed
        } else {
          // Default fallbacks if no records in SAP
        }
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.hasError = false;
      },
      error: (err) => {
        console.error('Error fetching leave data:', err);
        this.hasError = true;
        this.snackBar.open('Failed to load leave data from SAP.', 'Close', { duration: 4000 });
      }
    });
  }

  reloadLeaveData() {
    if (this.currentEmpId) {
      this.loadLeaveData(this.currentEmpId);
    }
  }

  get totalLeaveTaken(): number {
    return this.leaveData.reduce((sum, row) => sum + (parseFloat(row.TotalDays) || 0), 0);
  }

  get latestRemainingLeave(): string {
    const row = this.leaveData.find(item => this.hasValue(item.RemainingLeave));
    return row ? row.RemainingLeave : '0';
  }

  get leaveTypesCount(): number {
    return new Set(this.leaveData.map(row => row.LeaveType).filter(Boolean)).size;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.filterText = filterValue.trim();
    this.dataSource.filter = filterValue.trim().toLowerCase();
    
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  formatDate(sapDate: any): string {
    if (!sapDate) return '';
    const str = String(sapDate);
    if (str.includes('9999') || str.includes('30/12/9999') || str.includes('9999-12-30')) {
      return 'Ongoing / Active';
    }
    
    // 1. Handle OData /Date(timestamp)/ format
    if (typeof sapDate === 'string' && sapDate.includes('Date')) {
      try {
        const timestamp = parseInt(sapDate.replace(/\/Date\((\d+)\)\//, '$1'), 10);
        if (!isNaN(timestamp)) {
          return this.formatFromDate(new Date(timestamp));
        }
      } catch (e) {}
    }
    
    // 2. Handle ISO date strings (e.g. 2026-06-17T22:00:00.000Z)
    if (typeof sapDate === 'string' && sapDate.includes('T')) {
      try {
        const date = new Date(sapDate);
        if (!isNaN(date.getTime())) {
          return this.formatFromDate(date);
        }
      } catch (e) {}
    }

    // 3. Handle YYYYMMDD format
    const dateStr = String(sapDate).trim();
    if (dateStr.length === 8 && /^\d+$/.test(dateStr)) {
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      return `${day}/${month}/${year}`;
    }
    
    // Fallback to try standard Date parsing
    try {
      const date = new Date(sapDate);
      if (!isNaN(date.getTime())) {
        return this.formatFromDate(date);
      }
    } catch (e) {}
    
    return sapDate;
  }

  private formatFromDate(date: Date): string {
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  }

  calculateDays(fromDate: any, toDate: any, totalDaysFromSap: any): number {
    const sapDays = parseFloat(totalDaysFromSap);
    if (!isNaN(sapDays) && sapDays > 0) {
      return sapDays;
    }
    
    // Attempt to calculate based on FromDate and ToDate if SAP returns 0 or invalid
    if (!fromDate || !toDate) return 0;
    
    const toDateStr = String(toDate);
    if (toDateStr.includes('9999') || toDateStr.includes('30/12/9999') || toDateStr.includes('9999-12-30')) {
      return 0; // Ongoing or active leave, no fixed days
    }
    
    const start = this.parseDateForCalc(fromDate);
    const end = this.parseDateForCalc(toDate);
    
    if (!start || !end) return 0;
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
    return diffDays;
  }

  parseDateForCalc(sapDate: any): Date | null {
    if (!sapDate) return null;
    if (typeof sapDate === 'string' && sapDate.includes('Date')) {
      const ms = parseInt(sapDate.replace(/\/Date\((\d+)\)\//, '$1'), 10);
      if (!isNaN(ms)) return new Date(ms);
    }
    const date = new Date(sapDate);
    if (!isNaN(date.getTime())) return date;
    
    const dateStr = String(sapDate).trim();
    if (dateStr.length === 8 && /^\d+$/.test(dateStr)) {
      const year = parseInt(dateStr.substring(0, 4), 10);
      const month = parseInt(dateStr.substring(4, 6), 10) - 1;
      const day = parseInt(dateStr.substring(6, 8), 10);
      return new Date(year, month, day);
    }
    return null;
  }

  hasValue(value: any): boolean {
    return value !== null && value !== undefined && String(value).trim() !== '';
  }

  displayEmpId(): string {
    return this.currentEmpId.replace(/^0+/, '') || this.currentEmpId;
  }

  get pendingLeavesCount(): number {
    return this.leaveData.filter(row => String(row.LeaveStatus).toUpperCase() === 'PENDING').length;
  }

  getLeaveTypeName(type: string): string {
    const code = String(type || '').trim();
    if (code === '0100') return 'Casual Leave';
    if (code === '0200') return 'Sick Leave';
    if (code === '0300') return 'Privilege Leave';
    return code || 'Other Leave';
  }



  private clearLoadingFallback() {
    if (this.loadingFallbackTimer) {
      clearTimeout(this.loadingFallbackTimer);
      this.loadingFallbackTimer = null;
    }
  }
}
