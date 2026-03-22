export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';
export type AdjustmentReason = 'restock' | 'damage' | 'return' | 'manual';

export interface InventoryItem {
  id: string; // usually maps to variantId
  productId: string;
  productName: string;
  sku: string;
  optionValues?: Record<string, string>;
  stockQuantity: number;
  lowStockThreshold: number;
  status: StockStatus;
  lastRestocked: string | null;
}

export interface StockHistoryLog {
  id: string;
  inventoryItemId: string;
  previousStock: number;
  newStock: number;
  delta: number;
  reason: AdjustmentReason;
  notes?: string;
  createdAt: string;
  createdBy: string; // e.g. "Admin User"
}

export interface AdjustStockPayload {
  delta: number; // e.g. +50 or -5
  reason: AdjustmentReason;
  notes?: string;
}
