import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { environment } from '../../../core/config/environment';
import { ProductVariant } from '../models/variant.model';

const BASE = `${environment.apiUrl}/product-variants`;

function isMongoId(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id);
}

@Injectable({ providedIn: 'root' })
export class ProductVariantsApiService {
  private readonly http = inject(HttpClient);

  getByProductId(productId: string): Observable<ProductVariant[]> {
    return this.http.get<ApiResponse<any[]>>(`${BASE}/product/${productId}`).pipe(
      map((res) => (res.data ?? []).map((v) => this.mapVariant(v)))
    );
  }

  create(body: {
    productId: string;
    sku: string;
    variantName: string;
    barcode?: string;
    variantStatus?: 'active' | 'inactive';
    weightGrams?: number;
    volumeMl?: number;
    costAmount?: number;
  }): Observable<ProductVariant> {
    return this.http.post<ApiResponse<any>>(BASE, body).pipe(map((res) => this.mapVariant(res.data)));
  }

  update(
    id: string,
    body: Partial<{
      productId: string;
      sku: string;
      variantName: string;
      barcode: string;
      variantStatus: 'active' | 'inactive';
      weightGrams: number;
      volumeMl: number;
      costAmount: number;
    }>
  ): Observable<ProductVariant> {
    return this.http.put<ApiResponse<any>>(`${BASE}/${id}`, body).pipe(map((res) => this.mapVariant(res.data)));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<ApiResponse<any>>(`${BASE}/${id}`).pipe(map(() => undefined));
  }

  /**
   * Deletes variants removed from the form, then creates or updates the rest.
   */
  syncForProduct(productId: string, desired: ProductVariant[], existingServer: ProductVariant[]): Observable<void> {
    const desiredMongoIds = new Set(desired.filter((v) => isMongoId(v.id)).map((v) => v.id));
    const toRemove = existingServer.filter((v) => isMongoId(v.id) && !desiredMongoIds.has(v.id));

    const delete$ =
      toRemove.length === 0
        ? of(undefined)
        : forkJoin(toRemove.map((v) => this.delete(v.id))).pipe(map(() => undefined));

    return delete$.pipe(
      switchMap(() => {
        if (desired.length === 0) return of(undefined);
        const ops = desired.map((v) => {
          const payload = {
            productId,
            sku: (v.sku ?? '').trim().toUpperCase(),
            variantName: (v.variantName ?? '').trim() || v.sku,
            barcode: v.barcode ?? '',
            variantStatus: (v.variantStatus ?? 'active') as 'active' | 'inactive',
            weightGrams: v.weightGrams ?? 0,
            volumeMl: v.volumeMl ?? 0,
            costAmount: v.costAmount ?? 0,
          };
          if (isMongoId(v.id)) {
            return this.update(v.id, payload);
          }
          return this.create({ ...payload, productId });
        });
        return forkJoin(ops).pipe(map(() => undefined));
      })
    );
  }

  private mapVariant(raw: any): ProductVariant {
    const pid = raw.productId;
    return {
      id: String(raw._id ?? raw.id ?? ''),
      productId: typeof pid === 'object' && pid?._id != null ? String(pid._id) : String(pid ?? ''),
      sku: raw.sku ?? '',
      barcode: raw.barcode ?? '',
      variantName: raw.variantName ?? '',
      variantStatus: raw.variantStatus === 'inactive' ? 'inactive' : 'active',
      weightGrams: raw.weightGrams ?? 0,
      volumeMl: raw.volumeMl ?? 0,
      costAmount: raw.costAmount ?? 0,
      optionValues: raw.optionValues,
      createdAt: raw.createdAt ?? raw.created_at ?? '',
      updatedAt: raw.updatedAt ?? raw.updated_at ?? '',
    };
  }
}
