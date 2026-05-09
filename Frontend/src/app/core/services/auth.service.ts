import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AdminLoginResponse } from '../../shared/models/api.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly tokenKey = 'admin_token';
  private readonly adminKey = 'admin_user';

  private readonly tokenSignal = signal<string | null>(localStorage.getItem(this.tokenKey));

  readonly isLoggedIn = computed(() => !!this.tokenSignal());
  readonly token = computed(() => this.tokenSignal());

  constructor(private http: HttpClient) {}

  login(email: string, password: string) {
    return this.http
      .post<AdminLoginResponse>(`${environment.apiBaseUrl}/admin/login`, { email, password })
      .pipe(
        tap(res => {
          localStorage.setItem(this.tokenKey, res.token);
          localStorage.setItem(this.adminKey, JSON.stringify(res.admin));
          this.tokenSignal.set(res.token);
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.adminKey);
    this.tokenSignal.set(null);
  }

  getToken(): string | null {
    return this.tokenSignal();
  }
}