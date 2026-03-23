export interface ReturnItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  price: number;
}

/** Matches backend returnStatus enum */
export type ReturnStatus = 'requested' | 'approved' | 'received' | 'completed' | 'rejected';

export interface ReturnRequest {
  id: string;
  /** Human-readable return reference (e.g. RMA-xxx) */
  returnNumber: string;
  /** Order document id (for routes/links) */
  orderId: string;
  /** Display order number from populated Order */
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  /** Free-text reason from backend returnReason */
  reason: string;
  reasonText?: string;
  status: ReturnStatus;
  items: ReturnItem[];
  images?: string[];
  /** When the customer requested the return (requestedAt) */
  requestedAt: string;
  createdAt: string;
  updatedAt: string;
}
