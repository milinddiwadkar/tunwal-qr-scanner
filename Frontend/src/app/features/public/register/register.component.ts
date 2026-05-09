import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';

import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);

  qrId = '';
  mobileNumber = '';

  loading = signal(false);
  error = signal('');
  success = signal('');
  currentStep = signal(1);

  bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  private draftKey = '';

  form = this.fb.group({
    customerName: ['', [Validators.required]],
    email: ['', [Validators.required]],
    bloodGroup: ['', [Validators.required]],
    disease: [''],
    address: ['', [Validators.required]],

    vehicleName: ['', [Validators.required]],
    chassisNumber: ['', [Validators.required]],
    motorNumber: ['', [Validators.required]],
    showroomName: ['', [Validators.required]],

    contacts: this.fb.array([
      this.createContact(),
      this.createContact(),
      this.createContact()
    ])
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.qrId = this.route.snapshot.paramMap.get('qrId') || '';
    this.mobileNumber = sessionStorage.getItem('activation_mobile') || '';
    this.draftKey = `registration_draft_${this.qrId}`;

    const otpVerified = sessionStorage.getItem(`otp_verified_${this.qrId}`);

    if (!this.mobileNumber) {
      this.router.navigate(['/activate', this.qrId]);
      return;
    }

    if (otpVerified !== 'true') {
      this.router.navigate(['/verify-otp', this.qrId]);
      return;
    }

    this.restoreDraft();

    this.form.valueChanges.subscribe(() => {
      this.saveDraft();
    });
  }

  get maskedMobileNumber(): string {
    if (!this.mobileNumber) return '';
    if (this.mobileNumber.length < 10) return this.mobileNumber;
    return `${this.mobileNumber.slice(0, 2)}******${this.mobileNumber.slice(-2)}`;
  }

  get contacts(): FormArray {
    return this.form.get('contacts') as FormArray;
  }

  createContact(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required]],
      mobile: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      email: ['', [Validators.email]],
      relation: ['', [Validators.required]]
    });
  }

  addContact(): void {
    this.contacts.push(this.createContact());
    this.saveDraft();
  }

  removeContact(index: number): void {
    if (this.contacts.length > 3) {
      this.contacts.removeAt(index);
      this.saveDraft();
    }
  }

  goToStep(step: number): void {
    if (step < 1 || step > 3) return;
    this.currentStep.set(step);
  }

  nextStep(): void {
    if (this.currentStep() === 1 && !this.isCustomerStepValid()) {
      this.form.markAllAsTouched();
      this.error.set('Please complete customer information correctly.');
      return;
    }

    if (this.currentStep() === 2 && !this.isVehicleStepValid()) {
      this.form.markAllAsTouched();
      this.error.set('Please complete vehicle information correctly.');
      return;
    }

    this.error.set('');
    this.currentStep.update(v => Math.min(v + 1, 3));
  }

  previousStep(): void {
    this.error.set('');
    this.currentStep.update(v => Math.max(v - 1, 1));
  }

  isCustomerStepValid(): boolean {
    return !!(
      this.form.get('customerName')?.valid &&
      this.form.get('email')?.valid &&
      this.form.get('bloodGroup')?.valid &&
      this.form.get('disease')?.valid &&
      this.form.get('address')?.valid
    );
  }

  isVehicleStepValid(): boolean {
    return !!(
      this.form.get('vehicleName')?.valid &&
      this.form.get('chassisNumber')?.valid &&
      this.form.get('motorNumber')?.valid &&
      this.form.get('showroomName')?.valid
    );
  }

  isEmergencyStepValid(): boolean {
    if (this.contacts.length !== 3) return false;
    return this.contacts.controls.every(control => control.valid);
  }

  saveDraft(): void {
    const payload = {
      currentStep: this.currentStep(),
      form: this.form.getRawValue()
    };
    localStorage.setItem(this.draftKey, JSON.stringify(payload));
  }

  restoreDraft(): void {
    const raw = localStorage.getItem(this.draftKey);
    if (!raw) return;

    try {
      const draft = JSON.parse(raw);

      while (this.contacts.length > 0) {
        this.contacts.removeAt(0);
      }

      const contacts = draft?.form?.contacts || [];
      if (contacts.length) {
        contacts.forEach((contact: any) => {
          this.contacts.push(
            this.fb.group({
              name: [contact.name || '', [Validators.required]],
              mobile: [
                contact.mobile || '',
                [Validators.required, Validators.pattern(/^[0-9]{10}$/)]
              ],
              email: [contact.email || '', [Validators.email]],
              relation: [contact.relation || '', [Validators.required]]
            })
          );
        });
      } else {
        this.contacts.push(this.createContact());
        this.contacts.push(this.createContact());
        this.contacts.push(this.createContact());
      }

      this.form.patchValue({
        customerName: draft?.form?.customerName || '',
        email: draft?.form?.email || '',
        bloodGroup: draft?.form?.bloodGroup || '',
        disease: draft?.form?.disease || '',
        address: draft?.form?.address || '',
        vehicleName: draft?.form?.vehicleName || '',
        chassisNumber: draft?.form?.chassisNumber || '',
        motorNumber: draft?.form?.motorNumber || '',
        showroomName: draft?.form?.showroomName || ''
      });

      if (draft?.currentStep) {
        this.currentStep.set(draft.currentStep);
      }
    } catch {
      localStorage.removeItem(this.draftKey);
    }
  }

  clearDraft(): void {
    localStorage.removeItem(this.draftKey);
  }

  submit(): void {
    const mobile = this.mobileNumber;
    const otpVerified = sessionStorage.getItem(`otp_verified_${this.qrId}`);

    if (!mobile) {
      this.error.set('Mobile number session missing. Start again.');
      return;
    }

    if (otpVerified !== 'true') {
      this.error.set('OTP verification required.');
      this.router.navigate(['/verify-otp', this.qrId]);
      return;
    }

    if (this.contacts.length !== 3) {
      this.error.set('Exactly 3 emergency contacts are required.');
      return;
    }

    if (this.form.invalid || !this.isEmergencyStepValid()) {
      this.form.markAllAsTouched();
      this.error.set('Please complete all required fields correctly.');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.success.set('');

    const raw = this.form.getRawValue();

    const payload = {
      qrId: this.qrId,
      customerName: raw.customerName,
      mobileNumber: mobile,
      email: raw.email,
      bloodGroup: raw.bloodGroup,
      disease: raw.disease,
      address: raw.address,
      vehicleName: raw.vehicleName,
      chassisNumber: raw.chassisNumber,
      motorNumber: raw.motorNumber,
      showroomName: raw.showroomName,
      contacts: raw.contacts
    };

    this.api.registerCustomer(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set('Registration successful');
        this.clearDraft();
        sessionStorage.removeItem(`otp_verified_${this.qrId}`);
        this.router.navigate(['/emergency', this.qrId]);
      },
      error: err => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Registration failed');
      }
    });
  }
}