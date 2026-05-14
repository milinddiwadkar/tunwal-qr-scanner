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
  loadingWarranty = signal(true);
  error = signal('');
  success = signal('');
  currentStep = signal(1);

  bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Not Sure'];

  private draftKey = '';

  form = this.fb.group({
    customerName: [{ value: '', disabled: true }, [Validators.required]],
    mobileNumber: [{ value: '', disabled: true }, [Validators.required]],

    email: [''],
    bloodGroup: ['', [Validators.required]],
    disease: [''],
    address: ['', [Validators.required]],

    vehicleName: [{ value: '', disabled: true }, [Validators.required]],
    chassisNumber: [{ value: '', disabled: true }, [Validators.required]],
    motorNumber: [{ value: '', disabled: true }, [Validators.required]],
    showroomName: [{ value: '', disabled: true }, [Validators.required]],

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
  ) { }

  ngOnInit(): void {
    this.qrId = this.route.snapshot.paramMap.get('qrId') || '';
    this.mobileNumber = sessionStorage.getItem('activation_mobile') || '';
    this.draftKey = `emergency_registration_draft_${this.qrId}`;

    const otpVerified = sessionStorage.getItem(`otp_verified_${this.qrId}`);

    if (!this.qrId) {
      this.error.set('QR ID missing. Please scan QR again.');
      this.loadingWarranty.set(false);
      return;
    }

    if (!this.mobileNumber) {
      this.router.navigate(['/activate', this.qrId]);
      return;
    }

    if (otpVerified !== 'true') {
      this.router.navigate(['/verify-otp', this.qrId]);
      return;
    }

    this.loadWarrantyBasic();

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

  loadWarrantyBasic(): void {
    this.loadingWarranty.set(true);
    this.error.set('');

    this.api.getWarrantyBasic(this.qrId).subscribe({
      next: (res) => {
        const data = res.data;

        if (data.emergencyStatus === 'active') {
          this.router.navigate(['/emergency', this.qrId]);
          return;
        }

        this.form.patchValue({
          customerName: data.customerName || '',
          mobileNumber: data.mobileNumber || this.mobileNumber || '',

          vehicleName: data.vehicleName || '',
          chassisNumber: data.chassisNumber || '',
          motorNumber: data.motorNumber || '',
          showroomName: data.showroomName || ''
        });

        this.restoreDraft();

        this.loadingWarranty.set(false);
      },
      error: (err) => {
        this.loadingWarranty.set(false);
        this.error.set(
          err?.error?.message ||
          'Unable to load warranty details. Please complete warranty registration first.'
        );
      }
    });
  }

  addContact(): void {
    if (this.contacts.length >= 3) {
      return;
    }

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
    this.error.set('');
    this.currentStep.set(step);
  }

  nextStep(): void {
    if (this.currentStep() === 1 && !this.isVerifiedWarrantyStepValid()) {
      this.error.set('Warranty details are missing. Please complete warranty registration first.');
      return;
    }

    if (this.currentStep() === 2 && !this.isMedicalStepValid()) {
      this.form.markAllAsTouched();
      this.error.set('Please complete medical and address details correctly.');
      return;
    }

    this.error.set('');
    this.currentStep.update((v) => Math.min(v + 1, 3));
  }

  previousStep(): void {
    this.error.set('');
    this.currentStep.update((v) => Math.max(v - 1, 1));
  }

  /*
    Disabled/read-only Angular controls do not behave like normal valid controls.
    So for warranty auto-filled data, check actual raw values instead of .valid.
  */
  isVerifiedWarrantyStepValid(): boolean {
    const raw = this.form.getRawValue();

    return !!(
      String(raw.customerName || '').trim() &&
      String(raw.mobileNumber || '').trim() &&
      String(raw.vehicleName || '').trim() &&
      String(raw.chassisNumber || '').trim() &&
      String(raw.motorNumber || '').trim() &&
      String(raw.showroomName || '').trim()
    );
  }

  isMedicalStepValid(): boolean {
    const raw = this.form.getRawValue();

    return !!(
      String(raw.bloodGroup || '').trim() &&
      String(raw.address || '').trim()
    );
  }

  isEmergencyStepValid(): boolean {
    if (this.contacts.length !== 3) return false;
    return this.contacts.controls.every((control) => control.valid);
  }

  saveDraft(): void {
    if (!this.draftKey) return;

    const raw = this.form.getRawValue();

    const payload = {
      currentStep: this.currentStep(),
      form: {
        email: raw.email,
        bloodGroup: raw.bloodGroup,
        disease: raw.disease,
        address: raw.address,
        contacts: raw.contacts
      }
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
        contacts.slice(0, 3).forEach((contact: any) => {
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
      }

      while (this.contacts.length < 3) {
        this.contacts.push(this.createContact());
      }

      while (this.contacts.length > 3) {
        this.contacts.removeAt(this.contacts.length - 1);
      }

      this.form.patchValue({
        email: draft?.form?.email || '',
        bloodGroup: draft?.form?.bloodGroup || '',
        disease: draft?.form?.disease || '',
        address: draft?.form?.address || ''
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
    const otpVerified = sessionStorage.getItem(`otp_verified_${this.qrId}`);

    if (!this.mobileNumber) {
      this.error.set('Mobile number session missing. Start again.');
      this.router.navigate(['/activate', this.qrId]);
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

    if (!this.isVerifiedWarrantyStepValid()) {
      this.error.set('Warranty details are missing. Please complete warranty registration first.');
      this.currentStep.set(1);
      return;
    }

    if (!this.isMedicalStepValid()) {
      this.form.markAllAsTouched();
      this.error.set('Please complete medical and address details correctly.');
      this.currentStep.set(2);
      return;
    }

    if (!this.isEmergencyStepValid()) {
      this.form.markAllAsTouched();
      this.error.set('Please complete all 3 emergency contacts correctly.');
      this.currentStep.set(3);
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.success.set('');

    const raw = this.form.getRawValue();

    const payload = {
      qrId: this.qrId,

      customerName: raw.customerName,
      mobileNumber: this.mobileNumber,

      email: raw.email || '',
      bloodGroup: raw.bloodGroup || '',
      disease: raw.disease || '',
      address: raw.address || '',

      vehicleName: raw.vehicleName,
      chassisNumber: raw.chassisNumber,
      motorNumber: raw.motorNumber,
      showroomName: raw.showroomName,

      contacts: raw.contacts
    };

    this.api.registerCustomer(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set('Emergency profile activated successfully.');
        this.clearDraft();
        sessionStorage.removeItem(`otp_verified_${this.qrId}`);
        this.router.navigate(['/emergency', this.qrId]);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Emergency profile activation failed.');
      }
    });
  }
}