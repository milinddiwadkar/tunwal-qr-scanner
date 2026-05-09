import { Component, OnInit, signal } from '@angular/core';
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
  imports: [CommonModule, RouterLink, FormsModule, MatTableModule, MatButtonModule],
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
    'customerName',
    'mobileNumber',
    'vehicleName',
    'showroomName',
    'createdAt',
    'actions'
  ];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');

    this.api.getQrList(this.search).subscribe({
      next: res => {
        this.rows.set(res);
        this.loading.set(false);
      },
      error: err => {
        this.error.set(err?.error?.message || 'Failed to load QR list');
        this.loading.set(false);
      }
    });
  }
}