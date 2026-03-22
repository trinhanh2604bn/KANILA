import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, switchMap } from 'rxjs';
import { Coupon, CreateCouponPayload, UpdateCouponPayload, CouponStatus, DiscountType } from '../models/coupon.model';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { environment } from '../../../core/config/environment';

const URL = `${environment.apiUrl}/coupons`;

@Injectable({ providedIn: 'root' })
export class CouponsApiService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<Coupon[]> {
    return this.http.get<ApiResponse<any[]>>(URL).pipe(
      map(res => res.data.map(c => this.mapCoupon(c)))
    );
  }

  getById(id: string): Observable<Coupon> {
    return this.http.get<ApiResponse<any>>(`${URL}/${id}`).pipe(
      map(res => this.mapCoupon(res.data))
    );
  }

  create(data: CreateCouponPayload): Observable<Coupon> {
    return this.http.post<ApiResponse<any>>(URL, data).pipe(
      map(res => this.mapCoupon(res.data))
    );
  }

  update(id: string, data: UpdateCouponPayload): Observable<Coupon> {
    return this.http.put<ApiResponse<any>>(`${URL}/${id}`, data).pipe(
      map(res => this.mapCoupon(res.data))
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<ApiResponse<any>>(`${URL}/${id}`).pipe(
      map(() => void 0)
    );
  }

  toggleStatus(id: string): Observable<Coupon> {
    return this.getById(id).pipe(
      switchMap(coupon => {
        const newStatus = coupon.couponStatus === 'active' ? 'inactive' : 'active';
        return this.update(id, { couponStatus: newStatus });
      })
    );
  }

  private mapCoupon(raw: any): Coupon {
    const now = new Date();
    const validFromVal = raw.valid_from || raw.validFrom || null;
    const validToVal = raw.valid_to || raw.validTo || null;
    const validFrom = validFromVal ? new Date(validFromVal) : null;
    const validTo = validToVal ? new Date(validToVal) : null;
    const couponStatus = raw.coupon_status || raw.couponStatus || 'active';
    const isActive = couponStatus === 'active';

    let status: CouponStatus = 'inactive';
    if (!isActive) {
      status = 'inactive';
    } else if (validTo && validTo < now) {
      status = 'expired';
    } else if (validFrom && validFrom > now) {
      status = 'scheduled';
    } else {
      status = 'active';
    }

    // promotionId may be populated object or raw string/buffer
    const promoObj = (raw.promotion_id && typeof raw.promotion_id === 'object') ? raw.promotion_id
      : (raw.promotionId && typeof raw.promotionId === 'object') ? raw.promotionId
      : {};

    return {
      id: raw._id || '',
      promotionId: typeof promoObj === 'string' ? promoObj : (promoObj._id || raw.promotion_id || raw.promotionId || ''),
      couponCode: raw.coupon_code || raw.couponCode || '',
      validFrom: validFromVal,
      validTo: validToVal,
      usageLimitTotal: raw.usage_limit_total ?? raw.usageLimitTotal ?? 0,
      usageLimitPerCustomer: raw.usage_limit_per_customer ?? raw.usageLimitPerCustomer ?? 0,
      minOrderAmount: raw.min_order_amount ?? raw.minOrderAmount ?? 0,
      couponStatus: couponStatus,
      createdAt: raw.created_at || raw.createdAt || '',
      updatedAt: raw.updated_at || raw.updatedAt || '',
      discountType: (promoObj.discount_type || promoObj.discountType || 'percentage') as DiscountType,
      discountValue: promoObj.discount_value ?? promoObj.discountValue ?? 0,
      promotionName: promoObj.promotion_name || promoObj.promotionName || '',
      promotionCode: promoObj.promotion_code || promoObj.promotionCode || '',
      status,
      usedCount: 0,
    };
  }
}
