export type PaymentStatus = 'success' | 'pending' | 'failed';

export interface Payment {
  id: string;
  orderId: string;       // Order _id (for routing)
  orderNumber: string;   // Order display number
  customerName: string;
  amount: number;
  refundedAmount: number;
  status: PaymentStatus;
  method: string;        // payment method type
  provider: string;      // provider code
  transactionType: string;
  currencyCode: string;
  createdAt: string;
}

export interface RefundRequest {
  paymentId: string;
  amount: number;
  reason?: string;
}
