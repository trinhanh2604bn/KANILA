import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  MyOrderListItemView,
  OrderDetailView,
  OrderTrackingView,
} from '../models/order.model';
import { GuestSessionService } from '../../../core/services/guest-session.service';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly ordersApi = 'http://localhost:5000/api/orders';

  constructor(
    private readonly http: HttpClient,
    private readonly guestSessionService: GuestSessionService
  ) {}

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

  getGuestOrderTracking(orderId: string): Observable<OrderTrackingView | null> {
    if (!orderId) return of(null);
    return this.http.get<any>(`${this.ordersApi}/guest/${orderId}/tracking`, { headers: this.guestSessionService.buildGuestHeaders() }).pipe(
      map((res) => (res?.data || null) as OrderTrackingView),
      catchError(() => of(null))
    );
  }

  getGuestOrderSummary(orderId: string): Observable<OrderDetailView | null> {
    if (!orderId) return of(null);
    return this.http.get<any>(`${this.ordersApi}/guest/${orderId}/summary`, { headers: this.guestSessionService.buildGuestHeaders() }).pipe(
      map((res) => (res?.data || null) as OrderDetailView),
      catchError(() => of(null))
    );
  }

  lookupGuestOrder(orderNumber: string, phone: string, email: string): Observable<{ orderId: string; orderNumber: string } | null> {
    return this.http.post<any>(`${this.ordersApi}/guest/lookup`, { orderNumber, phone, email }).pipe(
      map((res) => (res?.data ? { orderId: String(res.data.orderId), orderNumber: String(res.data.orderNumber) } : null)),
      catchError(() => of(null))
    );
  }
}
