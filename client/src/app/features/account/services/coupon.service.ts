import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface CouponMeView {
  count: number;
  summary?: {
    total: number;
    usable: number;
    expiringSoon: number;
    used: number;
    expired: number;
  };
  items?: CouponWalletItem[];
}

export interface CouponWalletItem {
  _id: string;
  customerCouponId: string;
  couponId: string;
  couponCode: string;
  couponStatus: string;
  ownershipStatus: 'saved' | 'used' | 'expired';
  isUsed: boolean;
  isExpired: boolean;
  expiringSoon: boolean;
  savedAt?: string;
  usedAt?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
  minOrderAmount: number;
  discountLabel: string;
  promotionName: string;
  discountType: 'percentage' | 'fixed' | 'free_shipping';
  discountValue: number;
}

export interface CouponAvailableItem {
  _id: string;
  couponCode: string;
  minOrderAmount: number;
  validTo?: string | null;
  discountType: 'percentage' | 'fixed' | 'free_shipping';
  discountValue: number;
  promotionName: string;
  isSaved: boolean;
}

export interface CouponApplyResult {
  couponId: string;
  couponCode: string;
  discountAmount: number;
  orderAmount: number;
  finalAmount: number;
}

@Injectable({ providedIn: 'root' })
export class CouponService {
  private readonly api = 'http://localhost:5000/api/coupons';

  constructor(private readonly http: HttpClient) {}

  getMe(): Observable<CouponMeView | null> {
    return this.http.get<any>(`${this.api}/me`).pipe(
      map((res) => (res?.data || null) as CouponMeView),
      catchError(() => of(null))
    );
  }

  getAvailable(): Observable<CouponAvailableItem[]> {
    return this.http.get<any>(`${this.api}/available`).pipe(
      map((res) => (Array.isArray(res?.data) ? res.data : []) as CouponAvailableItem[]),
      catchError(() => of([]))
    );
  }

  saveCoupon(couponId: string): Observable<{ success: boolean; alreadySaved?: boolean }> {
    return this.http.post<any>(`${this.api}/save/${couponId}`, {}).pipe(
      map((res) => ({ success: !!res?.success, alreadySaved: !!res?.data?.alreadySaved })),
      catchError(() => of({ success: false }))
    );
  }

  applyCoupon(couponCode: string, orderAmount: number): Observable<CouponApplyResult | null> {
    return this.http.post<any>(`${this.api}/apply`, { couponCode, orderAmount }).pipe(
      map((res) => (res?.data || null) as CouponApplyResult),
      catchError(() => of(null))
    );
  }
}
