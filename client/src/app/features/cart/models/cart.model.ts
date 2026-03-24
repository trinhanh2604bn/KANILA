export interface CartSummary {
  itemCount: number;
  selectedCount: number;
  totalQuantity: number;
  subtotal: number;
  discountTotal: number;
  shippingFee: number;
  grandTotal: number;
  qualifiesForFreeShipping: boolean;
  amountToFreeShipping: number;
}

export interface CartItemNormalized {
  cartItemId: string;
  lineKey?: string;
  productId: string;
  variantId: string | null;
  productName: string;
  brandName: string;
  variantLabel: string;
  imageUrl: string;
  unitPrice: number;
  compareAtPrice: number | null;
  discountPercent: number;
  quantity: number;
  selected: boolean;
  stockStatus: string;
  lineSubtotal?: number;
  lineTotal?: number;
}

export interface CartNormalized {
  cartId: string | null;
  source: 'database' | 'guest';
  customerId: string | null;
  items: CartItemNormalized[];
  summary: CartSummary;
  updatedAt: string;
}

export interface AddToCartPayload {
  productId: string;
  variantId?: string | null;
  quantity: number;
  productName?: string;
  brandName?: string;
  variantLabel?: string;
  imageUrl?: string;
  unitPrice?: number;
  compareAtPrice?: number | null;
  stockStatus?: string;
}
