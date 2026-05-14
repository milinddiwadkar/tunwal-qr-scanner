import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-qr-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule
  ],
  templateUrl: './qr-details.component.html',
  styleUrl: './qr-details.component.css'
})
export class QrDetailsComponent implements OnInit {
  private fb = inject(FormBuilder);

  loading = signal(true);
  saving = signal(false);
  actionLoading = signal(false);
  editMode = signal(false);

  error = signal('');
  success = signal('');
  data = signal<any>(null);

  qrDbId = '';

  bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Not Sure'];

  form = this.fb.group({
    customerName: ['', Validators.required],
    mobileNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    email: [''],
    bloodGroup: [''],
    disease: [''],
    address: [''],

    vehicleName: [''],
    chassisNumber: [''],
    motorNumber: [''],
    showroomName: [''],

    contacts: this.fb.array([])
  });

  constructor(
    private route: ActivatedRoute,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  get contacts(): FormArray {
    return this.form.get('contacts') as FormArray;
  }

  createContact(contact?: any): FormGroup {
    return this.fb.group({
      name: [contact?.name || '', Validators.required],
      mobile: [
        contact?.mobile || '',
        [Validators.required, Validators.pattern(/^[0-9]{10}$/)]
      ],
      email: [contact?.email || ''],
      relation: [contact?.relation || '', Validators.required]
    });
  }

  load(): void {
    const id = this.route.snapshot.paramMap.get('id') || '';
    this.qrDbId = id;

    this.loading.set(true);
    this.error.set('');
    this.success.set('');
    this.editMode.set(false);

    this.api.getQrById(id).subscribe({
      next: (res) => {
        this.data.set(res);
        this.patchForm(res);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Failed to load QR details');
        this.loading.set(false);
      }
    });
  }

  patchForm(res: any): void {
    const customer = res?.customer || {};
    const contactList = res?.contacts?.contacts || [];

    this.form.patchValue({
      customerName: customer.customerName || '',
      mobileNumber: customer.mobileNumber || '',
      email: customer.email || '',
      bloodGroup: customer.bloodGroup || '',
      disease: customer.disease || '',
      address: customer.address || '',

      vehicleName: customer.vehicleName || '',
      chassisNumber: customer.chassisNumber || '',
      motorNumber: customer.motorNumber || '',
      showroomName: customer.showroomName || ''
    });

    while (this.contacts.length > 0) {
      this.contacts.removeAt(0);
    }

    if (contactList.length) {
      contactList.forEach((contact: any) => {
        this.contacts.push(this.createContact(contact));
      });
    } else {
      this.contacts.push(this.createContact());
      this.contacts.push(this.createContact());
      this.contacts.push(this.createContact());
    }

    while (this.contacts.length < 3) {
      this.contacts.push(this.createContact());
    }

    while (this.contacts.length > 3) {
      this.contacts.removeAt(this.contacts.length - 1);
    }
  }

  enableEdit(): void {
    this.error.set('');
    this.success.set('');
    this.editMode.set(true);
  }

  cancelEdit(): void {
    const current = this.data();

    if (current) {
      this.patchForm(current);
    }

    this.editMode.set(false);
    this.error.set('');
    this.success.set('');
  }

  saveChanges(): void {
    const qr = this.data()?.qr;

    if (!qr?._id) {
      this.error.set('QR record missing.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Please fill required fields correctly.');
      return;
    }

    this.saving.set(true);
    this.error.set('');
    this.success.set('');

    const raw = this.form.getRawValue();

    const payload = {
      customerName: raw.customerName,
      mobileNumber: raw.mobileNumber,
      email: raw.email || '',
      bloodGroup: raw.bloodGroup || '',
      disease: raw.disease || '',
      address: raw.address || '',

      vehicleName: raw.vehicleName || '',
      chassisNumber: raw.chassisNumber || '',
      motorNumber: raw.motorNumber || '',
      showroomName: raw.showroomName || '',

      contacts: raw.contacts
    };

    this.api.updateQrDetails(qr._id, payload).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.editMode.set(false);
        this.success.set(res.message || 'QR details updated successfully.');
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.message || 'Failed to update QR details.');
      }
    });
  }

  blockQr(): void {
    const qr = this.data()?.qr;
    if (!qr?._id) return;

    const reason = prompt('Enter block reason') || '';
    if (!reason.trim()) return;

    this.actionLoading.set(true);
    this.error.set('');
    this.success.set('');

    this.api.blockQr(qr._id, reason.trim()).subscribe({
      next: (res) => {
        this.success.set(res.message || 'QR blocked successfully');
        this.actionLoading.set(false);
        this.load();
      },
      error: (err) => {
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
      next: (res) => {
        this.success.set(res.message || 'QR unblocked successfully');
        this.actionLoading.set(false);
        this.load();
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Failed to unblock QR');
        this.actionLoading.set(false);
      }
    });
  }

  getStatusClass(status: string | undefined): string {
    const value = String(status || '').toLowerCase();

    if (value === 'active') return 'status-active';
    if (value === 'blocked') return 'status-blocked';
    if (value === 'inactive') return 'status-inactive';
    if (value === 'otp_pending') return 'status-pending';

    return 'status-default';
  }
}