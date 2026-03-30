import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, forkJoin, of } from 'rxjs';
import { Order, OrderItem, OrderStatus, UpdateOrderStatusPayload } from '../models/order.model';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { environment } from '../../../core/config/environment';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class OrdersApiService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<Order[]> {
    return this.http.get<ApiResponse<any[]>>(`${API}/orders`).pipe(
      map(res => res.data.map(o => this.mapOrder(o)))
    );
  }

  getById(id: string): Observable<Order> {
    return forkJoin({
      order: this.http.get<ApiResponse<any>>(`${API}/orders/${id}`),
      items: this.http.get<ApiResponse<any[]>>(`${API}/order-items/order/${id}`),
      totals: this.http.get<ApiResponse<any[]>>(`${API}/order-totals/order/${id}`),
    }).pipe(
      map(({ order, items, totals }) => {
        const o = order.data;
        const orderItems = items.data.map(i => this.mapOrderItem(i));
        const orderTotal = totals.data?.[0];
        return {
          ...this.mapOrder(o),
          items: orderItems,
          subtotal: orderTotal?.subtotal_amount ?? orderTotal?.subtotalAmount ?? 0,
          shippingFee: orderTotal?.shipping_fee_amount ?? orderTotal?.shippingFeeAmount ?? 0,
          total: orderTotal?.grand_total_amount ?? orderTotal?.grandTotalAmount ?? 0,
        };
      })
    );
  }

  updateStatus(id: string, statusOrPayload: OrderStatus | UpdateOrderStatusPayload): Observable<Order> {
    const payload = typeof statusOrPayload === 'string'
      ? { orderStatus: statusOrPayload }
      : statusOrPayload;
    return this.http.put<ApiResponse<any>>(`${API}/orders/${id}`, payload).pipe(
      map(res => this.mapOrder(res.data))
    );
  }

  private mapOrder(raw: any): Order {
    // customer_id populated as { _id, full_name, customer_code, account_id: { email } }
    const custObj =
      raw.customer_id && typeof raw.customer_id === 'object'
        ? raw.customer_id
        : raw.customerId && typeof raw.customerId === 'object'
          ? raw.customerId
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
      subtotal: raw.subtotalAmount ?? raw.subtotal ?? 0,
      shippingFee: raw.shippingFeeAmount ?? raw.shippingFee ?? 0,
      total: raw.grandTotalAmount ?? raw.total ?? 0,
      status: raw.order_status || raw.orderStatus || 'pending',
      paymentStatus: raw.payment_status || raw.paymentStatus || 'unpaid',
      fulfillmentStatus: raw.fulfillment_status || raw.fulfillmentStatus || 'unfulfilled',
      createdAt: raw.placedAt || raw.placed_at || raw.createdAt || raw.created_at || '',
      updatedAt: raw.updatedAt || raw.updated_at || '',
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
}
