import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface AddressItemView {
  _id: string;
  recipient_name: string;
  phone: string;
  address_line_1: string;
  district: string;
  city: string;
  is_default_shipping?: boolean;
  is_default_billing?: boolean;
}

export interface AddressMeView {
  addresses: AddressItemView[];
  defaultAddress: AddressItemView | null;
}

@Injectable({ providedIn: 'root' })
export class AddressService {
  private readonly api = 'http://localhost:5000/api/addresses/me';

  constructor(private readonly http: HttpClient) {}

  getMe(): Observable<AddressMeView | null> {
    return this.http.get<any>(this.api).pipe(
      map((res) => (res?.data || null) as AddressMeView),
      catchError(() => of(null))
    );
  }
}
