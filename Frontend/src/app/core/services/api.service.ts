import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

import {
  CustomerRegistrationResponse,
  DashboardResponse,
  EmergencyResponse,
  OtpSendResponse,
  QrItem,
  QrStatusResponse
} from '../../shared/models/api.models';

export interface WarrantyFilterParams {
  search?: string;
  startDate?: string;
  endDate?: string;
  month?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  // -------------------------
  // Admin Dashboard
  // -------------------------

  getDashboard() {
    return this.http.get<DashboardResponse>(`${this.baseUrl}/admin/dashboard`);
  }

  // -------------------------
  // Admin QR Management
  // -------------------------

  createQr() {
    return this.http.post<{ message: string; data: QrItem }>(
      `${this.baseUrl}/admin/create-qr`,
      {}
    );
  }

  bulkCreateQr(count: number) {
    return this.http.post<{
      message: string;
      count: number;
      data: any[];
    }>(`${this.baseUrl}/admin/create-qr-bulk`, { count });
  }

  getQrList(search?: string) {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.http.get<QrItem[]>(`${this.baseUrl}/admin/qr-list${query}`);
  }

  getQrById(id: string) {
    return this.http.get<{
      qr: any;
      customer: any;
      contacts: { contacts: any[] } | null;
    }>(`${this.baseUrl}/admin/qr/${id}`);
  }

  blockQr(id: string, reason: string) {
    return this.http.patch<{ message: string; data: any }>(
      `${this.baseUrl}/admin/qr/${id}/block`,
      { reason }
    );
  }

  unblockQr(id: string) {
    return this.http.patch<{ message: string; data: any }>(
      `${this.baseUrl}/admin/qr/${id}/unblock`,
      {}
    );
  }

  resetQr(id: string) {
    return this.http.patch<{ message: string; data: any }>(
      `${this.baseUrl}/admin/qr/${id}/reset`,
      {}
    );
  }

  // -------------------------
  // Public QR / OTP Flow
  // -------------------------

  getQrStatus(qrId: string) {
    return this.http.get<QrStatusResponse>(
      `${this.baseUrl}/public/qr/${qrId}/status`
    );
  }

  sendOtp(qrId: string, mobile: string) {
    return this.http.post<OtpSendResponse>(`${this.baseUrl}/public/otp/send`, {
      qrId,
      mobile
    });
  }

  verifyOtp(qrId: string, mobile: string, otp: string) {
    return this.http.post<{
      success?: boolean;
      message: string;
      qrId: string;
      mobile: string;
      verified: boolean;
    }>(`${this.baseUrl}/public/otp/verify`, {
      qrId,
      mobile,
      otp
    });
  }

  // -------------------------
  // Public Warranty Flow
  // -------------------------

  registerWarranty(payload: any) {
    return this.http.post<{
      success: boolean;
      message: string;
      data: {
        qrId: string;
        warrantyStatus: string;
        emergencyStatus: string;
      };
    }>(`${this.baseUrl}/warranty/register`, payload);
  }

  getWarrantyBasic(qrId: string) {
    return this.http.get<{
      success: boolean;
      data: {
        qrId: string;
        customerName: string;
        mobileNumber: string;
        vehicleName: string;
        chassisNumber: string;
        motorNumber: string;
        showroomName: string;
        emergencyStatus: string;
      };
    }>(`${this.baseUrl}/warranty/basic/${encodeURIComponent(qrId)}`);
  }

  // -------------------------
  // Public Emergency Flow
  // -------------------------

  registerCustomer(payload: any) {
    return this.http.post<CustomerRegistrationResponse>(
      `${this.baseUrl}/public/register`,
      payload
    );
  }

  getEmergencyData(qrId: string) {
    return this.http.get<EmergencyResponse>(
      `${this.baseUrl}/public/emergency/${qrId}`
    );
  }

  skipEmergency(qrId: string) {
    return this.http.post<{
      success: boolean;
      message: string;
      data: {
        qrId: string;
        status: string;
        warrantyStatus: string;
        emergencyStatus: string;
      };
    }>(`${this.baseUrl}/public/emergency/skip/${qrId}`, {});
  }

  sendEmergencyAlert(qrId: string, latitude?: number, longitude?: number) {
    return this.http.post(`${this.baseUrl}/public/emergency/alert`, {
      qrId,
      latitude,
      longitude
    });
  }

  createScanLog(payload: {
    qrId: string;
    scanType: string;
    latitude?: number | null;
    longitude?: number | null;
    alertSent?: boolean;
  }) {
    return this.http.post(`${this.baseUrl}/public/scan-log`, payload);
  }

  // -------------------------
  // Admin Warranty Management
  // -------------------------

  private buildWarrantyQuery(filters?: WarrantyFilterParams): string {
    const params = new URLSearchParams();

    if (filters?.search?.trim()) {
      params.set('search', filters.search.trim());
    }

    if (filters?.startDate) {
      params.set('startDate', filters.startDate);
    }

    if (filters?.endDate) {
      params.set('endDate', filters.endDate);
    }

    if (filters?.month) {
      params.set('month', filters.month);
    }

    const query = params.toString();

    return query ? `?${query}` : '';
  }

  getWarrantyRecords(filters?: WarrantyFilterParams) {
    const query = this.buildWarrantyQuery(filters);

    return this.http.get<{
      success: boolean;
      count: number;
      data: any[];
    }>(`${this.baseUrl}/admin/warranty${query}`);
  }

  getWarrantyDetail(qrId: string) {
    return this.http.get<{
      success: boolean;
      data: any;
    }>(`${this.baseUrl}/admin/warranty/${encodeURIComponent(qrId)}`);
  }

  updateWarrantyDetail(qrId: string, payload: any) {
    return this.http.patch<{
      success: boolean;
      message: string;
      data: any;
    }>(`${this.baseUrl}/admin/warranty/${encodeURIComponent(qrId)}`, payload);
  }

  downloadWarrantyExcel(filters?: WarrantyFilterParams) {
    const query = this.buildWarrantyQuery(filters);

    return this.http.get(`${this.baseUrl}/admin/warranty/export/excel${query}`, {
      responseType: 'blob'
    });
  }

  updateQrDetails(id: string, payload: any) {
  return this.http.patch<{
    success: boolean;
    message: string;
    data: any;
  }>(`${this.baseUrl}/admin/qr/${id}/details`, payload);
}

}