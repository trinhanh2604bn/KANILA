import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, switchMap } from 'rxjs';
import {
  Promotion,
  CreatePromotionPayload,
  UpdatePromotionPayload,
  PromotionStatus,
  DiscountType,
  ApplicableScope,
} from '../models/promotion.model';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { environment } from '../../../core/config/environment';

const URL = `${environment.apiUrl}/promotions`;

@Injectable({ providedIn: 'root' })
export class PromotionsApiService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<Promotion[]> {
    return this.http.get<ApiResponse<any[]>>(URL).pipe(
      map(res => res.data.map(p => this.mapPromotion(p)))
    );
  }

  getById(id: string): Observable<Promotion> {
    return this.http.get<ApiResponse<any>>(`${URL}/${id}`).pipe(
      map(res => this.mapPromotion(res.data))
    );
  }

  create(data: CreatePromotionPayload): Observable<Promotion> {
    return this.http.post<ApiResponse<any>>(URL, data).pipe(
      map(res => this.mapPromotion(res.data))
    );
  }

  update(id: string, data: UpdatePromotionPayload): Observable<Promotion> {
    return this.http.put<ApiResponse<any>>(`${URL}/${id}`, data).pipe(
      map(res => this.mapPromotion(res.data))
    );
  }

  delete(id: string): Observable<Promotion> {
    return this.http.delete<ApiResponse<any>>(`${URL}/${id}`).pipe(
      map(res => this.mapPromotion(res.data))
    );
  }

  /** Toggle active/inactive. Uses DB `promotionStatus` (not computed `status` e.g. scheduled). */
  toggleStatus(id: string): Observable<Promotion> {
    return this.getById(id).pipe(
      switchMap((promo) => {
        const dbActive = promo.promotionStatus === 'active';
        const newStatus: PromotionStatus = dbActive ? 'inactive' : 'active';
        return this.http.patch<ApiResponse<any>>(`${URL}/${id}`, { promotionStatus: newStatus }).pipe(
          map((res) => this.mapPromotion(res.data))
        );
      })
    );
  }

  /** Duplicate a promotion as a draft copy (unique promotionCode required by API). */
  duplicate(id: string): Observable<Promotion> {
    return this.getById(id).pipe(
      switchMap((promo) => {
        const baseCode = (promo.promotionCode || 'PROMO').replace(/-CPY-[A-Z0-9]+$/i, '').replace(/-COPY.*$/i, '');
        const uniqueSuffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
        let newCode = `${baseCode}-CPY-${uniqueSuffix}`.replace(/[^A-Z0-9_-]/gi, '_');
        if (newCode.length > 48) newCode = newCode.slice(0, 48);

        const startAt = promo.startAt || new Date().toISOString();

        const payload: CreatePromotionPayload = {
          promotionName: `${promo.promotionName} (Copy)`,
          promotionCode: newCode,
          description: promo.description || '',
          promotionType: promo.promotionType || 'seasonal',
          discountType: promo.discountType || 'percentage',
          discountValue: promo.discountValue ?? 0,
          maxDiscountAmount: promo.maxDiscountAmount ?? 0,
          startAt,
          endAt: promo.endAt || undefined,
          usageLimitTotal: promo.usageLimitTotal ?? 0,
          usageLimitPerCustomer: promo.usageLimitPerCustomer ?? 0,
          isAutoApply: promo.isAutoApply ?? false,
          promotionStatus: 'draft',
        };
        return this.create(payload);
      })
    );
  }

  private mapPromotion(raw: any): Promotion {
    const now = new Date();
    const startAtValue = raw.start_at ?? raw.startAt;
    const endAtValue = raw.end_at ?? raw.endAt ?? null;

    const promotionName = raw.promotion_name || raw.promotionName || '';
    const promotionCode = raw.promotion_code || raw.promotionCode || '';
    const promotionType = raw.promotion_type || raw.promotionType || 'general';
    const discountType = this.normalizeDiscountType(raw) as DiscountType;
    const discountValue = raw.discount_value ?? raw.discountValue ?? 0;
    const maxDiscountAmount = raw.max_discount_amount ?? raw.maxDiscountAmount ?? 0;
    const promotionStatus = (raw.promotion_status || raw.promotionStatus || 'draft') as PromotionStatus;
    const usageLimitTotal = raw.usage_limit_total ?? raw.usageLimitTotal ?? 0;
    const usageLimitPerCustomer = raw.usage_limit_per_customer ?? raw.usageLimitPerCustomer ?? 0;
    const isAutoApply = raw.is_auto_apply ?? raw.isAutoApply ?? false;
    const priority = raw.priority ?? 0;
    const stackableFlag = raw.stackable_flag ?? raw.stackableFlag ?? false;

    const startDateObj = startAtValue ? new Date(startAtValue) : null;
    const endDateObj = endAtValue ? new Date(endAtValue) : null;

    // Compute effective UI status
    let status: PromotionStatus = promotionStatus;
    if (status === 'active' && endDateObj && endDateObj < now) {
      status = 'expired';
    } else if (status === 'active' && startDateObj && startDateObj > now) {
      status = 'scheduled';
    } else if (status === 'draft' && startDateObj && startDateObj > now) {
      status = 'scheduled';
    }

    return {
      id: String(raw._id ?? ''),
      promotionCode,
      promotionName,
      description: raw.description || '',
      promotionType,
      discountType,
      discountValue,
      maxDiscountAmount,
      startAt: startAtValue || '',
      endAt: endAtValue,
      usageLimitTotal,
      usageLimitPerCustomer,
      isAutoApply,
      priority,
      stackableFlag,
      promotionStatus,
      createdByAccountId: raw.created_by_account_id || raw.createdByAccountId || null,
      createdAt: raw.created_at || raw.createdAt || '',
      updatedAt: raw.updated_at || raw.updatedAt || '',
      status,
      type: discountType,
      usageCount: 0,
      // Backward-compatible aliases for existing templates
      name: promotionName,
      startDate: startAtValue || '',
      endDate: endAtValue,
      usageLimit: usageLimitTotal,
      applicableScope: 'all' as ApplicableScope,
      minOrderValue: 0,
      perCustomerLimit: usageLimitPerCustomer,
    };
  }

  /** Map API / legacy values to UI discount types. */
  private normalizeDiscountType(raw: any): DiscountType {
    const d = String(raw.discount_type || raw.discountType || '')
      .toLowerCase()
      .trim();
    if (d === 'percentage' || d === 'percent') return 'percentage';
    if (d === 'fixed' || d === 'amount') return 'fixed';
    if (d === 'free_shipping' || d === 'freeshipping' || d === 'shipping_free') return 'free_shipping';

    const dv = Number(raw.discount_value ?? raw.discountValue ?? 0);
    const pt = String(raw.promotion_type || raw.promotionType || '').toLowerCase();
    const name = String(raw.promotion_name || raw.promotionName || '').toLowerCase();

    if (pt.includes('shipping') && dv === 0) return 'free_shipping';
    if (name.includes('miễn phí') && name.includes('vận chuyển')) return 'free_shipping';

    if (dv > 100) return 'fixed';
    if (dv > 0 && dv <= 100) return 'percentage';
    return 'percentage';
  }
}
