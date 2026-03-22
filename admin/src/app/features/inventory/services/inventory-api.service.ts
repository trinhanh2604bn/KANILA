import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
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

  getHistory(inventoryItemId: string): Observable<StockHistoryLog[]> {
    return this.http.get<ApiResponse<any[]>>(`${API}/inventory-transactions`).pipe(
      map(res => res.data
        .filter((t: any) => (t.inventoryBalanceId?._id || t.inventoryBalanceId) === inventoryItemId)
        .map((t: any) => this.mapLog(t))
      )
    );
  }

  adjustStock(id: string, payload: AdjustStockPayload): Observable<{ item: InventoryItem; log: StockHistoryLog }> {
    // Create an inventory transaction
    return this.http.post<ApiResponse<any>>(`${API}/inventory-transactions`, {
      inventoryBalanceId: id,
      quantityChange: payload.delta,
      transactionType: payload.delta > 0 ? 'restock' : 'adjustment',
      referenceNote: payload.reason,
    }).pipe(
      map(res => ({
        item: this.mapBalance(res.data),
        log: this.mapLog(res.data),
      }))
    );
  }

  private mapBalance(raw: any): InventoryItem {
    const qty = raw.quantityOnHand ?? raw.stockQuantity ?? 0;
    const threshold = raw.lowStockThreshold ?? 10;
    let status: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
    if (qty === 0) status = 'out_of_stock';
    else if (qty <= threshold) status = 'low_stock';

    return {
      id: raw._id,
      productId: raw.productVariantId?._id || raw.productVariantId || '',
      productName: raw.productVariantId?.productNameSnapshot || '',
      sku: raw.sku || '',
      optionValues: {},
      stockQuantity: qty,
      lowStockThreshold: threshold,
      status,
      lastRestocked: raw.updatedAt || null,
    };
  }

  private mapLog(raw: any): StockHistoryLog {
    return {
      id: raw._id,
      inventoryItemId: raw.inventoryBalanceId || '',
      previousStock: 0,
      newStock: raw.quantityChange || 0,
      delta: raw.quantityChange || 0,
      reason: raw.transactionType || '',
      notes: raw.referenceNote || '',
      createdAt: raw.createdAt,
      createdBy: '',
    };
  }
}
