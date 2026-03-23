import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { InventoryItem, AdjustStockPayload, StockHistoryLog } from '../models/inventory.model';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { environment } from '../../../core/config/environment';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class InventoryApiService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<InventoryItem[]> {
    return this.http.get<ApiResponse<any[]>>(`${API}/inventory-balances`).pipe(
      map(res => res.data.map(b => this.mapBalance(b)))
    );
  }

  getPrimaryProductImage(productId: string): Observable<string | null> {
    return this.http.get<ApiResponse<any[]>>(`${API}/product-media/product/${productId}`).pipe(
      map(res => {
        const media = res.data ?? [];
        const primary = media.find(m => m?.isPrimary === true) ?? media[0];
        const mediaUrl = primary?.mediaUrl;
        return mediaUrl ? String(mediaUrl) : null;
      }),
      catchError(() => of(null))
    );
  }

  getHistory(variantId: string, warehouseId: string): Observable<StockHistoryLog[]> {
    return this.http.get<ApiResponse<any[]>>(`${API}/inventory-transactions/variant/${variantId}`).pipe(
      map(res =>
        res.data
          .filter((t: any) => String(t.warehouseId?._id || t.warehouseId || '') === String(warehouseId))
          .map((t: any) => this.mapLog(t))
          .sort((a: StockHistoryLog, b: StockHistoryLog) => (a.createdAt < b.createdAt ? 1 : -1))
      )
    );
  }

  adjustStock(item: InventoryItem, payload: AdjustStockPayload): Observable<{ item: InventoryItem; log: StockHistoryLog }> {
    // Backend creates an InventoryTransaction; InventoryBalance quantity updates are not automatic.
    // We still do an optimistic UI update so the operator sees the change immediately.
    return this.http.post<ApiResponse<any>>(`${API}/inventory-transactions`, {
      warehouseId: item.warehouseId,
      variantId: item.variantId,
      quantityChange: payload.delta,
      transactionType: payload.reason,
      note: payload.notes || "",
      referenceId: item.id,
      referenceType: "inventory_balance",
    }).pipe(
      map(res => {
        const log = this.mapLog(res.data);
        const updatedItem = this.optimisticUpdate(item, payload.delta);
        return { item: updatedItem, log };
      })
    );
  }

  private mapBalance(raw: any): InventoryItem {
    const onHand = raw.onHandQty ?? 0;
    const reserved = raw.reservedQty ?? 0;
    const blocked = raw.blockedQty ?? 0;
    const available = raw.availableQty ?? Math.max(onHand - reserved - blocked, 0);

    const threshold = raw.reorderPointQty ?? raw.safetyStockQty ?? 10;
    let status: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
    if (available === 0) status = 'out_of_stock';
    else if (available <= threshold) status = 'low_stock';

    return {
      id: String(raw._id),
      variantId: String(raw.variantId?._id || raw.variantId || ''),
      warehouseId: String(raw.warehouseId?._id || raw.warehouseId || ''),
      productId: String(raw.variantId?.productId?._id || raw.variantId?.productId || ''),
      productName: raw.variantId?.variantName || '',
      sku: raw.variantId?.sku || '',
      optionValues: {},
      stockQuantity: available,
      lowStockThreshold: threshold,
      status,
      lastRestocked: raw.lastCountedAt || raw.updatedAt || null,
    };
  }

  private mapLog(raw: any): StockHistoryLog {
    const createdBy = raw.performedByAccountId?.email ? String(raw.performedByAccountId.email) : "";
    return {
      id: raw._id,
      inventoryItemId: String(raw.variantId?._id || raw.variantId || ''),
      previousStock: 0,
      newStock: 0,
      delta: raw.quantityChange || 0,
      reason: raw.transactionType || '',
      notes: raw.note || raw.referenceNote || '',
      createdAt: raw.createdAt,
      createdBy,
    };
  }

  private optimisticUpdate(item: InventoryItem, delta: number): InventoryItem {
    const stockQuantity = Math.max((item.stockQuantity || 0) + delta, 0);
    let status: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
    if (stockQuantity === 0) status = 'out_of_stock';
    else if (stockQuantity <= (item.lowStockThreshold || 10)) status = 'low_stock';

    return {
      ...item,
      stockQuantity,
      status,
      lastRestocked: new Date().toISOString(),
    };
  }
}
