import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { ApiService } from '../../../core/services/api.service';

import JSZip from 'jszip';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-create-qr',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatTabsModule,
    MatProgressBarModule
  ],
  templateUrl: './create-qr.component.html',
  styleUrl: './create-qr.component.css'
})
export class CreateQrComponent {

  // ===== SINGLE QR =====
  loading = signal(false);
  error = signal('');
  createdQr = signal<any>(null);

  // ===== BULK QR =====
  bulkCount = 10;
  bulkLoading = signal(false);
  bulkResult = signal<any[]>([]);
  progress = signal(0);

  constructor(private api: ApiService) {}

  // =========================
  // SINGLE QR
  // =========================
  createQr(): void {
    this.loading.set(true);
    this.error.set('');
    this.createdQr.set(null);

    this.api.createQr().subscribe({
      next: res => {
        this.createdQr.set(res.data);
        this.loading.set(false);
      },
      error: err => {
        this.error.set(err?.error?.message || 'Failed to create QR');
        this.loading.set(false);
      }
    });
  }

  downloadQr(): void {
    const qr = this.createdQr();
    if (!qr) return;

    const link = document.createElement('a');
    link.href = qr.qrImageDataUrl;
    link.download = `${qr.qrId}.png`;
    link.click();
  }

  // =========================
  // BULK QR
  // =========================
  createBulk(): void {
    if (this.bulkCount < 1 || this.bulkCount > 500) {
      alert('Enter count between 1 and 500');
      return;
    }

    this.bulkLoading.set(true);
    this.progress.set(0);
    this.bulkResult.set([]);

    this.api.bulkCreateQr(this.bulkCount).subscribe({
      next: res => {
        this.bulkResult.set(res.data);
        this.bulkLoading.set(false);
        this.progress.set(100);
      },
      error: err => {
        alert(err?.error?.message || 'Bulk generation failed');
        this.bulkLoading.set(false);
      }
    });
  }

  // =========================
  // ZIP DOWNLOAD
  // =========================
  downloadZip(): void {
    const data = this.bulkResult();
    if (!data.length) return;

    const zip = new JSZip();

    data.forEach(qr => {
      const base64 = qr.qrImageDataUrl.split(',')[1];
      zip.file(`${qr.qrId}.png`, base64, { base64: true });
    });

    zip.generateAsync({ type: 'blob' }).then(blob => {
      saveAs(blob, 'bulk-qrs.zip');
    });
  }

  // =========================
  // CSV EXPORT
  // =========================
  downloadCSV(): void {
    const data = this.bulkResult();
    if (!data.length) return;

    const csv =
      'QR ID,Activation Link\n' +
      data.map(qr => `${qr.qrId},${qr.activationLink}`).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'bulk-qrs.csv');
  }

  // =========================
  // PRINT SHEET (A4)
  // =========================
  printSheet(): void {
    const data = this.bulkResult();
    if (!data.length) return;

    const html = `
      <html>
      <head>
        <title>Print QR</title>
        <style>
          body { margin:0; font-family: Arial; }
          .grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            padding: 10px;
          }
          .item {
            text-align: center;
            border: 1px dashed #ccc;
            padding: 10px;
          }
          img {
            width: 120px;
          }
          p {
            font-size: 10px;
            word-break: break-all;
          }
        </style>
      </head>
      <body>
        <div class="grid">
          ${data.map(qr => `
            <div class="item">
              <img src="${qr.qrImageDataUrl}" />
              <p>${qr.qrId}</p>
            </div>
          `).join('')}
        </div>
      </body>
      </html>
    `;

    const win = window.open('', '_blank');
    win?.document.write(html);
    win?.document.close();
    win?.print();
  }
}