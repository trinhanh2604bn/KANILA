import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CartService } from '../../cart/services/cart.service';
import { GuestSessionService } from '../../../core/services/guest-session.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  BuyNowCheckoutPayload,
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
  constructor(
    private readonly http: HttpClient,
    private readonly cartService: CartService,
    private readonly guestSessionService: GuestSessionService,
    private readonly authService: AuthService
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
    if (!this.authService.isAuthenticated()) {
      return this.http.post<any>(`${this.checkoutApi}/guest/me`, payload, { headers: this.guestSessionService.buildGuestHeaders() }).pipe(
        map((res) => res?.data as CheckoutSessionView)
      );
    }
    return this.http.post<any>(`${this.checkoutApi}/me`, payload).pipe(
      map((res) => res?.data as CheckoutSessionView)
    );
  }

  createBuyNowCheckoutSession(payload: BuyNowCheckoutPayload): Observable<CheckoutSessionView> {
    if (!this.authService.isAuthenticated()) {
      return this.http
        .post<any>(`${this.checkoutApi}/guest/buy-now`, payload, { headers: this.guestSessionService.buildGuestHeaders() })
        .pipe(map((res) => res?.data as CheckoutSessionView));
    }
    return this.http.post<any>(`${this.checkoutApi}/me/buy-now`, payload).pipe(
      map((res) => res?.data as CheckoutSessionView)
    );
  }

  getMyCheckoutSessionById(sessionId: string): Observable<CheckoutSessionView> {
    if (!this.authService.isAuthenticated()) {
      return this.http.get<any>(`${this.checkoutApi}/guest/me/${sessionId}`, { headers: this.guestSessionService.buildGuestHeaders() }).pipe(
        map((res) => res?.data as CheckoutSessionView)
      );
    }
    return this.http.get<any>(`${this.checkoutApi}/me/${sessionId}`).pipe(
      map((res) => res?.data as CheckoutSessionView)
    );
  }

  updateCheckoutSession(sessionId: string, payload: CheckoutSessionUpdatePayload): Observable<CheckoutSessionView> {
    if (!this.authService.isAuthenticated()) {
      return this.http.patch<any>(`${this.checkoutApi}/guest/${sessionId}`, payload, { headers: this.guestSessionService.buildGuestHeaders() }).pipe(
        map((res) => res?.data as CheckoutSessionView)
      );
    }
    return this.http.patch<any>(`${this.checkoutApi}/${sessionId}`, payload).pipe(
      map((res) => res?.data as CheckoutSessionView)
    );
  }

  placeOrder(sessionId: string, customerNote = ''): Observable<PlaceOrderResult> {
    if (!this.authService.isAuthenticated()) {
      return this.http.post<any>(`${this.checkoutApi}/guest/${sessionId}/place-order`, { customerNote }, { headers: this.guestSessionService.buildGuestHeaders() }).pipe(
        map((res) => res?.data as PlaceOrderResult)
      );
    }
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

  mapIssues(err: any): CheckoutIssue[] {
    if (Array.isArray(err?.error?.issues)) return err.error.issues;
    if (err?.error?.code || err?.error?.message) {
      const code = String(err.error.code || 'CHECKOUT_ERROR');
      const fallback = String(err.error.message || 'Checkout failed');
      const mapByCode: Record<string, string> = {
        INSUFFICIENT_STOCK: 'Số lượng vượt quá tồn kho hiện tại.',
        PRODUCT_UNAVAILABLE: 'Sản phẩm hiện không còn khả dụng.',
        VARIANT_UNAVAILABLE: 'Phân loại này hiện không còn khả dụng.',
        PRICE_CHANGED: 'Giá sản phẩm đã thay đổi. Vui lòng kiểm tra lại.',
        INVALID_SHIPPING_METHOD: 'Phương thức vận chuyển không hợp lệ.',
        INVALID_PAYMENT_METHOD: 'Phương thức thanh toán không hợp lệ.',
        INVALID_ADDRESS: 'Thông tin địa chỉ giao hàng chưa hợp lệ.',
      };
      return [{ code, message: mapByCode[code] || fallback }];
    }
    return [{ code: 'CHECKOUT_ERROR', message: 'Checkout failed' }];
  }
}
