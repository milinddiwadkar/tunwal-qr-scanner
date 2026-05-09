import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-qr-details',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule],
  templateUrl: './qr-details.component.html',
  styleUrl: './qr-details.component.css'
})
export class QrDetailsComponent implements OnInit {
  loading = signal(true);
  actionLoading = signal(false);
  error = signal('');
  success = signal('');
  data = signal<any>(null);

  constructor(
    private route: ActivatedRoute,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const id = this.route.snapshot.paramMap.get('id') || '';

    this.loading.set(true);
    this.error.set('');
    this.success.set('');

    this.api.getQrById(id).subscribe({
      next: res => {
        this.data.set(res);
        this.loading.set(false);
      },
      error: err => {
        this.error.set(err?.error?.message || 'Failed to load QR details');
        this.loading.set(false);
      }
    });
  }

  blockQr(): void {
    const qr = this.data()?.qr;
    if (!qr?._id) return;

    const reason = prompt('Enter block reason') || '';
    if (!reason.trim()) {
      return;
    }

    this.actionLoading.set(true);
    this.error.set('');
    this.success.set('');

    this.api.blockQr(qr._id, reason.trim()).subscribe({
      next: res => {
        this.success.set(res.message || 'QR blocked successfully');
        this.actionLoading.set(false);
        this.load();
      },
      error: err => {
        this.error.set(err?.error?.message || 'Failed to block QR');
        this.actionLoading.set(false);
      }
    });
  }

  unblockQr(): void {
    const qr = this.data()?.qr;
    if (!qr?._id) return;

    this.actionLoading.set(true);
    this.error.set('');
    this.success.set('');

    this.api.unblockQr(qr._id).subscribe({
      next: res => {
        this.success.set(res.message || 'QR unblocked successfully');
        this.actionLoading.set(false);
        this.load();
      },
      error: err => {
        this.error.set(err?.error?.message || 'Failed to unblock QR');
        this.actionLoading.set(false);
      }
    });
  }
}