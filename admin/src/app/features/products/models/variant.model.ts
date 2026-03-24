export interface ProductOption {
  name: string;
  values: string[];
}

/** Aligned with backend `ProductVariant` (price/stock live on product, not variant). */
export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  barcode: string;
  variantName: string;
  imageUrl?: string;
  variantStatus: 'active' | 'inactive';
  weightGrams: number;
  volumeMl: number;
  costAmount: number;
  /** UI-only: from option matrix, not persisted on the server. */
  optionValues?: Record<string, string>;
  createdAt?: string;
  updatedAt?: string;
}
