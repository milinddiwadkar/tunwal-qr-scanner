import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-warranty-records',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './warranty-records.component.html',
  styleUrl: './warranty-records.component.css'
})
export class WarrantyRecordsComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);

  records = signal<any[]>([]);
  loading = signal(false);
  exporting = signal(false);
  error = signal('');

  search = '';
  startDate = '';
  endDate = '';
  month = '';

  ngOnInit(): void {
    this.loadRecords();
  }

  get totalRecords(): number {
    return this.records().length;
  }

  get activeFilterText(): string {
    if (this.month) return `Month: ${this.month}`;
    if (this.startDate || this.endDate) {
      return `${this.startDate || 'Start'} to ${this.endDate || 'End'}`;
    }
    return this.search ? 'Search Applied' : 'All Records';
  }

  buildFilters() {
    return {
      search: this.search,
      startDate: this.month ? '' : this.startDate,
      endDate: this.month ? '' : this.endDate,
      month: this.month
    };
  }

  loadRecords(): void {
    this.loading.set(true);
    this.error.set('');

    this.api.getWarrantyRecords(this.buildFilters()).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.records.set(res.data || []);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Failed to load warranty records.');
      }
    });
  }

  clearFilters(): void {
    this.search = '';
    this.startDate = '';
    this.endDate = '';
    this.month = '';
    this.loadRecords();
  }

  onMonthChange(): void {
    if (this.month) {
      this.startDate = '';
      this.endDate = '';
    }
  }

  onDateRangeChange(): void {
    if (this.startDate || this.endDate) {
      this.month = '';
    }
  }

  openDetail(qrId: string): void {
    this.router.navigate(['/admin/warranty', qrId]);
  }

  exportExcel(): void {
    this.exporting.set(true);
    this.error.set('');

    this.api.downloadWarrantyExcel(this.buildFilters()).subscribe({
      next: (blob) => {
        this.exporting.set(false);

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');

        const fileSuffix = this.month
          ? this.month
          : this.startDate || this.endDate
            ? `${this.startDate || 'start'}-to-${this.endDate || 'end'}`
            : 'all';

        link.href = url;
        link.download = `warranty-records-${fileSuffix}.xlsx`;
        link.click();

        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.exporting.set(false);
        this.error.set('Excel export failed.');
      }
    });
  }
}