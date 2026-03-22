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
    return {
      id: raw._id,
      orderId: raw.orderId || raw.paymentIntentId || '',
      customerName: '',
      amount: raw.amount || raw.transactionAmount || 0,
      refundedAmount: raw.refundedAmount || 0,
      status: raw.transactionStatus || raw.status || 'pending',
      method: raw.paymentMethodType || raw.method || '',
      createdAt: raw.createdAt,
    };
  }
}
