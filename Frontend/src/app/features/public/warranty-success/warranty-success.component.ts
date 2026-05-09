import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-warranty-success',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule],
  templateUrl: './warranty-success.component.html',
  styleUrl: './warranty-success.component.css'
})
export class WarrantySuccessComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);

  qrId = this.route.snapshot.paramMap.get('qrId') || '';

  loading = signal(false);
  message = signal('');
  error = signal('');
  skipped = signal(false);

  activateEmergency(): void {
    this.router.navigate(['/register', this.qrId]);
  }

  skipEmergency(): void {
    if (!this.qrId) {
      this.error.set('QR ID missing. Please scan QR again.');
      return;
    }

    this.loading.set(true);
    this.message.set('');
    this.error.set('');

    this.api.skipEmergency(this.qrId).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.skipped.set(true);
        this.message.set(res?.message || 'Emergency profile skipped successfully.');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Unable to skip emergency profile.');
      }
    });
  }

  activateLater(): void {
    this.router.navigate(['/activate', this.qrId]);
  }
}