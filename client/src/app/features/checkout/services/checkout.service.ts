import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CartService } from '../../cart/services/cart.service';
import {
  BuyNowCheckoutContext,
  BuyNowCheckoutItem,
  CheckoutIssue,
  CheckoutSessionUpdatePayload,
  CheckoutSessionView,
  OrderDetailView,
  PaymentMethodOption,
  PlaceOrderResult,
  ShippingMethodOption,
} from '../models/checkout.model';

@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private readonly checkoutApi = 'http://localhost:5000/api/checkout-sessions';
  private readonly shippingMethodApi = 'http://localhost:5000/api/shipping-methods';
  private readonly paymentMethodApi = 'http://localhost:5000/api/payment-methods';
  private readonly ordersApi = 'http://localhost:5000/api/orders';
  private readonly buyNowStorageKey = 'kanila_buy_now_checkout';

  constructor(
    private readonly http: HttpClient,
    private readonly cartService: CartService
  ) {}

  prepareCheckout(): Observable<{ success: boolean; issues: CheckoutIssue[] }> {
    return this.cartService.prepareCheckout().pipe(
      map((res) => ({
        success: !!res.success,
        issues: (res.issues || []) as CheckoutIssue[],
      })),
      catchError((err) => of({ success: false, issues: this.mapIssues(err) }))
    );
  }

  createCheckoutSession(payload: CheckoutSessionUpdatePayload): Observable<CheckoutSessionView> {
    return this.http.post<any>(`${this.checkoutApi}/me`, payload).pipe(
      map((res) => res?.data as CheckoutSessionView)
    );
  }

  updateCheckoutSession(sessionId: string, payload: CheckoutSessionUpdatePayload): Observable<CheckoutSessionView> {
    return this.http.patch<any>(`${this.checkoutApi}/${sessionId}`, payload).pipe(
      map((res) => res?.data as CheckoutSessionView)
    );
  }

  placeOrder(sessionId: string, customerNote = ''): Observable<PlaceOrderResult> {
    return this.http.post<any>(`${this.checkoutApi}/${sessionId}/place-order`, { customerNote }).pipe(
      map((res) => res?.data as PlaceOrderResult)
    );
  }

  getShippingMethods(): Observable<ShippingMethodOption[]> {
    return this.http.get<any>(this.shippingMethodApi).pipe(
      map((res) => (Array.isArray(res?.data) ? res.data : []).filter((x: ShippingMethodOption) => x.is_active !== false))
    );
  }

  getPaymentMethods(): Observable<PaymentMethodOption[]> {
    return this.http.get<any>(this.paymentMethodApi).pipe(
      map((res) => (Array.isArray(res?.data) ? res.data : []).filter((x: PaymentMethodOption) => x.is_active !== false))
    );
  }

  getOrderById(orderId: string): Observable<OrderDetailView | null> {
    if (!orderId) return of(null);
    return this.http.get<any>(`${this.ordersApi}/me/${orderId}`).pipe(
      map((res) => (res?.data || null) as OrderDetailView),
      catchError(() => of(null))
    );
  }

  setBuyNowContext(item: BuyNowCheckoutItem): void {
    const payload: BuyNowCheckoutContext = {
      source: 'buy_now',
      createdAt: new Date().toISOString(),
      items: [item],
    };
    sessionStorage.setItem(this.buyNowStorageKey, JSON.stringify(payload));
  }

  getBuyNowContext(): BuyNowCheckoutContext | null {
    try {
      const raw = sessionStorage.getItem(this.buyNowStorageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as BuyNowCheckoutContext;
      if (parsed?.source !== 'buy_now' || !Array.isArray(parsed.items) || !parsed.items.length) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  clearBuyNowContext(): void {
    sessionStorage.removeItem(this.buyNowStorageKey);
  }

  mapIssues(err: any): CheckoutIssue[] {
    if (Array.isArray(err?.error?.issues)) return err.error.issues;
    if (err?.error?.code || err?.error?.message) {
      return [{ code: String(err.error.code || 'CHECKOUT_ERROR'), message: String(err.error.message || 'Checkout failed') }];
    }
    return [{ code: 'CHECKOUT_ERROR', message: 'Checkout failed' }];
  }
}
