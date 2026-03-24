import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface CustomerProfileView {
  customerId: string;
  full_name: string;
  email: string;
  phone: string;
  gender: string;
  birthday: string | null;
  avatar_url: string;
}

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly api = 'http://localhost:5000/api/customer/me';

  constructor(private readonly http: HttpClient) {}

  getMe(): Observable<CustomerProfileView | null> {
    return this.http.get<any>(this.api).pipe(
      map((res) => (res?.data || null) as CustomerProfileView),
      catchError(() => of(null))
    );
  }
}
