import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface ProfileHubView {
  profile: {
    customerId: string;
    fullName: string;
    email: string;
    phone: string;
    gender?: string;
    birthday?: string | null;
    avatarUrl?: string;
  };
  defaultAddress: {
    addressId: string;
    recipientName: string;
    phone: string;
    fullAddress: string;
    isDefault: boolean;
  } | null;
}

export interface CustomerAddressRecord {
  _id: string;
  recipient_name?: string;
  phone?: string;
  address_line_1?: string;
  address_line_2?: string;
  ward?: string;
  district?: string;
  city?: string;
  country_code?: string;
  postal_code?: string;
  is_default_shipping?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AccountHubService {
  private readonly apiUrl = 'http://localhost:5000/api/account';

  constructor(private readonly http: HttpClient) {}

  getProfileHub(): Observable<ProfileHubView | null> {
    return this.http.get<any>(`${this.apiUrl}/profile-hub`).pipe(
      map((res) => (res?.data || null) as ProfileHubView | null),
      catchError(() => of(null))
    );
  }

  getAddresses(): Observable<CustomerAddressRecord[]> {
    return this.http.get<any>(`${this.apiUrl}/addresses`).pipe(
      map((res) => (Array.isArray(res?.data) ? res.data : []) as CustomerAddressRecord[]),
      catchError(() => of([]))
    );
  }
}
