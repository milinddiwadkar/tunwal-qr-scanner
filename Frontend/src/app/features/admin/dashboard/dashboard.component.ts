import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardResponse } from '../../../shared/models/api.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  loading = signal(true);
  error = signal('');
  data = signal<DashboardResponse | null>(null);

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');

    this.api.getDashboard().subscribe({
      next: (res) => {
        this.data.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Failed to load dashboard');
        this.loading.set(false);
      }
    });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/admin/login']);
  }

  refresh(): void {
    this.load();
  }

  get warrantyCompletionRate(): number {
    const d = this.data();

    if (!d || !d.totalQrs) {
      return 0;
    }

    const registered = d.warrantyRegistered || 0;
    return Math.round((registered / d.totalQrs) * 100);
  }

  get emergencyActivationRate(): number {
    const d = this.data();

    if (!d || !d.totalQrs) {
      return 0;
    }

    const active = d.emergencyActive || 0;
    return Math.round((active / d.totalQrs) * 100);
  }
}