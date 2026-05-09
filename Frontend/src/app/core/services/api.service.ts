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

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getDashboard() {
    return this.http.get<DashboardResponse>(`${this.baseUrl}/admin/dashboard`);
  }

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
    return this.http.post(`${this.baseUrl}/public/otp/verify`, {
      qrId,
      mobile,
      otp
    });
  }

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

  sendEmergencyAlert(qrId: string, latitude?: number, longitude?: number) {
    return this.http.post(`${this.baseUrl}/public/emergency/alert`, {
      qrId,
      latitude,
      longitude
    });
  }

  registerWarranty(payload: any) {
    return this.http.post<any>(`${this.baseUrl}/warranty/register`, payload);
  }

  skipEmergency(qrId: string) {
    return this.http.post<any>(
      `${this.baseUrl}/public/emergency/skip/${qrId}`,
      {}
    );
  }

  getWarrantyRecords(search: string = '') {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.http.get<any>(`${this.baseUrl}/admin/warranty${query}`);
  }

  getWarrantyDetail(qrId: string) {
    return this.http.get<any>(`${this.baseUrl}/admin/warranty/${qrId}`);
  }

  downloadWarrantyExcel() {
    return this.http.get(`${this.baseUrl}/admin/warranty/export/excel`, {
      responseType: 'blob'
    });
  }
}