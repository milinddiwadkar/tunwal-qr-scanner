import { Component, computed, signal } from '@angular/core';
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
  success = signal('');
  createdQr = signal<any>(null);

  // ===== BULK QR =====
  bulkCount = 10;
  readonly maxBulkCount = 100;

  bulkLoading = signal(false);
  bulkError = signal('');
  bulkSuccess = signal('');
  bulkResult = signal<any[]>([]);
  progress = signal(0);

  bulkCountText = computed(() => {
    const count = this.bulkResult().length;
    return count === 1 ? '1 QR code generated' : `${count} QR codes generated`;
  });

  constructor(private api: ApiService) {}

  // =========================
  // SINGLE QR
  // =========================
  createQr(): void {
    this.loading.set(true);
    this.error.set('');
    this.success.set('');
    this.createdQr.set(null);

    this.api.createQr().subscribe({
      next: (res) => {
        this.createdQr.set(res.data);
        this.success.set('QR created successfully.');
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Failed to create QR');
        this.loading.set(false);
      }
    });
  }

  downloadQr(): void {
    const qr = this.createdQr();

    if (!qr?.qrImageDataUrl || !qr?.qrId) {
      this.error.set('QR image is not available for download.');
      return;
    }

    const link = document.createElement('a');
    link.href = qr.qrImageDataUrl;
    link.download = `${qr.qrId}.png`;
    link.click();
  }

  copyActivationLink(): void {
    const qr = this.createdQr();

    if (!qr?.activationLink) {
      this.error.set('Activation link not available.');
      return;
    }

    navigator.clipboard
      .writeText(qr.activationLink)
      .then(() => this.success.set('Activation link copied.'))
      .catch(() => this.error.set('Unable to copy activation link.'));
  }

  // =========================
  // BULK QR
  // =========================
  createBulk(): void {
    this.bulkError.set('');
    this.bulkSuccess.set('');

    const count = Number(this.bulkCount);

    if (!Number.isInteger(count) || count < 1 || count > this.maxBulkCount) {
      this.bulkError.set(`Enter quantity between 1 and ${this.maxBulkCount}.`);
      return;
    }

    this.bulkLoading.set(true);
    this.progress.set(0);
    this.bulkResult.set([]);

    this.api.bulkCreateQr(count).subscribe({
      next: (res) => {
        this.bulkResult.set(res.data || []);
        this.bulkLoading.set(false);
        this.progress.set(100);
        this.bulkSuccess.set(`${res.data?.length || 0} QR codes generated successfully.`);
      },
      error: (err) => {
        this.bulkError.set(err?.error?.message || 'Bulk generation failed');
        this.bulkLoading.set(false);
      }
    });
  }

  // =========================
  // ZIP DOWNLOAD
  // =========================
  downloadZip(): void {
    const data = this.bulkResult();

    if (!data.length) {
      this.bulkError.set('No QR data available for ZIP download.');
      return;
    }

    const zip = new JSZip();

    data.forEach((qr) => {
      if (!qr.qrImageDataUrl || !qr.qrId) return;

      const base64 = qr.qrImageDataUrl.split(',')[1];
      zip.file(`${qr.qrId}.png`, base64, { base64: true });
    });

    zip.generateAsync({ type: 'blob' }).then((blob) => {
      saveAs(blob, `bulk-qrs-${data.length}.zip`);
    });
  }

  // =========================
  // CSV EXPORT
  // =========================
  downloadCSV(): void {
    const data = this.bulkResult();

    if (!data.length) {
      this.bulkError.set('No QR data available for CSV export.');
      return;
    }

    const csv =
      'QR ID,Activation Link,Emergency Link\n' +
      data
        .map((qr) => {
          const qrId = qr.qrId || '';
          const activationLink = qr.activationLink || '';
          const emergencyLink = qr.emergencyLink || '';
          return `"${qrId}","${activationLink}","${emergencyLink}"`;
        })
        .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `bulk-qrs-${data.length}.csv`);
  }

  // =========================
  // PRINT SHEET A4
  // =========================
  printSheet(): void {
    const data = this.bulkResult();

    if (!data.length) {
      this.bulkError.set('No QR data available for printing.');
      return;
    }

    const html = `
      <html>
      <head>
        <title>Print QR Sheet</title>
        <style>
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 12px;
            font-family: Arial, sans-serif;
          }

          .title {
            text-align: center;
            margin-bottom: 12px;
          }

          .title h2 {
            margin: 0 0 4px;
            font-size: 18px;
          }

          .title p {
            margin: 0;
            font-size: 11px;
            color: #555;
          }

          .grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
          }

          .item {
            text-align: center;
            border: 1px dashed #999;
            border-radius: 8px;
            padding: 10px;
            break-inside: avoid;
          }

          img {
            width: 120px;
            height: 120px;
            object-fit: contain;
          }

          .qr-id {
            margin: 6px 0 0;
            font-size: 11px;
            font-weight: bold;
            word-break: break-all;
          }

          .note {
            margin: 4px 0 0;
            font-size: 9px;
            color: #555;
          }

          @media print {
            body {
              padding: 8px;
            }

            .item {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="title">
          <h2>Tunwal E-Motors QR Sheet</h2>
          <p>Warranty and Emergency QR Codes</p>
        </div>

        <div class="grid">
          ${data
            .map(
              (qr) => `
                <div class="item">
                  <img src="${qr.qrImageDataUrl}" />
                  <p class="qr-id">${qr.qrId}</p>
                  <p class="note">Scan to register warranty / emergency profile</p>
                </div>
              `
            )
            .join('')}
        </div>
      </body>
      </html>
    `;

    const win = window.open('', '_blank');

    if (!win) {
      this.bulkError.set('Popup blocked. Please allow popups and try again.');
      return;
    }

    win.document.write(html);
    win.document.close();

    setTimeout(() => {
      win.print();
    }, 300);
  }

  resetSingle(): void {
    this.createdQr.set(null);
    this.error.set('');
    this.success.set('');
  }

  resetBulk(): void {
    this.bulkResult.set([]);
    this.bulkError.set('');
    this.bulkSuccess.set('');
    this.progress.set(0);
    this.bulkCount = 10;
  }
}