import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { EmergencyResponse } from '../../../shared/models/api.models';

@Component({
  selector: 'app-emergency',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './emergency.component.html',
  styleUrl: './emergency.component.css'
})
export class EmergencyComponent implements OnInit {
  qrId = '';
  loading = signal(true);
  alerting = signal(false);
  locatingHospital = signal(false);

  error = signal('');
  data = signal<EmergencyResponse | null>(null);
  alertMessage = signal('');
  emergencyTriggered = signal(true);

  constructor(
    private route: ActivatedRoute,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.qrId = this.route.snapshot.paramMap.get('qrId') || '';
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');

    this.api.getEmergencyData(this.qrId).subscribe({
      next: res => {
        this.data.set(res);
        this.loading.set(false);
        this.alertMessage.set(`An Emergency Alert has been sent to ${res.owner.customerName}'s contacts`);
      },
      error: err => {
        this.error.set(err?.error?.message || 'Failed to load emergency data');
        this.loading.set(false);
      }
    });
  }

  sendAlert(): void {
    this.alerting.set(true);
    this.error.set('');

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          this.api
            .sendEmergencyAlert(
              this.qrId,
              position.coords.latitude,
              position.coords.longitude
            )
            .subscribe({
              next: () => {
                this.alerting.set(false);
                const name = this.data()?.owner?.customerName || 'owner';
                this.alertMessage.set(`An Emergency Alert has been sent to ${name}'s contacts`);
              },
              error: err => {
                this.alerting.set(false);
                this.error.set(err?.error?.message || 'Failed to send alert');
              }
            });
        },
        () => {
          this.api.sendEmergencyAlert(this.qrId).subscribe({
            next: () => {
              this.alerting.set(false);
              const name = this.data()?.owner?.customerName || 'owner';
              this.alertMessage.set(`An Emergency Alert has been sent to ${name}'s contacts`);
            },
            error: err => {
              this.alerting.set(false);
              this.error.set(err?.error?.message || 'Failed to send alert');
            }
          });
        }
      );
    } else {
      this.api.sendEmergencyAlert(this.qrId).subscribe({
        next: () => {
          this.alerting.set(false);
          const name = this.data()?.owner?.customerName || 'owner';
          this.alertMessage.set(`An Emergency Alert has been sent to ${name}'s contacts`);
        },
        error: err => {
          this.alerting.set(false);
          this.error.set(err?.error?.message || 'Failed to send alert');
        }
      });
    }
  }

  findNearbyHospital(): void {
    this.locatingHospital.set(true);
    const ownerAddress = this.data()?.owner?.address || '';

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          this.locatingHospital.set(false);
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          window.open(`https://www.google.com/maps/search/hospital/@${lat},${lng},15z`, '_blank');
        },
        () => {
          this.locatingHospital.set(false);
          if (ownerAddress) {
            window.open(
              `https://www.google.com/maps/search/hospital+near+${encodeURIComponent(ownerAddress)}`,
              '_blank'
            );
          } else {
            window.open('https://www.google.com/maps/search/hospital', '_blank');
          }
        }
      );
    } else {
      this.locatingHospital.set(false);
      if (ownerAddress) {
        window.open(
          `https://www.google.com/maps/search/hospital+near+${encodeURIComponent(ownerAddress)}`,
          '_blank'
        );
      } else {
        window.open('https://www.google.com/maps/search/hospital', '_blank');
      }
    }
  }

  get primaryContact() {
    return this.data()?.emergencyContacts?.[0] || null;
  }
}