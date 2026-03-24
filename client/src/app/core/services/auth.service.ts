import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = 'http://localhost:5000/api/auth';
  private readonly tokenKey = 'token';
  private readonly legacyTokenKeys = ['accessToken', 'authToken'];

  constructor(private http: HttpClient) {}

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data);
  }

  // Placeholder endpoint is currently not exposed by backend auth.route.js.
  checkEmail(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/check-email`, { email });
  }

  // Placeholder endpoint is currently not exposed by backend auth.route.js.
  resetPassword(email: string, newPass: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, { email, newPass });
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, data);
  }

  getMe(): Observable<any> {
    return this.http.get(`${this.apiUrl}/me`);
  }

  setToken(token: string): void {
    const clean = String(token || '').trim().replace(/^"+|"+$/g, '');
    if (!clean) return;
    localStorage.setItem(this.tokenKey, clean);
    // Backward compatibility for older app paths that may still read legacy keys.
    this.legacyTokenKeys.forEach((key) => localStorage.setItem(key, clean));
  }

  getToken(): string | null {
    const primary = this.normalizeToken(localStorage.getItem(this.tokenKey));
    if (primary) return primary;
    for (const key of this.legacyTokenKeys) {
      const legacy = this.normalizeToken(localStorage.getItem(key));
      if (legacy) return legacy;
    }
    return null;
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.legacyTokenKeys.forEach((key) => localStorage.removeItem(key));
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    const payload = this.decodeJwtPayload(token);
    const exp = Number(payload?.['exp'] || 0);
    if (exp > 0 && exp * 1000 <= Date.now()) return false;
    return true;
  }

  isCustomerAccountFromToken(): boolean {
    const accountType = this.getAccountTypeFromToken();
    return accountType === 'customer';
  }

  getAccountTypeFromToken(): string {
    const payload = this.decodeJwtPayload(this.getToken());
    return String(payload?.['account_type'] || payload?.['accountType'] || '').toLowerCase();
  }

  private decodeJwtPayload(token: string | null): Record<string, any> | null {
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length < 2 || !parts[1]) return null;
      const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
      const raw = atob(padded);
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  private normalizeToken(value: string | null): string | null {
    const token = String(value || '').trim().replace(/^"+|"+$/g, '');
    return token || null;
  }
}