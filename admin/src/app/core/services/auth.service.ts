import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, map, of, catchError } from 'rxjs';
import { TokenService } from './token.service';
import { CurrentUserService } from './current-user.service';
import { User } from '../models/user.model';
import { ApiResponse } from '../../shared/models/api-response.model';
import { environment } from '../config/environment';

interface LoginResponse {
  token: string;
  account: {
    _id: string;
    email: string;
    account_type: 'admin' | 'staff' | 'customer';
    last_login_at: string;
  };
  customer: { _id: string; customer_code: string; full_name: string } | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  private readonly currentUser = inject(CurrentUserService);
  private readonly router = inject(Router);

  /**
   * POST /api/auth/login
   * Returns JWT token + account info from real backend.
   */
  login(email: string, password: string): Observable<User> {
    // ─── Normal backend login ───
    return this.http
      .post<ApiResponse<LoginResponse>>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(
        map((res) => {
          const { token, account, customer } = res.data;
          this.tokenService.setToken(token);

          const user: User = {
            _id: account._id,
            email: account.email,
            name: customer?.full_name || account.email,
            account_type: account.account_type,
            role: account.account_type,
            last_login_at: account.last_login_at,
          };
          this.currentUser.setUser(user);
          return user;
        })
      );
  }

  logout(): void {
    this.tokenService.removeToken();
    this.currentUser.clearUser();
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return this.tokenService.hasToken();
  }

  /**
   * GET /api/auth/me — validate token and restore user session.
   * If token is invalid/expired, clears it silently.
   */
  restoreSession(): void {
    if (!this.tokenService.hasToken()) return;

    this.http
      .get<ApiResponse<{ account: any; customer: any }>>(`${environment.apiUrl}/auth/me`)
      .pipe(
        catchError(() => {
          this.tokenService.removeToken();
          return of(null);
        })
      )
      .subscribe((res) => {
        if (res?.data) {
          const { account, customer } = res.data;
          const user: User = {
            _id: account._id,
            email: account.email,
            name: customer?.full_name || account.email,
            account_type: account.account_type,
            role: account.account_type,
            last_login_at: account.last_login_at,
          };
          this.currentUser.setUser(user);
        }
      });
  }
}
