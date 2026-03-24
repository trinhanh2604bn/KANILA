import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { AddToCartPayload, CartItemNormalized, CartNormalized, CartSummary } from '../models/cart.model';
import { AuthService } from '../../../core/services/auth.service';
import { GuestSessionService } from '../../../core/services/guest-session.service';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly apiUrl = 'http://localhost:5000/api/carts';
  private readonly guestCartKey = 'kanila_guest_cart';
  private readonly freeShippingThreshold = 499000;
  private readonly shippingFeeDefault = 30000;
  private memoryGuestCart: CartNormalized | null = null;
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
          if (this.isAuthError(err)) {
            const fallbackCart = this.addToGuestCart(payload, quantity);
            this.cartErrorSubject.next(null);
            this.cartStateSubject.next(fallbackCart);
            return of(fallbackCart);
          }
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
    if (this.isLoggedIn()) {
      return this.toggleSelectAll(true).pipe(
        map(() => this.cartStateSubject.value),
        tap(() => this.removeSelectedItems().subscribe())
      );
    }
    const empty = this.getEmptyCart('guest');
    localStorage.setItem(this.guestCartKey, JSON.stringify(empty));
    this.cartStateSubject.next(empty);
    return of(empty);
  }

  syncGuestCartAfterLogin(): Observable<CartNormalized> {
    if (!this.isLoggedIn()) return of(this.cartStateSubject.value);
    const guestCart = this.readGuestCart();
    if (!guestCart.items.length) return this.getCurrentCart();

    const queue = guestCart.items.filter((item) => !!item.productId && Number(item.quantity || 0) > 0);
    if (!queue.length) {
      localStorage.removeItem(this.guestCartKey);
      return this.getCurrentCart();
    }
    // Run sequentially with imperative fallback to keep code compact.
    // TODO: switch to backend bulk merge endpoint when available.
    return new Observable<CartNormalized>((subscriber) => {
      const processNext = (idx: number) => {
        if (idx >= queue.length) {
          localStorage.removeItem(this.guestCartKey);
          this.getCurrentCart().subscribe({
            next: (cart) => {
              subscriber.next(cart);
              subscriber.complete();
            },
            error: (err) => subscriber.error(err),
          });
          return;
        }
        this.addToCart({
          productId: queue[idx].productId,
          variantId: queue[idx].variantId,
          quantity: Math.max(1, Number(queue[idx].quantity || 1)),
          productName: queue[idx].productName,
          brandName: queue[idx].brandName,
          variantLabel: queue[idx].variantLabel,
          imageUrl: queue[idx].imageUrl,
          unitPrice: queue[idx].unitPrice,
          compareAtPrice: queue[idx].compareAtPrice,
          stockStatus: queue[idx].stockStatus,
        }).subscribe({
          next: () => processNext(idx + 1),
          error: () => processNext(idx + 1),
        });
      };
      processNext(0);
    });
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

  private isAuthError(err: any): boolean {
    const status = Number(err?.status || err?.error?.status || 0);
    return status === 401 || status === 403;
  }

  private addToGuestCart(payload: AddToCartPayload, quantity: number): CartNormalized {
    const cart = this.readGuestCart();
    const variantId = payload.variantId || null;
    const existing = cart.items.find((item) => item.productId === payload.productId && (item.variantId || null) === variantId);

    if (existing) {
      existing.quantity = Math.max(1, existing.quantity + quantity);
      existing.selected = true;
    } else {
      cart.items.unshift(this.createGuestItem(payload, quantity));
    }

    return this.persistGuestCart(cart);
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

  private createGuestItem(payload: AddToCartPayload, quantity: number): CartItemNormalized {
    const key = `${payload.productId}::${payload.variantId || 'default'}`;
    const unitPrice = Number(payload.unitPrice || 0);
    const compare = Number(payload.compareAtPrice || 0);
    return {
      cartItemId: `guest-${key}`,
      lineKey: key,
      productId: payload.productId,
      variantId: payload.variantId || null,
      productName: payload.productName || 'Product',
      brandName: payload.brandName || '',
      variantLabel: payload.variantLabel || '',
      imageUrl: payload.imageUrl || '',
      unitPrice,
      compareAtPrice: compare > unitPrice ? compare : null,
      discountPercent: compare > unitPrice ? Math.round(((compare - unitPrice) / compare) * 100) : 0,
      quantity,
      selected: true,
      stockStatus: payload.stockStatus || 'in_stock',
      lineSubtotal: unitPrice * quantity,
      lineTotal: unitPrice * quantity,
    };
  }

  private readGuestCart(): CartNormalized {
    try {
      const raw = this.readStorage(this.guestCartKey);
      if (!raw) return this.memoryGuestCart ?? this.getEmptyCart('guest');
      const parsed = JSON.parse(raw) as CartNormalized;
      if (!parsed || !Array.isArray(parsed.items)) {
        const empty = this.getEmptyCart('guest');
        this.writeStorage(this.guestCartKey, JSON.stringify(empty));
        this.memoryGuestCart = empty;
        return empty;
      }
      const normalized = this.normalizeIncomingCart(parsed, 'guest');
      this.memoryGuestCart = normalized;
      return normalized;
    } catch {
      const empty = this.getEmptyCart('guest');
      this.memoryGuestCart = empty;
      this.writeStorage(this.guestCartKey, JSON.stringify(empty));
      this.cartErrorSubject.next({ code: 'GUEST_CART_INVALID', message: 'Recovered malformed local cart' });
      return empty;
    }
  }

  private persistGuestCart(cart: CartNormalized): CartNormalized {
    const normalized = this.normalizeIncomingCart(cart, 'guest');
    this.writeStorage(this.guestCartKey, JSON.stringify(normalized));
    this.memoryGuestCart = normalized;
    this.cartErrorSubject.next(null);
    this.cartStateSubject.next(normalized);
    return normalized;
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
    return {
      cartId: input?.cartId || (forceSource === 'guest' ? 'guest-cart' : null),
      source: forceSource,
      customerId: input?.customerId || null,
      items,
      summary,
      updatedAt: new Date().toISOString(),
    };
  }

  private getEmptyCart(source: 'database' | 'guest'): CartNormalized {
    return {
      cartId: source === 'guest' ? 'guest-cart' : null,
      source,
      customerId: null,
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

  private readStorage(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private writeStorage(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Storage can be unavailable (private mode/quota). Keep in-memory fallback.
      this.memoryGuestCart = this.normalizeIncomingCart(JSON.parse(value), 'guest');
    }
  }
}
