import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../../core/services/api.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-warranty',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './warranty.component.html',
  styleUrl: './warranty.component.css'
})
export class WarrantyComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);

  qrId = this.route.snapshot.paramMap.get('qrId') || '';

  loading = signal(false);
  error = signal('');
  success = signal('');

  states = [
    'Andhra Pradesh',
    'Arunachal Pradesh',
    'Assam',
    'Bihar',
    'Chhattisgarh',
    'Goa',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Madhya Pradesh',
    'Maharashtra',
    'Manipur',
    'Meghalaya',
    'Mizoram',
    'Nagaland',
    'Odisha',
    'Punjab',
    'Rajasthan',
    'Sikkim',
    'Tamil Nadu',
    'Telangana',
    'Tripura',
    'Uttar Pradesh',
    'Uttarakhand',
    'West Bengal',
    'Andaman and Nicobar Islands',
    'Chandigarh',
    'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi',
    'Jammu and Kashmir',
    'Ladakh',
    'Lakshadweep',
    'Puducherry'
  ];

  form = this.fb.group({
    scooterName: ['', Validators.required],
    scooterColor: ['', Validators.required],
    controllerNumber: ['', Validators.required],
    batteryNumber: ['', Validators.required],
    motorNumber: ['', Validators.required],
    chassisNumber: ['', Validators.required],
    chargerNumber: ['', Validators.required],

    dealerName: ['', Validators.required],
    dateOfSale: ['', Validators.required],
    dealerAddress: ['', Validators.required],
    state: ['', Validators.required],

    customerName: ['', Validators.required],
    contactNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]]
  });

  submitWarranty(): void {
    if (!this.qrId) {
      this.error.set('QR ID missing. Please scan QR again.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Please fill all required warranty fields correctly.');
      return;
    }

    const otpVerified = sessionStorage.getItem(`otp_verified_${this.qrId}`);

    if (otpVerified !== 'true') {
      this.error.set('OTP verification required before warranty registration.');
      this.router.navigate(['/activate', this.qrId]);
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.success.set('');

    const payload = {
      qrId: this.qrId,
      ...this.form.getRawValue()
    };

    this.api.registerWarranty(payload).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.success.set(res?.message || 'Warranty registration completed successfully.');

        setTimeout(() => {
          this.router.navigate(['/warranty-success', this.qrId]);
        }, 700);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Warranty registration failed.');
      }
    });
  }
}