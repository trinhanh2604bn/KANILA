import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { AddToCartPayload, CartItemNormalized, CartNormalized, CartSummary } from '../models/cart.model';
import { AuthService } from '../../../core/services/auth.service';
import { GuestSessionService } from '../../../core/services/guest-session.service';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly apiUrl = 'http://localhost:5000/api/carts';
  private readonly freeShippingThreshold = 499000;
  private readonly shippingFeeDefault = 30000;
  private readonly cartErrorSubject = new BehaviorSubject<{ code: string; message: string } | null>(null);

  private readonly cartStateSubject = new BehaviorSubject<CartNormalized>(this.getEmptyCart('guest'));
  readonly cartState$ = this.cartStateSubject.asObservable();
  readonly cartError$ = this.cartErrorSubject.asObservable();

  readonly cartItemCount$ = this.cartState$.pipe(map((cart) => cart.summary.itemCount));
  readonly cartTotalQuantity$ = this.cartState$.pipe(map((cart) => cart.summary.totalQuantity));
  readonly cartSelectedCount$ = this.cartState$.pipe(map((cart) => cart.summary.selectedCount));
  readonly cartSummary$ = this.cartState$.pipe(map((cart) => cart.summary));

  getCurrentError(): { code: string; message: string } | null {
    return this.cartErrorSubject.value;
  }

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService,
    private readonly guestSessionService: GuestSessionService
  ) {
    this.guestSessionService.bootstrap().subscribe();
    this.bootstrapCart();
  }

  getCurrentCart(): Observable<CartNormalized> {
    if (this.isLoggedIn()) {
      return this.http.get<any>(`${this.apiUrl}/me`).pipe(
        map((res) => this.normalizeIncomingCart(res?.data, 'database')),
        tap((cart) => this.cartStateSubject.next(cart)),
        catchError(() => {
          const fallback = this.getEmptyCart('database');
          this.cartStateSubject.next(fallback);
          return of(fallback);
        })
      );
    }

    return this.http.get<any>(`${this.apiUrl}/guest/me`, { headers: this.guestSessionService.buildGuestHeaders() }).pipe(
      map((res) => this.normalizeIncomingCart(res?.data, 'guest')),
      tap((cart) => this.cartStateSubject.next(cart)),
      catchError(() => {
        const fallback = this.getEmptyCart('guest');
        this.cartStateSubject.next(fallback);
        return of(fallback);
      })
    );
  }

  addToCart(payload: AddToCartPayload): Observable<CartNormalized> {
    if (!payload?.productId) return of(this.cartStateSubject.value);
    const quantity = Math.max(1, Number(payload.quantity || 1));

    if (this.isLoggedIn()) {
      return this.http.post<any>(`${this.apiUrl}/me/items`, { ...payload, quantity }).pipe(
        map((res) => this.normalizeIncomingCart(res?.data, 'database')),
        tap((cart) => {
          this.cartErrorSubject.next(null);
          this.cartStateSubject.next(cart);
        }),
        catchError((err) => {
          this.handleServerError(err);
          return of(this.cartStateSubject.value);
        })
      );
    }

    return this.http.post<any>(`${this.apiUrl}/guest/items`, { ...payload, quantity }, { headers: this.guestSessionService.buildGuestHeaders() }).pipe(
      map((res) => this.normalizeIncomingCart(res?.data, 'guest')),
      tap((cart) => {
        this.cartErrorSubject.next(null);
        this.cartStateSubject.next(cart);
      }),
      catchError((err) => {
        this.handleServerError(err);
        return of(this.cartStateSubject.value);
      })
    );
  }

  updateCartItemQuantity(itemIdOrKey: string, quantity: number): Observable<CartNormalized> {
    const qty = Math.max(1, Number(quantity || 1));
    if (!itemIdOrKey) return of(this.cartStateSubject.value);

    if (this.isLoggedIn()) {
      return this.http.patch<any>(`${this.apiUrl}/me/items/${itemIdOrKey}/quantity`, { quantity: qty }).pipe(
        map((res) => this.normalizeIncomingCart(res?.data, 'database')),
        tap((cart) => {
          this.cartErrorSubject.next(null);
          this.cartStateSubject.next(cart);
        }),
        catchError((err) => {
          this.handleServerError(err);
          return of(this.cartStateSubject.value);
        })
      );
    }

    return this.http.patch<any>(`${this.apiUrl}/guest/items/${itemIdOrKey}/quantity`, { quantity: qty }, { headers: this.guestSessionService.buildGuestHeaders() }).pipe(
      map((res) => this.normalizeIncomingCart(res?.data, 'guest')),
      tap((cart) => {
        this.cartErrorSubject.next(null);
        this.cartStateSubject.next(cart);
      }),
      catchError((err) => {
        this.handleServerError(err);
        return of(this.cartStateSubject.value);
      })
    );
  }

  removeCartItem(itemIdOrKey: string): Observable<CartNormalized> {
    if (!itemIdOrKey) return of(this.cartStateSubject.value);
    if (this.isLoggedIn()) {
      return this.http.delete<any>(`${this.apiUrl}/me/items/${itemIdOrKey}`).pipe(
        map((res) => this.normalizeIncomingCart(res?.data, 'database')),
        tap((cart) => {
          this.cartErrorSubject.next(null);
          this.cartStateSubject.next(cart);
        }),
        catchError((err) => {
          this.handleServerError(err);
          return of(this.cartStateSubject.value);
        })
      );
    }

    return this.http.delete<any>(`${this.apiUrl}/guest/items/${itemIdOrKey}`, { headers: this.guestSessionService.buildGuestHeaders() }).pipe(
      map((res) => this.normalizeIncomingCart(res?.data, 'guest')),
      tap((cart) => {
        this.cartErrorSubject.next(null);
        this.cartStateSubject.next(cart);
      }),
      catchError((err) => {
        this.handleServerError(err);
        return of(this.cartStateSubject.value);
      })
    );
  }

  toggleCartItemSelection(itemIdOrKey: string, selected: boolean): Observable<CartNormalized> {
    if (!itemIdOrKey) return of(this.cartStateSubject.value);
    if (this.isLoggedIn()) {
      return this.http.patch<any>(`${this.apiUrl}/me/items/${itemIdOrKey}/selection`, { selected }).pipe(
        map((res) => this.normalizeIncomingCart(res?.data, 'database')),
        tap((cart) => {
          this.cartErrorSubject.next(null);
          this.cartStateSubject.next(cart);
        }),
        catchError((err) => {
          this.handleServerError(err);
          return of(this.cartStateSubject.value);
        })
      );
    }

    return this.http.patch<any>(`${this.apiUrl}/guest/items/${itemIdOrKey}/selection`, { selected }, { headers: this.guestSessionService.buildGuestHeaders() }).pipe(
      map((res) => this.normalizeIncomingCart(res?.data, 'guest')),
      tap((cart) => {
        this.cartErrorSubject.next(null);
        this.cartStateSubject.next(cart);
      }),
      catchError((err) => {
        this.handleServerError(err);
        return of(this.cartStateSubject.value);
      })
    );
  }

  toggleSelectAll(selected: boolean): Observable<CartNormalized> {
    if (this.isLoggedIn()) {
      return this.http.patch<any>(`${this.apiUrl}/me/selection`, { selected }).pipe(
        map((res) => this.normalizeIncomingCart(res?.data, 'database')),
        tap((cart) => {
          this.cartErrorSubject.next(null);
          this.cartStateSubject.next(cart);
        }),
        catchError((err) => {
          this.handleServerError(err);
          return of(this.cartStateSubject.value);
        })
      );
    }

    return this.http.patch<any>(`${this.apiUrl}/guest/selection`, { selected }, { headers: this.guestSessionService.buildGuestHeaders() }).pipe(
      map((res) => this.normalizeIncomingCart(res?.data, 'guest')),
      tap((cart) => {
        this.cartErrorSubject.next(null);
        this.cartStateSubject.next(cart);
      }),
      catchError((err) => {
        this.handleServerError(err);
        return of(this.cartStateSubject.value);
      })
    );
  }

  removeSelectedItems(): Observable<CartNormalized> {
    if (this.isLoggedIn()) {
      return this.http.delete<any>(`${this.apiUrl}/me/items-selected`).pipe(
        map((res) => this.normalizeIncomingCart(res?.data, 'database')),
        tap((cart) => {
          this.cartErrorSubject.next(null);
          this.cartStateSubject.next(cart);
        }),
        catchError((err) => {
          this.handleServerError(err);
          return of(this.cartStateSubject.value);
        })
      );
    }

    return this.http.delete<any>(`${this.apiUrl}/guest/items-selected`, { headers: this.guestSessionService.buildGuestHeaders() }).pipe(
      map((res) => this.normalizeIncomingCart(res?.data, 'guest')),
      tap((cart) => {
        this.cartErrorSubject.next(null);
        this.cartStateSubject.next(cart);
      }),
      catchError((err) => {
        this.handleServerError(err);
        return of(this.cartStateSubject.value);
      })
    );
  }

  prepareCheckout(): Observable<{ success: boolean; data: CartNormalized; issues: Array<{ code: string; message: string; cartItemId?: string }> }> {
    if (this.isLoggedIn()) {
      return this.http.get<any>(`${this.apiUrl}/me/checkout-prepare`).pipe(
        map((res) => ({
          success: !!res?.success,
          data: this.normalizeIncomingCart(res?.data, 'database'),
          issues: Array.isArray(res?.issues) ? res.issues : [],
        })),
        tap((result) => {
          this.cartStateSubject.next(result.data);
          this.cartErrorSubject.next(result.success ? null : { code: 'CHECKOUT_PREP_FAILED', message: 'Cart requires review before checkout' });
        }),
        catchError((err) => {
          this.handleServerError(err);
          return of({ success: false, data: this.cartStateSubject.value, issues: [] });
        })
      );
    }

    return this.http.get<any>(`${this.apiUrl}/guest/checkout-prepare`, { headers: this.guestSessionService.buildGuestHeaders() }).pipe(
      map((res) => ({
        success: !!res?.success,
        data: this.normalizeIncomingCart(res?.data, 'guest'),
        issues: Array.isArray(res?.issues) ? res.issues : [],
      })),
      tap((result) => {
        this.cartStateSubject.next(result.data);
      }),
      catchError((err) => {
        this.handleServerError(err);
        return of({ success: false, data: this.cartStateSubject.value, issues: [] });
      })
    );
  }

  getCartSummary(): Observable<CartSummary> {
    return this.cartState$.pipe(map((cart) => cart.summary));
  }

  clearCart(): Observable<CartNormalized> {
    return this.toggleSelectAll(true).pipe(
      switchMap(() => this.removeSelectedItems()),
      catchError(() => of(this.cartStateSubject.value))
    );
  }

  /** Merge DB guest cart into customer cart after login; requires JWT + x-guest-session-id. */
  mergeGuestCartOnLogin(): Observable<CartNormalized> {
    if (!this.isLoggedIn()) return of(this.cartStateSubject.value);
    return this.http.post<any>(`${this.apiUrl}/me/merge-guest`, {}, { headers: this.guestSessionService.buildGuestHeaders() }).pipe(
      map((res) => this.normalizeIncomingCart(res?.data, 'database')),
      tap((cart) => {
        this.cartErrorSubject.next(null);
        this.cartStateSubject.next(cart);
      }),
      catchError((err) => {
        this.handleServerError(err);
        return this.getCurrentCart();
      })
    );
  }

  /** Call after logout + fresh guest session: clears in-memory cart then loads guest cart from API. */
  resetAfterLogout(): Observable<CartNormalized> {
    this.cartErrorSubject.next(null);
    this.cartStateSubject.next(this.getEmptyCart('guest'));
    return this.getCurrentCart();
  }

  private bootstrapCart(): void {
    this.getCurrentCart().subscribe();
  }

  private isLoggedIn(): boolean {
    const token = this.authService.getToken();
    if (!token) return false;
    const payload = this.decodeJwtPayload(token);
    const exp = Number(payload?.['exp'] || 0);
    if (exp > 0 && exp * 1000 <= Date.now()) return false;
    const accountType = String(payload?.['account_type'] || payload?.['accountType'] || '').toLowerCase();
    return accountType === 'customer' || accountType === 'admin';
  }

  private decodeJwtPayload(token: string): Record<string, any> | null {
    try {
      const parts = token.split('.');
      if (parts.length < 2 || !parts[1]) return null;
      const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
      const raw = atob(padded);
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  private normalizeIncomingCart(input: Partial<CartNormalized> | null | undefined, forceSource: 'database' | 'guest'): CartNormalized {
    const items = Array.isArray(input?.items)
      ? input.items.map((item) => ({
          cartItemId: String(item.cartItemId || ''),
          productId: String(item.productId || ''),
          variantId: item.variantId ?? null,
          productName: item.productName || '',
          brandName: item.brandName || '',
          variantLabel: item.variantLabel || '',
          imageUrl: item.imageUrl || '',
          unitPrice: Number(item.unitPrice || 0),
          compareAtPrice: item.compareAtPrice != null ? Number(item.compareAtPrice) : null,
          discountPercent: Number(item.discountPercent || 0),
          quantity: Math.max(1, Number(item.quantity || 1)),
          selected: item.selected !== false,
          stockStatus: item.stockStatus || 'in_stock',
          lineSubtotal: Number(item.lineSubtotal || Number(item.unitPrice || 0) * Math.max(1, Number(item.quantity || 1))),
          lineTotal: Number(item.lineTotal || Number(item.unitPrice || 0) * Math.max(1, Number(item.quantity || 1))),
        }))
      : [];

    const summary = this.computeSummary(items);
    const guestSessionId = input?.guestSessionId != null ? String(input.guestSessionId) : null;
    return {
      cartId: input?.cartId != null ? String(input.cartId) : null,
      source: forceSource,
      customerId: input?.customerId != null ? String(input.customerId) : null,
      guestSessionId: forceSource === 'guest' ? guestSessionId : null,
      items,
      summary,
      updatedAt: new Date().toISOString(),
    };
  }

  private getEmptyCart(source: 'database' | 'guest'): CartNormalized {
    return {
      cartId: null,
      source,
      customerId: null,
      guestSessionId: null,
      items: [],
      summary: this.computeSummary([]),
      updatedAt: new Date().toISOString(),
    };
  }

  private computeSummary(items: CartItemNormalized[]): CartSummary {
    const itemCount = items.length;
    const selectedItems = items.filter((item) => item.selected);
    const selectedCount = selectedItems.length;
    const totalQuantity = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = selectedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const discountTotal = selectedItems.reduce((sum, item) => {
      if (!item.compareAtPrice || item.compareAtPrice <= item.unitPrice) return sum;
      return sum + (item.compareAtPrice - item.unitPrice) * item.quantity;
    }, 0);
    const qualifiesForFreeShipping = selectedCount > 0 && subtotal >= this.freeShippingThreshold;
    const shippingFee = selectedCount === 0 ? 0 : qualifiesForFreeShipping ? 0 : this.shippingFeeDefault;
    const grandTotal = Math.max(0, subtotal - discountTotal + shippingFee);
    const amountToFreeShipping = qualifiesForFreeShipping ? 0 : Math.max(0, this.freeShippingThreshold - subtotal);

    return {
      itemCount,
      selectedCount,
      totalQuantity,
      subtotal,
      discountTotal,
      shippingFee,
      grandTotal,
      qualifiesForFreeShipping,
      amountToFreeShipping,
    };
  }

  private handleServerError(err: any): void {
    const code = String(err?.error?.code || 'CART_ERROR');
    const fallback = String(err?.error?.message || 'Cart request failed');
    const mapByCode: Record<string, string> = {
      INSUFFICIENT_STOCK: 'Số lượng vượt quá tồn kho hiện tại.',
      PRODUCT_UNAVAILABLE: 'Sản phẩm hiện không còn khả dụng.',
      VARIANT_UNAVAILABLE: 'Phân loại này hiện không còn khả dụng.',
      PRICE_CHANGED: 'Giá sản phẩm đã thay đổi. Vui lòng kiểm tra lại.',
      GUEST_CART_INVALID: 'Giỏ hàng tạm bị lỗi và đã được khôi phục.',
    };
    const message = mapByCode[code] || fallback;
    this.cartErrorSubject.next({ code, message });
  }
}
