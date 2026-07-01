import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { EmployeeService } from '../services/employee.service';
import { Subscription } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

interface ProfileField {
  label: string;
  value: string;
  icon: string;
  key: string;
}

interface ProfileSection {
  title: string;
  icon: string;
  colorClass: string;
  fields: ProfileField[];
}

@Component({
  selector: 'app-employee-profile',
  templateUrl: './employee-profile.component.html',
  styleUrl: './employee-profile.component.css',
  standalone: false
})
export class EmployeeProfileComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private employeeService = inject(EmployeeService);
  private cdr = inject(ChangeDetectorRef);
  private snackBar = inject(MatSnackBar);

  empId = '';
  profile: any;
  profileSections: ProfileSection[] = [];
  isLoading = true;
  private authSub!: Subscription;

  // Quick info cards
  employeeName = '';
  designation = '';
  department = '';
  email = '';
  phone = '';
  joiningDate = '';
  employeeIdDisplay = '';

  ngOnInit() {
    this.authSub = this.authService.currentEmpId$.subscribe({
      next: (id) => {
        if (id) {
          this.empId = id;
          this.loadProfile();
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

  loadProfile() {
    if (!this.empId) return;

    this.isLoading = true;
    this.employeeService.getProfile(this.empId).subscribe({
      next: (data) => {
        this.profile = data;
        this.extractQuickInfo(data);
        this.profileSections = this.buildSections(data);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching profile:', err);
        this.profileSections = [];
        this.isLoading = false;
        this.snackBar.open('Failed to load profile details from SAP.', 'Close', { duration: 4000 });
        this.cdr.detectChanges();
      }
    });
  }

  extractQuickInfo(profile: any) {
    this.employeeName = profile?.EmployeeName || profile?.FullName || '';
    this.designation = profile?.Designation || '';
    this.department = profile?.Department || '';
    this.email = profile?.Email || profile?.EmailId || '';
    this.phone = profile?.Phone || profile?.Mobile || profile?.MobileNo || '';
    this.employeeIdDisplay = this.stripLeadingZeros(profile?.EmpId || this.empId);

    const joinRaw = profile?.JoiningDate || profile?.JoinDate;
    this.joiningDate = joinRaw ? this.formatDateValue(joinRaw) : '';
  }

  buildSections(profile: any): ProfileSection[] {
    if (!profile) return [];

    const sections: ProfileSection[] = [];

    // --- Section 1: Employment Details ---
    const employmentKeys: Record<string, { label: string; icon: string }> = {
      EmpId: { label: 'Employee ID', icon: 'badge' },
      Department: { label: 'Department', icon: 'business' },
      Designation: { label: 'Designation', icon: 'work' },
      JoiningDate: { label: 'Date of Joining', icon: 'event' },
      EmployeeGroup: { label: 'Employee Group', icon: 'groups' },
      EmployeeSubGroup: { label: 'Employee Sub-Group', icon: 'group_work' },
      PayrollArea: { label: 'Payroll Area', icon: 'payments' },
      CostCenter: { label: 'Cost Center', icon: 'account_balance' },
      CompanyCode: { label: 'Company Code', icon: 'domain' },
      PersonnelArea: { label: 'Personnel Area', icon: 'place' },
      PersonnelSubArea: { label: 'Personnel Sub-Area', icon: 'pin_drop' },
    };
    const employmentFields = this.extractFields(profile, employmentKeys);
    if (employmentFields.length > 0) {
      sections.push({
        title: 'Employment Details',
        icon: 'work',
        colorClass: 'section-blue',
        fields: employmentFields
      });
    }

    // --- Section 2: Personal Information ---
    const personalKeys: Record<string, { label: string; icon: string }> = {
      Gender: { label: 'Gender', icon: 'face' },
      DOB: { label: 'Date of Birth', icon: 'cake' },
      Dob: { label: 'Date of Birth', icon: 'cake' },
      MaritalStatus: { label: 'Marital Status', icon: 'people' },
      Nationality: { label: 'Nationality', icon: 'flag' },
      BloodGroup: { label: 'Blood Group', icon: 'bloodtype' },
      Religion: { label: 'Religion', icon: 'self_improvement' },
      FatherName: { label: "Father's Name", icon: 'person' },
      MotherName: { label: "Mother's Name", icon: 'person' },
      SpouseName: { label: "Spouse's Name", icon: 'favorite' },
    };
    const personalFields = this.extractFields(profile, personalKeys);
    if (personalFields.length > 0) {
      sections.push({
        title: 'Personal Information',
        icon: 'person',
        colorClass: 'section-green',
        fields: personalFields
      });
    }

    // --- Section 3: Contact Information ---
    const contactKeys: Record<string, { label: string; icon: string }> = {
      Email: { label: 'Email Address', icon: 'email' },
      Phone: { label: 'Phone Number', icon: 'call' },
      Mobile: { label: 'Mobile Number', icon: 'phone_iphone' },
      EmergencyContact: { label: 'Emergency Contact', icon: 'emergency' },
      EmergencyPhone: { label: 'Emergency Phone', icon: 'phone_callback' },
    };
    const contactFields = this.extractFields(profile, contactKeys);
    if (contactFields.length > 0) {
      sections.push({
        title: 'Contact Information',
        icon: 'contact_phone',
        colorClass: 'section-cyan',
        fields: contactFields
      });
    }

    // --- Section 4: Address Details ---
    const addressKeys: Record<string, { label: string; icon: string }> = {
      Address: { label: 'Street Address', icon: 'home' },
      Address1: { label: 'Address Line 1', icon: 'home' },
      Address2: { label: 'Address Line 2', icon: 'location_on' },
      City: { label: 'City', icon: 'location_city' },
      State: { label: 'State', icon: 'map' },
      District: { label: 'District', icon: 'map' },
      Country: { label: 'Country', icon: 'public' },
      Pincode: { label: 'PIN Code', icon: 'markunread_mailbox' },
      PostalCode: { label: 'Postal Code', icon: 'markunread_mailbox' },
    };
    const addressFields = this.extractFields(profile, addressKeys);
    if (addressFields.length > 0) {
      sections.push({
        title: 'Address',
        icon: 'location_on',
        colorClass: 'section-amber',
        fields: addressFields
      });
    }

    // --- Section 5: Bank & Financial (if available) ---
    const financeKeys: Record<string, { label: string; icon: string }> = {
      PANNumber: { label: 'PAN Number', icon: 'credit_card' },
      PAN: { label: 'PAN Number', icon: 'credit_card' },
      AadharNumber: { label: 'Aadhaar Number', icon: 'fingerprint' },
      Aadhar: { label: 'Aadhaar Number', icon: 'fingerprint' },
      BankName: { label: 'Bank Name', icon: 'account_balance' },
      AccountNumber: { label: 'Account Number', icon: 'account_balance_wallet' },
      IFSCCode: { label: 'IFSC Code', icon: 'code' },
      UAN: { label: 'UAN (PF)', icon: 'security' },
      PFNumber: { label: 'PF Number', icon: 'security' },
      ESINumber: { label: 'ESI Number', icon: 'health_and_safety' },
    };
    const financeFields = this.extractFields(profile, financeKeys);
    if (financeFields.length > 0) {
      sections.push({
        title: 'Bank & Statutory',
        icon: 'account_balance',
        colorClass: 'section-purple',
        fields: financeFields
      });
    }

    // --- Catch-all: any remaining fields not categorized ---
    const allMappedKeys = new Set([
      ...Object.keys(employmentKeys),
      ...Object.keys(personalKeys),
      ...Object.keys(contactKeys),
      ...Object.keys(addressKeys),
      ...Object.keys(financeKeys),
      '__metadata', 'EmployeeName', 'FirstName', 'MiddleName', 'LastName',
      'FullName', 'EmailId', 'MobileNo', 'JoinDate'
    ]);

    const otherFields: ProfileField[] = [];
    Object.keys(profile).forEach(key => {
      if (!allMappedKeys.has(key) && this.hasValue(profile[key])) {
        otherFields.push({
          label: this.toLabel(key),
          value: this.displayValue(key, profile[key]),
          icon: 'info',
          key
        });
      }
    });

    if (otherFields.length > 0) {
      sections.push({
        title: 'Other Details',
        icon: 'more_horiz',
        colorClass: 'section-slate',
        fields: otherFields
      });
    }

    return sections;
  }

  private extractFields(profile: any, keyMap: Record<string, { label: string; icon: string }>): ProfileField[] {
    const fields: ProfileField[] = [];
    Object.keys(keyMap).forEach(key => {
      if (profile.hasOwnProperty(key) && this.hasValue(profile[key])) {
        fields.push({
          label: keyMap[key].label,
          value: this.displayValue(key, profile[key]),
          icon: keyMap[key].icon,
          key
        });
      }
    });
    return fields;
  }

  displayValue(fieldName: string, value: any): string {
    const lowerField = fieldName.toLowerCase();

    if (lowerField === 'empid') {
      return this.stripLeadingZeros(value);
    }
    if (lowerField === 'gender') {
      const g = String(value).trim();
      if (g === '1') return 'Male';
      if (g === '2' || g === '0') return 'Female';
      return g;
    }
    if (lowerField === 'maritalstatus') {
      const m = String(value).trim();
      if (m === '0' || m === 'S') return 'Single';
      if (m === '1' || m === 'M') return 'Married';
      if (m === '2' || m === 'D') return 'Divorced';
      if (m === '3' || m === 'W') return 'Widowed';
      return m;
    }
    if (lowerField === 'dob' || lowerField === 'joiningdate' || lowerField === 'joindate') {
      return this.formatDateValue(value);
    }
    return String(value ?? '').trim();
  }

  formatDateValue(value: any): string {
    try {
      let dateVal = value;
      if (typeof value === 'string' && value.includes('Date')) {
        const ms = parseInt(value.replace(/\/Date\((\d+)\)\//, '$1'), 10);
        if (!isNaN(ms)) {
          dateVal = ms;
        }
      }
      const date = new Date(dateVal);
      if (!isNaN(date.getTime())) {
        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const year = date.getUTCFullYear();
        return `${day}/${month}/${year}`;
      }
    } catch (e) {}
    return String(value ?? '').trim();
  }

  hasValue(value: any): boolean {
    return value !== null && value !== undefined && String(value).trim() !== '';
  }

  stripLeadingZeros(value: any): string {
    const text = String(value || '').trim();
    return text.replace(/^0+/, '') || text;
  }

  toLabel(key: string): string {
    return key
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/_/g, ' ')
      .replace(/\bId\b/g, 'ID')
      .replace(/\b\w/g, char => char.toUpperCase());
  }
}
