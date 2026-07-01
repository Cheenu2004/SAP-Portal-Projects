import { Component, OnInit, inject, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { EmployeeService } from '../services/employee.service';
import { LeaveService } from '../services/leave.service';
import { PayslipService } from '../services/payslip.service';
import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  standalone: false
})
export class DashboardComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private employeeService = inject(EmployeeService);
  private leaveService = inject(LeaveService);
  private payslipService = inject(PayslipService);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);

  empId = '';
  profile: any;
  isLoading = true;
  isDownloading = false;
  
  // New features for a premium dashboard
  latestPay = '0'; // Monthly Net Salary
  currency = 'INR';
  payPeriod = '-';
  
  latestPayslip: any = null;
  recentLeaves: any[] = [];

  // Cumulative calculations since joining
  cumulativeGross = 0;
  cumulativeDeductions = 0;
  cumulativeNet = 0;
  monthsSinceJoining = 1;

  private authSub!: Subscription;

  get displayEmpId(): string {
    return this.stripLeadingZeros(this.profile?.EmpId || this.empId);
  }

  ngOnInit() {
    this.authSub = this.authService.currentEmpId$.subscribe({
      next: (id) => {
        if (id) {
          this.empId = id;
          this.loadData();
        } else {
          this.empId = '';
          this.profile = null;
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.authSub) {
      this.authSub.unsubscribe();
    }
  }

  loadData() {
    if (!this.empId) return;

    this.isLoading = true;
    
    // Load Profile
    this.employeeService.getProfile(this.empId).subscribe({
      next: (data) => {
        this.profile = data;
        this.isLoading = false;
        this.calculateCumulativeFinancials();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching profile:', err);
        this.isLoading = false;
        this.snackBar.open('Could not load dashboard profile details.', 'Close', { duration: 4000 });
        this.cdr.detectChanges();
      }
    });

    this.leaveService.getLeaveData(this.empId).subscribe({
      next: (leaves) => {
        const mappedLeaves = (leaves || []).map((row: any) => ({
          ...row,
          TotalDays: this.calculateDays(row.FromDate, row.ToDate, row.TotalDays)
        }));

        let clTaken = 0;
        let slTaken = 0;
        let plTaken = 0;

        mappedLeaves.forEach((row: any) => {
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

        if (leaves && leaves.length > 0) {
          // Get up to 3 recent applications
          this.recentLeaves = mappedLeaves.slice(0, 3);
        } else {
          this.recentLeaves = [];
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching leave summary:', err);
        this.snackBar.open('Could not load leave summary.', 'Close', { duration: 4000 });
      }
    });

    // Load Payslip for summary
    this.payslipService.getPayslips(this.empId).subscribe({
      next: (payslips) => {
        if (payslips && payslips.length > 0) {
          this.latestPayslip = payslips[0];
          // Net salary as in per month
          this.latestPay = String(parseFloat(this.latestPayslip.NetSalary || '0') / 12);
          this.currency = this.latestPayslip.Currency || 'INR';
          
          const validFrom = this.formatDate(this.latestPayslip.ValidFrom);
          const validTo = this.formatDate(this.latestPayslip.ValidTo);
          this.payPeriod = validFrom && validTo ? `${validFrom} to ${validTo}` : `${validFrom || this.latestPayslip.ValidFrom} to ${validTo || this.latestPayslip.ValidTo}`;
          
          this.calculateCumulativeFinancials();
        } else {
          this.latestPayslip = null;
          this.latestPay = '0';
          this.currency = 'INR';
          this.payPeriod = '-';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching payslip summary:', err);
        this.snackBar.open('Could not load payslip summary.', 'Close', { duration: 4000 });
      }
    });
  }

  calculateCumulativeFinancials() {
    if (!this.profile || !this.latestPayslip) return;
    
    const joinDateStr = this.profile.JoiningDate || this.profile.JoinDate;
    this.monthsSinceJoining = this.getNumberOfMonthsSinceJoining(joinDateStr);
    
    const annualGross = parseFloat(this.latestPayslip.TotalEarnings) || 0;
    const annualDeductions = parseFloat(this.latestPayslip.TotalDeductions) || 0;
    const annualNet = parseFloat(this.latestPayslip.NetSalary) || 0;
    
    // Calculate cumulative with respect to the date of joining (expressed in active months since joining)
    this.cumulativeGross = (annualGross / 12) * this.monthsSinceJoining;
    this.cumulativeDeductions = (annualDeductions / 12) * this.monthsSinceJoining;
    this.cumulativeNet = (annualNet / 12) * this.monthsSinceJoining;
  }

  getNumberOfMonthsSinceJoining(joinDateStr: any): number {
    if (!joinDateStr) return 1;
    let joinDate: Date;
    if (typeof joinDateStr === 'string' && joinDateStr.includes('Date')) {
      const timestamp = parseInt(joinDateStr.replace(/\/Date\((\d+)\)\//, '$1'), 10);
      joinDate = new Date(timestamp);
    } else {
      joinDate = new Date(joinDateStr);
    }
    
    if (isNaN(joinDate.getTime())) return 1;
    
    const currentDate = new Date('2026-05-26'); // Today's simulated local time
    
    let months = (currentDate.getFullYear() - joinDate.getFullYear()) * 12;
    months -= joinDate.getMonth();
    months += currentDate.getMonth();
    months += 1; // Include joining month
    
    return Math.max(1, months);
  }

  downloadLatestPayslip() {
    if (!this.empId || !this.latestPayslip) {
      this.snackBar.open('No payslip available to download.', 'Close', { duration: 3000 });
      return;
    }
    
    let year = String(this.latestPayslip.PayYear || '').trim();
    let month = String(this.latestPayslip.PayMonth || '').trim();
    
    if (!year || !month) {
      const validFrom = String(this.latestPayslip.ValidFrom || '');
      if (validFrom.length >= 6) {
        year = validFrom.substring(0, 4);
        month = validFrom.substring(4, 6);
      }
    }

    if (!year || !month) {
      this.snackBar.open('Payslip period is missing in SAP data.', 'Close', { duration: 3000 });
      return;
    }

    this.isDownloading = true;
    this.payslipService.downloadPayslipPdf(this.empId, month, year).subscribe({
      next: (blob: Blob) => {
        this.isDownloading = false;
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `Payslip_${this.stripLeadingZeros(this.empId)}_${year}_${month}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
        this.snackBar.open('Payslip downloaded successfully.', 'Close', { duration: 3000 });
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isDownloading = false;
        console.error('Error downloading payslip PDF:', err);
        this.snackBar.open('Failed to download PDF. Please try again.', 'Close', { duration: 3000 });
        this.cdr.detectChanges();
      }
    });
  }

  formatCurrency(val: any): string {
    const num = parseFloat(val);
    if (isNaN(num)) return '0.00';
    return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  obfuscateAccount(val: any): string {
    const str = String(val || '').trim();
    if (str.length <= 4) return str;
    return '•••• ' + str.substring(str.length - 4);
  }

  obfuscatePAN(val: any): string {
    const str = String(val || '').trim();
    if (str.length <= 4) return str;
    return str.substring(0, 3) + '••••' + str.substring(str.length - 3);
  }

  stripLeadingZeros(value: any): string {
    const text = String(value || '').trim();
    return text.replace(/^0+/, '') || text;
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

  formatDate(sapDate: any): string {
    if (!sapDate) return '';
    
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
}
