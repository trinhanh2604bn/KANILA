import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  MyOrderListItemView,
  OrderDetailView,
  OrderTrackingView,
} from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly ordersApi = 'http://localhost:5000/api/orders';

  constructor(private readonly http: HttpClient) {}

  getMyOrders(page = 1, limit = 10, status = ''): Observable<{
    data: MyOrderListItemView[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (status) params.set('status', status);
    return this.http.get<any>(`${this.ordersApi}/me?${params.toString()}`).pipe(
      map((res) => ({
        data: (res?.data || []) as MyOrderListItemView[],
        pagination: {
          page: Number(res?.pagination?.page || page),
          limit: Number(res?.pagination?.limit || limit),
          total: Number(res?.pagination?.total || 0),
          totalPages: Number(res?.pagination?.totalPages || 1),
        },
      }))
    );
  }

  getMyOrderById(orderId: string): Observable<OrderDetailView | null> {
    if (!orderId) return of(null);
    return this.http.get<any>(`${this.ordersApi}/me/${orderId}`).pipe(
      map((res) => (res?.data || null) as OrderDetailView),
      catchError(() => of(null))
    );
  }

  getMyOrderTracking(orderId: string): Observable<OrderTrackingView | null> {
    if (!orderId) return of(null);
    return this.http.get<any>(`${this.ordersApi}/me/${orderId}/tracking`).pipe(
      map((res) => (res?.data || null) as OrderTrackingView),
      catchError(() => of(null))
    );
  }
}
