import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface CouponMeView {
  count: number;
  items?: Array<{
    _id: string;
    redemptionStatus: string;
    redeemedAt?: string;
    couponId?: { couponCode?: string; couponStatus?: string } | null;
  }>;
}

@Injectable({ providedIn: 'root' })
export class CouponService {
  private readonly api = 'http://localhost:5000/api/coupons/me';

  constructor(private readonly http: HttpClient) {}

  getMe(): Observable<CouponMeView | null> {
    return this.http.get<any>(this.api).pipe(
      map((res) => (res?.data || null) as CouponMeView),
      catchError(() => of(null))
    );
  }
}
