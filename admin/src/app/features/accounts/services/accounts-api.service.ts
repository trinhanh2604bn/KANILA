import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, switchMap } from 'rxjs';
import { Account, CreateAccountPayload, UpdateAccountPayload } from '../models/account.model';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { environment } from '../../../core/config/environment';

const URL = `${environment.apiUrl}/accounts`;

@Injectable({ providedIn: 'root' })
export class AccountsApiService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<Account[]> {
    return this.http.get<ApiResponse<any[]>>(URL).pipe(
      map(res => res.data.map(a => this.mapAccount(a)))
    );
  }

  getById(id: string): Observable<Account> {
    return this.http.get<ApiResponse<any>>(`${URL}/${id}`).pipe(
      map(res => this.mapAccount(res.data))
    );
  }

  create(payload: CreateAccountPayload): Observable<Account> {
    return this.http.post<ApiResponse<any>>(URL, payload).pipe(
      map(res => this.mapAccount(res.data))
    );
  }

  update(id: string, payload: UpdateAccountPayload): Observable<Account> {
    return this.http.put<ApiResponse<any>>(`${URL}/${id}`, payload).pipe(
      map(res => this.mapAccount(res.data))
    );
  }

  toggleStatus(id: string): Observable<Account> {
    return this.http.get<ApiResponse<any>>(`${URL}/${id}`).pipe(
      switchMap((res) => {
        const current = res.data.account_status as Account['account_status'];
        const next: Account['account_status'] =
          current === 'active' ? 'inactive' : 'active';
        return this.update(id, { account_status: next });
      })
    );
  }

  lockAccount(id: string): Observable<Account> {
    return this.update(id, { account_status: 'locked' } as any);
  }

  unlockAccount(id: string): Observable<Account> {
    return this.update(id, { account_status: 'active' } as any);
  }

  private mapAccount(raw: any): Account {
    return {
      id: raw._id,
      email: raw.email,
      username: raw.username || raw.email,
      phone: raw.phone || '',
      account_type: raw.account_type,
      account_status: raw.account_status,
      roleId: '',
      roleName: raw.account_type,
      last_login_at: raw.last_login_at || undefined,
      created_at: raw.created_at,
      updated_at: raw.updated_at,
    };
  }
}
