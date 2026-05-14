import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';

import { ApiService } from '../../../core/services/api.service';
import { QrItem } from '../../../shared/models/api.models';

@Component({
  selector: 'app-qr-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatTableModule,
    MatButtonModule
  ],
  templateUrl: './qr-list.component.html',
  styleUrl: './qr-list.component.css'
})
export class QrListComponent implements OnInit {
  loading = signal(true);
  error = signal('');
  rows = signal<QrItem[]>([]);
  search = '';

  displayedColumns = [
    'image',
    'qrId',
    'status',
    'warrantyStatus',
    'emergencyStatus',
    'customerName',
    'mobileNumber',
    'vehicleName',
    'showroomName',
    'createdAt',
    'actions'
  ];

  totalCount = computed(() => this.rows().length);

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');

    this.api.getQrList(this.search.trim()).subscribe({
      next: (res) => {
        this.rows.set(res || []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Failed to load QR list');
        this.loading.set(false);
      }
    });
  }

  clearSearch(): void {
    this.search = '';
    this.load();
  }

  getStatusClass(status: string | undefined): string {
    const value = String(status || '').toLowerCase();

    if (value === 'active') return 'status-active';
    if (value === 'inactive') return 'status-inactive';
    if (value === 'blocked') return 'status-blocked';
    if (value === 'otp_pending') return 'status-pending';
    if (value === 'expired') return 'status-blocked';
    if (value === 'scrapped') return 'status-blocked';

    return 'status-default';
  }

  getWarrantyClass(status: string | undefined): string {
    const value = String(status || '').toLowerCase();

    if (value === 'registered') return 'status-active';
    if (value === 'pending') return 'status-pending';

    return 'status-default';
  }

  getEmergencyClass(status: string | undefined): string {
    const value = String(status || '').toLowerCase();

    if (value === 'active') return 'status-active';
    if (value === 'skipped') return 'status-muted';
    if (value === 'inactive') return 'status-inactive';

    return 'status-default';
  }
}