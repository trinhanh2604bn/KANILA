import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, forkJoin, of, catchError } from 'rxjs';
import {
  Order, OrderItem, PaymentSummary, ShipmentSummary,
  ReturnSummary, RefundSummary, StatusHistoryEntry,
} from '../models/order.model';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { environment } from '../../../core/config/environment';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class OrdersApiService {
  private readonly http = inject(HttpClient);

  // ─── LIST ──────────────────────────────────────────

  getAll(): Observable<Order[]> {
    return this.http.get<ApiResponse<any[]>>(`${API}/orders`).pipe(
      map(res => res.data.map(o => this.mapOrder(o)))
    );
  }

  // ─── DETAIL (parallel fetch) ───────────────────────

  getById(id: string): Observable<Order> {
    return forkJoin({
      order:     this.http.get<ApiResponse<any>>(`${API}/orders/${id}`),
      items:     this.http.get<ApiResponse<any[]>>(`${API}/order-items/order/${id}`),
      totals:    this.http.get<ApiResponse<any[]>>(`${API}/order-totals/order/${id}`),
      payments:  this.http.get<ApiResponse<any[]>>(`${API}/payment-transactions/order/${id}`).pipe(catchError(() => of({ data: [] } as any))),
      shipments: this.http.get<ApiResponse<any[]>>(`${API}/shipments/order/${id}`).pipe(catchError(() => of({ data: [] } as any))),
      returns:   this.http.get<ApiResponse<any[]>>(`${API}/returns/order/${id}`).pipe(catchError(() => of({ data: [] } as any))),
      refunds:   this.http.get<ApiResponse<any[]>>(`${API}/refunds/order/${id}`).pipe(catchError(() => of({ data: [] } as any))),
      history:   this.http.get<ApiResponse<any[]>>(`${API}/order-status-history/order/${id}`).pipe(catchError(() => of({ data: [] } as any))),
    }).pipe(
      map(({ order, items, totals, payments, shipments, returns, refunds, history }) => {
        const o = order.data;
        const orderItems = items.data.map(i => this.mapOrderItem(i));
        const orderTotal = totals.data?.[0];
        return {
          ...this.mapOrder(o),
          items: orderItems,
          subtotal: orderTotal?.subtotal_amount ?? orderTotal?.subtotalAmount ?? 0,
          shippingFee: orderTotal?.shipping_fee_amount ?? orderTotal?.shippingFeeAmount ?? 0,
          total: orderTotal?.grand_total_amount ?? orderTotal?.grandTotalAmount ?? 0,
          payments: (payments.data ?? []).map((p: any) => this.mapPaymentSummary(p)),
          shipments: (shipments.data ?? []).map((s: any) => this.mapShipmentSummary(s)),
          returns: (returns.data ?? []).map((r: any) => this.mapReturnSummary(r)),
          refunds: (refunds.data ?? []).map((r: any) => this.mapRefundSummary(r)),
          history: (history.data ?? []).map((h: any) => this.mapHistory(h)),
        };
      })
    );
  }

  // ═══════════════ ADMIN ACTIONS ═══════════════

  confirmOrder(id: string): Observable<any> {
    return this.http.patch<ApiResponse<any>>(`${API}/admin/orders/${id}/confirm`, {});
  }

  markProcessing(id: string): Observable<any> {
    return this.http.patch<ApiResponse<any>>(`${API}/admin/orders/${id}/processing`, {});
  }

  cancelOrder(id: string, reason: string): Observable<any> {
    return this.http.patch<ApiResponse<any>>(`${API}/admin/orders/${id}/cancel`, { reason });
  }

  markCodPaid(id: string): Observable<any> {
    return this.http.patch<ApiResponse<any>>(`${API}/admin/orders/${id}/mark-cod-paid`, {});
  }

  createShipment(orderId: string, payload: any): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${API}/admin/orders/${orderId}/shipments`, payload);
  }

  createReturn(orderId: string, payload: any): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${API}/admin/orders/${orderId}/returns`, payload);
  }

  createRefund(orderId: string, payload: any): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${API}/admin/orders/${orderId}/refunds`, payload);
  }

  // Shipment status transitions
  shipmentReadyToShip(shipmentId: string): Observable<any> {
    return this.http.patch<ApiResponse<any>>(`${API}/admin/shipments/${shipmentId}/ready-to-ship`, {});
  }
  shipShipment(shipmentId: string): Observable<any> {
    return this.http.patch<ApiResponse<any>>(`${API}/admin/shipments/${shipmentId}/ship`, {});
  }
  shipmentInTransit(shipmentId: string): Observable<any> {
    return this.http.patch<ApiResponse<any>>(`${API}/admin/shipments/${shipmentId}/in-transit`, {});
  }
  deliverShipment(shipmentId: string): Observable<any> {
    return this.http.patch<ApiResponse<any>>(`${API}/admin/shipments/${shipmentId}/deliver`, {});
  }
  failShipment(shipmentId: string, reason: string): Observable<any> {
    return this.http.patch<ApiResponse<any>>(`${API}/admin/shipments/${shipmentId}/fail`, { reason });
  }

  // Return status transitions
  approveReturn(returnId: string): Observable<any> {
    return this.http.patch<ApiResponse<any>>(`${API}/admin/returns/${returnId}/approve`, {});
  }
  rejectReturn(returnId: string): Observable<any> {
    return this.http.patch<ApiResponse<any>>(`${API}/admin/returns/${returnId}/reject`, {});
  }
  receiveReturn(returnId: string, items?: any[]): Observable<any> {
    return this.http.patch<ApiResponse<any>>(`${API}/admin/returns/${returnId}/receive`, { items });
  }
  completeReturn(returnId: string): Observable<any> {
    return this.http.patch<ApiResponse<any>>(`${API}/admin/returns/${returnId}/complete`, {});
  }

  // Refund status transitions
  approveRefund(refundId: string): Observable<any> {
    return this.http.patch<ApiResponse<any>>(`${API}/admin/refunds/${refundId}/approve`, {});
  }
  completeRefund(refundId: string): Observable<any> {
    return this.http.patch<ApiResponse<any>>(`${API}/admin/refunds/${refundId}/complete`, {});
  }

  // ═══════════════ MAPPERS ═══════════════

  private mapOrder(raw: any): Order {
    const custObj =
      raw.customer_id && typeof raw.customer_id === 'object' ? raw.customer_id
        : raw.customerId && typeof raw.customerId === 'object' ? raw.customerId
          : null;
    const customerEmail = custObj?.account_id?.email || custObj?.email || '';

    return {
      id: raw._id || '',
      orderNumber: raw.order_number || raw.orderNumber || '',
      customerId: custObj?._id || raw.customer_id || raw.customerId || '',
      customerName: custObj?.full_name || custObj?.fullName || '',
      customerEmail,
      customerPhone: '',
      shippingAddress: '',
      items: [],
      subtotal: raw.subtotal_amount ?? raw.subtotalAmount ?? raw.subtotal ?? 0,
      shippingFee: raw.shipping_fee_amount ?? raw.shippingFeeAmount ?? raw.shippingFee ?? 0,
      total: raw.grand_total_amount ?? raw.grandTotalAmount ?? raw.total ?? 0,
      status: raw.order_status || raw.orderStatus || 'pending',
      paymentStatus: raw.payment_status || raw.paymentStatus || 'unpaid',
      fulfillmentStatus: raw.fulfillment_status || raw.fulfillmentStatus || 'unfulfilled',
      createdAt: raw.placedAt || raw.placed_at || raw.createdAt || raw.created_at || '',
      updatedAt: raw.updatedAt || raw.updated_at || '',
      confirmedAt: raw.confirmed_at || raw.confirmedAt || undefined,
      completedAt: raw.completed_at || raw.completedAt || undefined,
      cancelledAt: raw.cancelled_at || raw.cancelledAt || undefined,
      cancellationReason: raw.cancellation_reason || raw.cancellationReason || undefined,
    };
  }

  private mapOrderItem(raw: any): OrderItem {
    return {
      id: raw._id,
      productId: raw.product_id?._id || raw.product_id || raw.productId || '',
      variantId: raw.variant_id?._id || raw.variant_id || raw.variantId || '',
      productName: raw.product_name_snapshot || raw.productNameSnapshot || '',
      sku: raw.sku_snapshot || raw.skuSnapshot || raw.variant_id?.sku || '',
      quantity: raw.quantity,
      price: raw.unit_final_price_amount || raw.unit_list_price_amount || raw.unitFinalPriceAmount || raw.unitListPriceAmount || 0,
    };
  }

  private mapPaymentSummary(raw: any): PaymentSummary {
    return {
      id: String(raw._id ?? ''),
      status: raw.transactionStatus || raw.status || 'pending',
      method: raw.paymentMethodType || raw.method || '',
      provider: raw.providerCode || raw.provider || '',
      amount: raw.amount || raw.transactionAmount || 0,
      refundedAmount: raw.refundedAmount || 0,
      createdAt: raw.processedAt || raw.createdAt || '',
    };
  }

  private mapShipmentSummary(raw: any): ShipmentSummary {
    return {
      id: String(raw._id ?? ''),
      shipmentNumber: raw.shipmentNumber || '',
      status: raw.shipmentStatus || 'pending',
      carrier: raw.carrierCode || '',
      trackingNumber: raw.trackingNumber || '',
      shippedAt: raw.shippedAt || null,
      deliveredAt: raw.deliveredAt || null,
      createdAt: raw.createdAt || '',
    };
  }

  private mapReturnSummary(raw: any): ReturnSummary {
    return {
      id: String(raw._id ?? ''),
      returnNumber: raw.returnNumber || '',
      status: raw.returnStatus || raw.status || 'requested',
      reason: raw.returnReason || raw.reason || '',
      requestedAt: raw.requestedAt || raw.createdAt || '',
      completedAt: raw.completedAt || null,
    };
  }

  private mapRefundSummary(raw: any): RefundSummary {
    return {
      id: String(raw._id ?? ''),
      status: raw.refundStatus || raw.status || 'requested',
      requestedAmount: raw.requestedAmount || 0,
      approvedAmount: raw.approvedAmount || 0,
      refundedAmount: raw.refundedAmount || 0,
      reason: raw.refundReason || raw.reason || '',
      requestedAt: raw.requestedAt || raw.createdAt || '',
      completedAt: raw.completedAt || null,
    };
  }

  private mapHistory(raw: any): StatusHistoryEntry {
    return {
      id: String(raw._id ?? ''),
      oldOrderStatus: raw.old_order_status || '',
      newOrderStatus: raw.new_order_status || '',
      oldPaymentStatus: raw.old_payment_status || '',
      newPaymentStatus: raw.new_payment_status || '',
      oldFulfillmentStatus: raw.old_fulfillment_status || '',
      newFulfillmentStatus: raw.new_fulfillment_status || '',
      changedBy: raw.changed_by_account_id?.email || raw.changed_by_account_id || '',
      reason: raw.change_reason || '',
      changedAt: raw.changed_at || raw.changedAt || '',
    };
  }
}
