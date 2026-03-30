export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled' | 'returned';
export type PaymentStatus = 'unpaid' | 'pending' | 'authorized' | 'paid' | 'failed' | 'partially_refunded' | 'refunded';
export type FulfillmentStatus = 'unfulfilled' | 'preparing' | 'partially_shipped' | 'shipped' | 'in_transit' | 'delivered' | 'partially_returned' | 'returned';

export interface OrderItem {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  sku: string;
  imageUrl?: string;
  optionValues?: Record<string, string>;
  quantity: number;
  price: number;
}

/** Lightweight payment summary shown on Order Detail. */
export interface PaymentSummary {
  id: string;
  status: string;
  method: string;
  provider: string;
  amount: number;
  refundedAmount: number;
  createdAt: string;
}

/** Lightweight shipment summary shown on Order Detail. */
export interface ShipmentSummary {
  id: string;
  shipmentNumber: string;
  status: string;
  carrier: string;
  trackingNumber: string;
  shippedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
}

/** Lightweight return summary shown on Order Detail. */
export interface ReturnSummary {
  id: string;
  returnNumber: string;
  status: string;
  reason: string;
  requestedAt: string;
  completedAt: string | null;
}

/** Lightweight refund summary shown on Order Detail. */
export interface RefundSummary {
  id: string;
  status: string;
  requestedAmount: number;
  approvedAmount: number;
  refundedAmount: number;
  reason: string;
  requestedAt: string;
  completedAt: string | null;
}

/** Status history entry. */
export interface StatusHistoryEntry {
  id: string;
  oldOrderStatus: string;
  newOrderStatus: string;
  oldPaymentStatus: string;
  newPaymentStatus: string;
  oldFulfillmentStatus: string;
  newFulfillmentStatus: string;
  changedBy: string;
  reason: string;
  changedAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  // Linked operational data (loaded on detail page)
  payments?: PaymentSummary[];
  shipments?: ShipmentSummary[];
  returns?: ReturnSummary[];
  refunds?: RefundSummary[];
  history?: StatusHistoryEntry[];
}
