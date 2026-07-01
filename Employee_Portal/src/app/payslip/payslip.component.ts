import { ChangeDetectorRef, Component, OnInit, OnDestroy, inject } from '@angular/core';
import { PayslipService } from '../services/payslip.service';
import { AuthService } from '../services/auth.service';
import { EmployeeService } from '../services/employee.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EmailService } from '../services/email.service';
import { finalize, Subscription, take } from 'rxjs';

@Component({
  selector: 'app-payslip',
  templateUrl: './payslip.component.html',
  styleUrl: './payslip.component.css',
  standalone: false
})
export class PayslipComponent implements OnInit, OnDestroy {
  private payslipService = inject(PayslipService);
  private authService = inject(AuthService);
  private employeeService = inject(EmployeeService);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);
  private emailService = inject(EmailService);

  payslips: any[] = [];
  displayedSlots: any[] = []; // Slots generated per month starting from joining date
  isLoading = true;
  hasError = false;            // Track fetch errors for retry UI
  loadedOnce = false;
  today = new Date();
  currentEmpId = '';
  private authSub!: Subscription;
  private loadingFallbackTimer: ReturnType<typeof setTimeout> | null = null;

  // Filter States
  selectedMonth: string = String(new Date().getMonth() + 1).padStart(2, '0');
  selectedYear: string = String(new Date().getFullYear());
  availableYears: string[] = ['2026', '2025', '2024', '2023'];
  availableMonths = [
    { value: '01', viewValue: 'January' },
    { value: '02', viewValue: 'February' },
    { value: '03', viewValue: 'March' },
    { value: '04', viewValue: 'April' },
    { value: '05', viewValue: 'May' },
    { value: '06', viewValue: 'June' },
    { value: '07', viewValue: 'July' },
    { value: '08', viewValue: 'August' },
    { value: '09', viewValue: 'September' },
    { value: '10', viewValue: 'October' },
    { value: '11', viewValue: 'November' },
    { value: '12', viewValue: 'December' }
  ];

  // Mail Modal States
  isMailModalOpen = false;
  mailEmailAddress = '';
  isSendingMail = false;
  activeSlipForMail: any = null;

  // Breakdown Modal States
  isBreakdownModalOpen = false;
  activeSlipForBreakdown: any = null;

  // Profile data for checks
  joiningDate: any = null;
  employeeName = '';

  // Premium metrics
  annualCTC = 0;
  annualNet = 0;
  annualDeductions = 0;
  recentPayout = 0;
  recentGross = 0;
  recentDeductions = 0;
  tenureText = '';

  ngOnInit() {
    this.authSub = this.authService.currentEmpId$.subscribe({
      next: (id) => {
        if (id) {
          this.currentEmpId = id;
          this.loadProfileForJoiningDate(id);
          this.loadPayslips(id);
        } else {
          this.payslips = [];
          this.displayedSlots = [];
          this.isLoading = false;
          this.loadedOnce = true;
        }
      }
    });
  }

  loadProfileForJoiningDate(empId: string) {
    this.employeeService.getProfile(empId).subscribe({
      next: (profile) => {
        if (profile) {
          this.joiningDate = profile.JoiningDate || profile.JoinDate || null;
          this.employeeName = profile.EmployeeName || profile.FullName || '';
          this.calculateMetrics();
          this.applyFilters();
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.warn('Could not fetch profile for joining date check:', err);
      }
    });
  }

  ngOnDestroy() {
    if (this.authSub) {
      this.authSub.unsubscribe();
    }
    this.clearLoadingFallback();
  }

  loadPayslips(empId: string) {
    this.isLoading = true;
    this.hasError = false;
    this.loadedOnce = false;
    this.clearLoadingFallback();
    this.loadingFallbackTimer = setTimeout(() => {
      if (this.isLoading) {
        this.isLoading = false;
        this.hasError = true;
        this.loadedOnce = true;
        this.snackBar.open('Payslip data is taking too long to respond from SAP. Please retry.', 'Close', { duration: 5000 });
        this.cdr.detectChanges();
      }
    }, 16000);

    this.payslipService.getPayslips(empId).pipe(
      take(1),
      finalize(() => {
        this.clearLoadingFallback();
        this.isLoading = false;
        this.loadedOnce = true;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (data) => {
        this.payslips = data;
        this.calculateMetrics();
        this.populateFilterOptions();
        this.applyFilters();
        this.hasError = false;
      },
      error: (err) => {
        console.error('Error fetching payslips:', err);
        this.hasError = true;
        this.snackBar.open('Failed to load payslips. Use the Refresh button to retry.', 'Close', { duration: 5000 });
      }
    });
  }

  refreshPayslips() {
    if (this.currentEmpId) {
      this.loadPayslips(this.currentEmpId);
    }
  }

  populateFilterOptions() {
    const currentYear = 2026; // Simulated current year
    const years: string[] = [];
    for (let y = 2023; y <= currentYear; y++) {
      years.push(String(y));
    }
    this.availableYears = years.reverse(); // Latest years first
  }

  applyFilters() {
    this.displayedSlots = this.generateMonthlySlots();
  }

  clearFilters() {
    this.selectedMonth = '';
    this.selectedYear = '';
    this.applyFilters();
  }

  getSlipYear(slip: any): string {
    const validFrom = String(slip?.ValidFrom || '');
    return String(slip?.PayYear || slip?.Year || slip?.Pyear || slip?.PayrollYear || (validFrom.length >= 4 ? validFrom.substring(0, 4) : '')).trim();
  }

  getSlipMonth(slip: any): string {
    const validFrom = String(slip?.ValidFrom || '');
    const month = String(slip?.PayMonth || slip?.Month || slip?.Pmonth || slip?.PayrollMonth || (validFrom.length >= 6 ? validFrom.substring(4, 6) : '')).trim();
    return month.length === 1 ? `0${month}` : month;
  }

  getSlipTitle(slip: any): string {
    const year = this.getSlipYear(slip);
    const monthVal = this.getSlipMonth(slip);
    if (year && monthVal) {
      const monthObj = this.availableMonths.find(m => m.value === monthVal);
      return `for ${monthObj ? monthObj.viewValue : monthVal} ${year}`;
    }
    return 'Available Statement';
  }

  getSelectedMonthName(): string {
    if (this.selectedMonth === 'ALL') {
      return 'Full Year';
    }
    const monthObj = this.availableMonths.find(m => m.value === this.selectedMonth);
    return monthObj ? monthObj.viewValue : this.selectedMonth;
  }

  getPeriodText(slip: any): string {
    const from = this.formatDate(slip?.ValidFrom);
    const to = this.formatDate(slip?.ValidTo);
    if (from && to) return `${from} - ${to}`;
    return from || to || 'Period available in SAP record';
  }

  getDisplayEmpId(value: any): string {
    const text = String(value || '').trim();
    return text.replace(/^0+/, '') || text;
  }

  currentDisplayEmpId(): string {
    return this.getDisplayEmpId(this.currentEmpId);
  }

  getSlipId(slip: any): string {
    const year = this.getSlipYear(slip);
    const month = this.getSlipMonth(slip);
    return `${slip.EmpId || this.currentEmpId}_${year}_${month}`;
  }

  parseSapDate(value: any): Date | null {
    if (!value) return null;
    let dateVal = value;
    if (typeof value === 'string' && value.includes('Date')) {
      const ms = parseInt(value.replace(/\/Date\((\d+)\)\//, '$1'), 10);
      if (!isNaN(ms)) {
        dateVal = ms;
      }
    }
    const date = new Date(dateVal);
    return isNaN(date.getTime()) ? null : date;
  }

  isBeforeJoiningDate(yearStr: string, monthStr: string): boolean {
    if (!this.joiningDate) return false;
    const joinDate = this.parseSapDate(this.joiningDate);
    if (!joinDate) return false;

    const joinYear = joinDate.getUTCFullYear();
    const joinMonth = joinDate.getUTCMonth(); // 0-indexed

    const targetYear = parseInt(yearStr, 10);
    const targetMonth = parseInt(monthStr, 10) - 1; // 0-indexed

    if (targetYear < joinYear) return true;
    if (targetYear === joinYear && targetMonth < joinMonth) return true;

    return false;
  }

  isFuturePeriod(yearStr: string, monthStr: string): boolean {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-indexed

    const targetYear = parseInt(yearStr, 10);
    const targetMonth = parseInt(monthStr, 10) - 1; // 0-indexed

    if (targetYear > currentYear) return true;
    if (targetYear === currentYear && targetMonth > currentMonth) return true;

    return false;
  }

  openBreakdownModal(slip: any) {
    this.activeSlipForBreakdown = slip;
    this.isBreakdownModalOpen = true;
    this.cdr.detectChanges();
  }

  closeBreakdownModal() {
    this.isBreakdownModalOpen = false;
    this.activeSlipForBreakdown = null;
    this.cdr.detectChanges();
  }

  generateMonthlySlots(): any[] {
    if (!this.selectedMonth || !this.selectedYear) {
      return [];
    }

    const slots: any[] = [];
    const yearStr = this.selectedYear;

    if (this.selectedMonth === 'ALL') {
      let validMonthsCount = 0;
      let beforeJoiningCount = 0;
      let futureCount = 0;

      for (let m = 1; m <= 12; m++) {
        const monthStr = String(m).padStart(2, '0');
        const isFuture = this.isFuturePeriod(yearStr, monthStr);
        const isBeforeJoin = this.isBeforeJoiningDate(yearStr, monthStr);

        if (!isFuture && !isBeforeJoin) {
          validMonthsCount++;
          const templateSlip = this.payslips.length > 0 ? this.payslips[0] : {};
          slots.push({
            ...templateSlip,
            isRealRecord: this.payslips.length > 0,
            accessible: true,
            reason: '',
            PayMonth: monthStr,
            PayYear: yearStr,
            EmpId: this.currentEmpId
          });
        } else if (isFuture) {
          futureCount++;
        } else if (isBeforeJoin) {
          beforeJoiningCount++;
        }
      }

      // If no valid months were found for the entire year, show a single warning slot
      if (validMonthsCount === 0) {
        if (futureCount === 12) {
          slots.push({
            isRealRecord: false,
            accessible: false,
            reason: 'future',
            PayMonth: 'ALL',
            PayYear: yearStr,
            EmpId: this.currentEmpId
          });
        } else if (beforeJoiningCount === 12) {
          slots.push({
            isRealRecord: false,
            accessible: false,
            reason: 'before_joining',
            PayMonth: 'ALL',
            PayYear: yearStr,
            EmpId: this.currentEmpId
          });
        }
      }
    } else {
      // Specific month selected
      const monthStr = this.selectedMonth;

      // 1. Check if future
      if (this.isFuturePeriod(yearStr, monthStr)) {
        slots.push({
          isRealRecord: false,
          accessible: false,
          reason: 'future',
          PayMonth: monthStr,
          PayYear: yearStr,
          EmpId: this.currentEmpId
        });
        return slots;
      }

      // 2. Check if before joining date
      if (this.isBeforeJoiningDate(yearStr, monthStr)) {
        slots.push({
          isRealRecord: false,
          accessible: false,
          reason: 'before_joining',
          PayMonth: monthStr,
          PayYear: yearStr,
          EmpId: this.currentEmpId
        });
        return slots;
      }

      // 3. Valid period - use this.payslips[0] as template for salary numbers
      if (this.payslips.length > 0) {
        slots.push({
          ...this.payslips[0],
          isRealRecord: true,
          accessible: true,
          reason: '',
          PayMonth: monthStr,
          PayYear: yearStr,
          EmpId: this.currentEmpId
        });
      } else {
        slots.push({
          isRealRecord: false,
          accessible: true,
          reason: 'pending_release',
          PayMonth: monthStr,
          PayYear: yearStr,
          EmpId: this.currentEmpId
        });
      }
    }

    return slots;
  }

  calculateMetrics() {
    const templateSlip = this.payslips.length > 0 ? this.payslips[0] : null;
    
    if (templateSlip) {
      this.annualCTC = parseFloat(templateSlip.TotalEarnings) || 0;
      this.annualDeductions = parseFloat(templateSlip.TotalDeductions) || 0;
      this.annualNet = parseFloat(templateSlip.NetSalary) || parseFloat(templateSlip.BasicPay) || 0;

      // Keep monthly values as backup if needed
      this.recentPayout = this.annualNet / 12;
      this.recentGross = this.annualCTC / 12;
      this.recentDeductions = this.annualDeductions / 12;
    } else {
      this.annualCTC = 0;
      this.annualDeductions = 0;
      this.annualNet = 0;
      this.recentPayout = 0;
      this.recentGross = 0;
      this.recentDeductions = 0;
    }
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

  downloadPDF(slip: any) {
    const empId = slip.EmpId || this.authService.getEmpId();
    if (!empId) {
      this.snackBar.open('Employee ID not found.', 'Close', { duration: 3000 });
      return;
    }

    const year = this.getSlipYear(slip);
    const month = this.getSlipMonth(slip);
    if (!year || !month) {
      this.snackBar.open('Payslip period is missing in SAP data.', 'Close', { duration: 3000 });
      return;
    }

    // No loading UI for PDF download

    this.payslipService.downloadPayslipPdf(empId, month, year).subscribe({
      next: (blob: Blob) => {
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `Payslip_${this.getDisplayEmpId(empId)}_${year}_${month}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
        this.snackBar.open('Payslip downloaded successfully.', 'Close', { duration: 3000 });
      },
      error: (err) => {
        console.error('Error downloading payslip PDF:', err);
        this.snackBar.open('Failed to download PDF. Please try again.', 'Close', { duration: 3000 });
      }
    });
  }

  printPayslip(slip: any) {
    const empId = slip.EmpId || this.authService.getEmpId();
    if (!empId) {
      this.snackBar.open('Employee ID not found.', 'Close', { duration: 3000 });
      return;
    }

    const year = this.getSlipYear(slip);
    const month = this.getSlipMonth(slip);
    if (!year || !month) {
      this.snackBar.open('Payslip period is missing in SAP data.', 'Close', { duration: 3000 });
      return;
    }

    // No loading UI for PDF print

    this.payslipService.downloadPayslipPdf(empId, month, year).subscribe({
      next: (blob: Blob) => {
        const blobUrl = window.URL.createObjectURL(blob);
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = blobUrl;
        document.body.appendChild(iframe);
        iframe.onload = () => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => {
            document.body.removeChild(iframe);
            window.URL.revokeObjectURL(blobUrl);
          }, 2000);
        };
      },
      error: (err) => {
        console.error('Error printing payslip PDF:', err);
        this.snackBar.open('Failed to print PDF. Please try again.', 'Close', { duration: 3000 });
      }
    });
  }

  openMailModal(slip: any) {
    this.activeSlipForMail = slip;
    this.mailEmailAddress = '';
    this.isMailModalOpen = true;

    // Attempt to prefill email from Employee Profile
    const empId = this.authService.getEmpId();
    if (empId) {
      this.employeeService.getProfile(empId).subscribe({
        next: (profile) => {
          if (profile && profile.Email) {
            this.mailEmailAddress = profile.Email;
          }
        },
        error: (err) => {
          console.warn('Could not fetch profile email for prefilling:', err);
        }
      });
    }
  }

  closeMailModal() {
    this.isMailModalOpen = false;
    this.activeSlipForMail = null;
    this.mailEmailAddress = '';
  }

  sendMail() {
    if (!this.mailEmailAddress || !this.mailEmailAddress.includes('@')) {
      this.snackBar.open('Please enter a valid email address.', 'Close', { duration: 3000 });
      return;
    }

    const empId = this.authService.getEmpId();
    if (!empId) {
      this.snackBar.open('Employee ID not available.', 'Close', { duration: 3000 });
      return;
    }
    const month = this.getSlipMonth(this.activeSlipForMail);
    const year = this.getSlipYear(this.activeSlipForMail);

    this.isSendingMail = true;
    this.cdr.detectChanges();
    this.emailService.sendPayslipEmail({ empId, month, year, email: this.mailEmailAddress }).subscribe({
      next: (res: any) => {
        this.isSendingMail = false;
        this.snackBar.open(res.message || 'Payslip email sent successfully.', 'Close', { duration: 4000 });
        this.closeMailModal();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSendingMail = false;
        console.error('Email send error:', err);
        this.snackBar.open('Failed to send payslip email. Please try again.', 'Close', { duration: 4000 });
        this.cdr.detectChanges();
      }
    });
  }

  checkAccessibility(slip: any): { accessible: boolean; reason: string } {
    return {
      accessible: slip.accessible,
      reason: slip.reason
    };
  }

  formatCurrency(val: any): string {
    const num = parseFloat(val);
    if (isNaN(num)) return '0.00';
    return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  parseFloat(val: any): number {
    return parseFloat(val) || 0;
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

  private clearLoadingFallback() {
    if (this.loadingFallbackTimer) {
      clearTimeout(this.loadingFallbackTimer);
      this.loadingFallbackTimer = null;
    }
  }
}
