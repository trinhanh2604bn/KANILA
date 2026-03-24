import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

interface ApiResponse<T> {
  success?: boolean;
  data?: T;
}

export interface ProductOptionRow {
  _id: string;
  productId: string | { _id?: string };
  optionName: string;
}

export interface ProductOptionValueRow {
  _id: string;
  productOptionId: string | { _id?: string; optionName?: string };
  optionValue: string;
}

export interface ProductVariantRow {
  _id: string;
  productId: string | { _id?: string };
  volumeMl?: number;
  weightGrams?: number;
}

export interface ReviewSummaryRow {
  _id: string;
  productId: string | { _id?: string };
  averageRating?: number;
}

export interface InventoryBalanceRow {
  _id: string;
  variantId: string | { _id?: string; productId?: string | { _id?: string } };
  availableQty?: number;
}

export interface PromotionRow {
  _id: string;
  promotionStatus?: 'active' | 'inactive' | 'draft';
  startAt?: string;
  endAt?: string | null;
}

@Injectable({ providedIn: 'root' })
export class CatalogFacetService {
  constructor(private readonly http: HttpClient) {}

  getProductOptions(): Observable<ProductOptionRow[]> {
    return this.http
      .get<ApiResponse<ProductOptionRow[]>>('http://localhost:5000/api/product-options')
      .pipe(map((res) => res.data ?? []));
  }

  getProductOptionValues(): Observable<ProductOptionValueRow[]> {
    return this.http
      .get<ApiResponse<ProductOptionValueRow[]>>('http://localhost:5000/api/product-option-values')
      .pipe(map((res) => res.data ?? []));
  }

  getProductVariants(): Observable<ProductVariantRow[]> {
    return this.http
      .get<ApiResponse<ProductVariantRow[]>>('http://localhost:5000/api/product-variants')
      .pipe(map((res) => res.data ?? []));
  }

  getReviewSummaries(): Observable<ReviewSummaryRow[]> {
    return this.http
      .get<ApiResponse<ReviewSummaryRow[]>>('http://localhost:5000/api/review-summary')
      .pipe(map((res) => res.data ?? []));
  }

  getInventoryBalances(): Observable<InventoryBalanceRow[]> {
    return this.http
      .get<ApiResponse<InventoryBalanceRow[]>>('http://localhost:5000/api/inventory-balances')
      .pipe(map((res) => res.data ?? []));
  }

  getActivePromotions(): Observable<PromotionRow[]> {
    return this.http
      .get<ApiResponse<PromotionRow[]>>('http://localhost:5000/api/promotions')
      .pipe(
        map((res) => res.data ?? []),
        map((rows) => {
          const now = Date.now();
          return rows.filter((p) => {
            if (p.promotionStatus !== 'active') return false;
            const start = p.startAt ? new Date(p.startAt).getTime() : now;
            const end = p.endAt ? new Date(p.endAt).getTime() : Number.POSITIVE_INFINITY;
            return start <= now && now <= end;
          });
        })
      );
  }
}
