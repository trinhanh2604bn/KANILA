import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Payment, RefundRequest } from '../models/payment.model';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { environment } from '../../../core/config/environment';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class PaymentsApiService {
  private readonly http = inject(HttpClient);

  getPayments(): Observable<Payment[]> {
    return this.http.get<ApiResponse<any[]>>(`${API}/payment-transactions`).pipe(
      map(res => res.data.map(p => this.mapPayment(p)))
    );
  }

  getPayment(id: string): Observable<Payment> {
    return this.http.get<ApiResponse<any>>(`${API}/payment-transactions/${id}`).pipe(
      map(res => this.mapPayment(res.data))
    );
  }

  /** Get all payment transactions for a specific order */
  getByOrderId(orderId: string): Observable<Payment[]> {
    return this.http.get<ApiResponse<any[]>>(`${API}/payment-transactions/order/${orderId}`).pipe(
      map(res => res.data.map(p => this.mapPayment(p)))
    );
  }

  processRefund(request: RefundRequest): Observable<Payment> {
    return this.http.post<ApiResponse<any>>(`${API}/refunds`, {
      paymentTransactionId: request.paymentId,
      refundAmount: request.amount,
      reason: request.reason || '',
    }).pipe(
      map(res => this.mapPayment(res.data))
    );
  }

  private mapPayment(raw: any): Payment {
    // Backend populates order_id as { _id, order_number } object
    const orderObj = raw.order_id && typeof raw.order_id === 'object' ? raw.order_id : null;
    const orderId = orderObj?._id?.toString?.() ?? raw.order_id?.toString?.() ?? '';
    const orderNumber = orderObj?.order_number || orderObj?.orderNumber || '';

    // Customer may be populated through order_id.customer_id
    const custObj = orderObj?.customer_id && typeof orderObj.customer_id === 'object'
      ? orderObj.customer_id : null;
    const customerName = custObj?.full_name || custObj?.fullName || '';

    return {
      id: raw._id,
      orderId,
      orderNumber: orderNumber || orderId,
      customerName,
      amount: raw.amount || raw.transactionAmount || 0,
      refundedAmount: raw.refundedAmount || 0,
      status: raw.transactionStatus || raw.status || 'pending',
      method: raw.paymentMethodType || raw.method || '',
      provider: raw.providerCode || raw.provider || '',
      transactionType: raw.transactionType || '',
      currencyCode: raw.currencyCode || 'VND',
      createdAt: raw.processedAt || raw.createdAt,
    };
  }
}
