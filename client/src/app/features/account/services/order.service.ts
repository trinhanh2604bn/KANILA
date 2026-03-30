import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface OrderSummaryView {
  total_orders: number;
  pending_orders: number;
}

export interface MyOrderItemView {
  _id: string;
  order_number: string;
  order_status: string;
  payment_status: string;
  fulfillment_status: string;
  placed_at: string;
  grand_total_amount: number;
  item_count: number;
  total_quantity: number;
  first_item_name: string;
  item_previews?: Array<{ product_name: string; variant_name: string; quantity: number }>;
  tracking_number?: string | null;
  shipment_status?: string | null;
}

export interface MyOrderTrackingView {
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  latestUpdateAt: string;
  shipment?: { trackingNumber?: string | null; shipmentStatus?: string | null } | null;
  events: Array<{ status: string; description: string; timestamp: string; location?: string }>;
}

export interface MyOrderDetailView {
  _id: string;
  order_number: string;
  order_status: string;
  payment_status: string;
  fulfillment_status: string;
  placed_at: string;
  cancelled_at?: string | null;
  cancellation_reason?: string;
  order_total?: {
    subtotal_amount?: number;
    shipping_fee_amount?: number;
    tax_amount?: number;
    order_discount_amount?: number;
    grand_total_amount?: number;
  } | null;
  order_addresses?: Array<{
    recipient_name?: string;
    phone?: string;
    address_line_1?: string;
    address_line_2?: string;
    ward?: string;
    district?: string;
    city?: string;
    country_code?: string;
  }>;
  items?: Array<{
    _id: string;
    product_id?: { _id?: string; productName?: string } | string;
    variant_id?: { _id?: string; variantName?: string } | string;
    product_name_snapshot?: string;
    variant_name_snapshot?: string;
    quantity?: number;
    unit_final_price_amount?: number;
    line_total_amount?: number;
  }>;
  status_history?: Array<{
    new_order_status?: string;
    new_fulfillment_status?: string;
    changed_at?: string;
    change_reason?: string;
  }>;
}

@Injectable({ providedIn: 'root' })
export class AccountOrderService {
  private readonly api = 'http://localhost:5000/api/orders';

  constructor(private readonly http: HttpClient) {}

  getSummary(): Observable<OrderSummaryView | null> {
    return this.http.get<any>(`${this.api}/me/summary`).pipe(
      map((res) => (res?.data || null) as OrderSummaryView),
      catchError(() => of(null))
    );
  }

  listMyOrders(page = 1, limit = 10): Observable<MyOrderItemView[]> {
    return this.http.get<any>(`${this.api}/me?page=${page}&limit=${limit}`).pipe(
      map((res) => (Array.isArray(res?.data) ? res.data : []) as MyOrderItemView[]),
      catchError(() => of([]))
    );
  }

  getMyOrderTracking(orderId: string): Observable<MyOrderTrackingView | null> {
    return this.http.get<any>(`${this.api}/me/${orderId}/tracking`).pipe(
      map((res) => (res?.data || null) as MyOrderTrackingView),
      catchError(() => of(null))
    );
  }

  getMyOrderDetail(orderId: string): Observable<MyOrderDetailView | null> {
    return this.http.get<any>(`${this.api}/me/${orderId}`).pipe(
      map((res) => (res?.data || null) as MyOrderDetailView),
      catchError(() => of(null))
    );
  }

  reorder(orderId: string): Observable<boolean> {
    return this.http.post<any>(`${this.api}/${orderId}/reorder`, {}).pipe(
      map((res) => !!res?.success),
      catchError(() => of(false))
    );
  }

  cancelOrder(orderId: string, reason = 'customer_cancel'): Observable<boolean> {
    return this.http.patch<any>(`${this.api}/${orderId}/cancel`, { reason }).pipe(
      map((res) => !!res?.success),
      catchError(() => of(false))
    );
  }

  requestReturn(orderId: string, reason = 'customer_request'): Observable<boolean> {
    return this.http.post<any>(`${this.api}/${orderId}/return`, { reason }).pipe(
      map((res) => !!res?.success),
      catchError(() => of(false))
    );
  }

  // ─── Status Mapping ────────────────────────────────────────────────────────

  /** Maps raw backend status to friendly Vietnamese label. */
  getStatusLabel(status: string, fulfillmentStatus?: string): string {
    const s = (status || '').toLowerCase();
    const ff = (fulfillmentStatus || '').toLowerCase();

    // Priority for returned/refunded states
    if (ff === 'returned' || s === 'returned') return 'Đã trả hàng';
    if (s === 'return_requested') return 'Yêu cầu trả hàng';
    if (s === 'return_approved') return 'Đã chấp nhận trả hàng';
    if (s === 'refunded') return 'Đã hoàn tiền';
    if (s === 'cancelled') return 'Đã hủy';

    // Shipment/Delivery technical states
    if (s === 'ready_to_ship') return 'Chờ bàn giao ĐVVC';
    if (s === 'in_transit') return 'Đang vận chuyển';
    if (s === 'shipped') return 'Đang giao hàng';
    if (s === 'delivered') return 'Giao hàng thành công';
    
    // Core lifecycle states
    if (s === 'pending') return 'Chờ xác nhận';
    if (s === 'confirmed') return 'Đã xác nhận';
    if (s === 'processing') return 'Đang chuẩn bị hàng';
    if (s === 'completed') return 'Hoàn tất';

    // Fallback for technical strings common in history
    if (s.includes('ship')) return 'Đang giao hàng';

    return status || 'Đơn hàng';
  }

  /** Maps raw backend status to CSS class for badges. */
  getStatusClass(status: string, fulfillmentStatus?: string): string {
    const s = (status || '').toLowerCase();
    const ff = (fulfillmentStatus || '').toLowerCase();

    if (s === 'completed' || s === 'delivered') return 'done';
    if (s === 'shipped' || s === 'processing') return 'shipping';
    if (s === 'cancelled') return 'cancelled';
    if (s === 'return_requested' || s === 'returned' || s === 'refunded') return 'returned';
    return 'processing';
  }
}
