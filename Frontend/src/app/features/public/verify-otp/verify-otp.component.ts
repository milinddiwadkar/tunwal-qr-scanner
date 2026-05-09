import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './verify-otp.component.html',
  styleUrl: './verify-otp.component.css'
})
export class VerifyOtpComponent implements AfterViewInit, OnDestroy {
  private fb = inject(FormBuilder);

  @ViewChild('otpInput') otpInput?: ElementRef<HTMLInputElement>;

  qrId = '';
  mobileNumber = '';

  loading = signal(false);
  resending = signal(false);
  checkingNextStep = signal(false);

  error = signal('');
  success = signal('');

  resendCooldown = signal(30);
  canResend = signal(false);

  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  form = this.fb.group({
    otp: ['', [Validators.required]]
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService
  ) {
    this.qrId = this.route.snapshot.paramMap.get('qrId') || '';
    this.mobileNumber = sessionStorage.getItem('activation_mobile') || '';
    this.startCooldown();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.otpInput?.nativeElement.focus();
    }, 150);
  }

  get maskedMobileNumber(): string {
    if (!this.mobileNumber) return '';
    if (this.mobileNumber.length < 10) return this.mobileNumber;
    return `${this.mobileNumber.slice(0, 2)}******${this.mobileNumber.slice(-2)}`;
  }

  startCooldown(seconds: number = 30): void {
    this.resendCooldown.set(seconds);
    this.canResend.set(false);

    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    this.countdownInterval = setInterval(() => {
      const current = this.resendCooldown();

      if (current <= 1) {
        this.resendCooldown.set(0);
        this.canResend.set(true);

        if (this.countdownInterval) {
          clearInterval(this.countdownInterval);
          this.countdownInterval = null;
        }
      } else {
        this.resendCooldown.set(current - 1);
      }
    }, 1000);
  }

  verifyOtp(): void {
    if (!this.qrId) {
      this.error.set('QR ID missing. Start again.');
      return;
    }

    if (!this.mobileNumber) {
      this.error.set('Mobile number missing. Start again.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.success.set('');

    const otp = this.form.getRawValue().otp!;

    this.api.verifyOtp(this.qrId, this.mobileNumber, otp).subscribe({
      next: () => {
        this.success.set('OTP verified successfully');
        sessionStorage.setItem(`otp_verified_${this.qrId}`, 'true');

        this.loading.set(false);
        this.decideNextStep();
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'OTP verification failed');
      }
    });
  }

  decideNextStep(): void {
    this.checkingNextStep.set(true);
    this.error.set('');

    this.api.getQrStatus(this.qrId).subscribe({
      next: (res) => {
        this.checkingNextStep.set(false);

        const data = res.data || res;

        const status = data.status || '';
        const warrantyStatus = data.warrantyStatus || 'pending';
        const emergencyStatus = data.emergencyStatus || 'inactive';

        console.log('QR status after OTP:', {
          status,
          warrantyStatus,
          emergencyStatus,
          raw: res
        });

        if (status === 'blocked') {
          this.router.navigate(['/blocked', this.qrId]);
          return;
        }

        if (status === 'expired' || status === 'scrapped') {
          this.error.set(`This QR is ${status}. Please contact support.`);
          return;
        }

        /**
         * Main rule:
         * After OTP, warranty must open unless backend clearly says
         * warrantyStatus === 'registered'.
         */
        if (warrantyStatus !== 'registered') {
          this.router.navigate(['/warranty', this.qrId]);
          return;
        }

        if (emergencyStatus === 'active') {
          this.router.navigate(['/emergency', this.qrId]);
          return;
        }

        this.router.navigate(['/warranty-success', this.qrId]);
      },
      error: () => {
        this.checkingNextStep.set(false);

        /**
         * Safe fallback:
         * After OTP, if QR status check fails, send customer to warranty form.
         */
        this.router.navigate(['/warranty', this.qrId]);
      }
    });
  }

  resendOtp(): void {
    if (!this.mobileNumber) {
      this.error.set('Mobile number missing. Start again.');
      return;
    }

    if (!this.canResend()) {
      return;
    }

    this.resending.set(true);
    this.error.set('');
    this.success.set('');

    this.api.sendOtp(this.qrId, this.mobileNumber).subscribe({
      next: () => {
        this.resending.set(false);
        this.success.set('OTP resent successfully');
        this.startCooldown(30);
      },
      error: (err) => {
        this.resending.set(false);
        this.error.set(err?.error?.message || 'Failed to resend OTP');
      }
    });
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
}