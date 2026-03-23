export interface Payment {
  id: string;
  orderId: string;
  customerName: string;
  amount: number;
  refundedAmount: number;
  status: 'success' | 'pending' | 'failed';
  method: string;
  createdAt: string;
}

export interface RefundRequest {
  paymentId: string;
  amount: number;
  reason?: string;
}
