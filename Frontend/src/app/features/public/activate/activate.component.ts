import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-activate',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './activate.component.html',
  styleUrl: './activate.component.css'
})
export class ActivateComponent implements OnInit {
  private fb = inject(FormBuilder);

  qrId = '';

  loading = signal(true);
  sendingOtp = signal(false);
  error = signal('');

  status = signal('');
  warrantyStatus = signal('');
  emergencyStatus = signal('');

  showOtpForm = signal(false);

  form = this.fb.group({
    mobile: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]]
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.qrId = this.route.snapshot.paramMap.get('qrId') || '';

    if (!this.qrId) {
      this.error.set('Invalid QR ID');
      this.loading.set(false);
      return;
    }

    this.api.getQrStatus(this.qrId).subscribe({
      next: (res) => {
        const data = res.data || res;

        this.status.set(data.status || '');
        this.warrantyStatus.set(data.warrantyStatus || 'pending');
        this.emergencyStatus.set(data.emergencyStatus || 'inactive');

        if (data.status === 'blocked') {
          this.loading.set(false);
          this.router.navigate(['/blocked', this.qrId]);
          return;
        }

        if (data.status === 'expired' || data.status === 'scrapped') {
          this.error.set(`This QR is ${data.status}. Please contact support.`);
          this.loading.set(false);
          return;
        }

        if (
          data.warrantyStatus === 'registered' &&
          data.emergencyStatus === 'active'
        ) {
          this.loading.set(false);
          this.router.navigate(['/emergency', this.qrId]);
          return;
        }

        this.loading.set(false);
        this.showOtpForm.set(true);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Failed to load QR');
        this.loading.set(false);
      }
    });
  }

  sendOtp(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const mobile = this.form.getRawValue().mobile!;

    this.sendingOtp.set(true);
    this.error.set('');

    this.api.sendOtp(this.qrId, mobile).subscribe({
      next: () => {
        sessionStorage.setItem('activation_mobile', mobile);

        /*
          After OTP verification, verify-otp page should decide:
          - warranty pending → /warranty/:qrId
          - warranty registered → /warranty-success/:qrId
        */
        this.sendingOtp.set(false);
        this.router.navigate(['/verify-otp', this.qrId]);
      },
      error: (err) => {
        this.sendingOtp.set(false);
        this.error.set(err?.error?.message || 'Failed to send OTP');
      }
    });
  }
}