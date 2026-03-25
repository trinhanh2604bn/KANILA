import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CartService } from '../../cart/services/cart.service';

export interface WishlistMeView {
  count: number;
  items?: Array<{ productId: string; variantId?: string | null; wishlistId?: string }>;
}

export interface WishlistItemView {
  _id: string;
  wishlistId: string;
  productId?: { _id: string; productName: string; imageUrl?: string; price?: number } | null;
  variantId?: { _id: string; variantName?: string; sku?: string } | null;
}

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly api = 'http://localhost:5000/api/wishlist';
  private readonly wishedProductIds$ = new BehaviorSubject<Set<string>>(new Set<string>());
  readonly wishedProductIdsState$ = this.wishedProductIds$.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly cartService: CartService
  ) {}

  getMe(): Observable<WishlistMeView | null> {
    return this.http.get<any>(`${this.api}/me`).pipe(
      map((res) => (res?.data || null) as WishlistMeView),
      catchError(() => of(null))
    );
  }

  getMyItems(): Observable<WishlistItemView[]> {
    return this.http.get<any>(`${this.api}/me/items`).pipe(
      map((res) => (Array.isArray(res?.data?.items) ? res.data.items : []) as WishlistItemView[]),
      catchError(() => of([]))
    );
  }

  removeMyItem(id: string): Observable<void> {
    return this.http.delete<any>(`${this.api}/me/items/${id}`).pipe(
      map(() => void 0)
    );
  }

  addProduct(productId: string, variantId?: string | null): Observable<boolean> {
    if (!productId) return of(false);
    const prev = this.cloneSet(this.wishedProductIds$.value);
    this.wishedProductIds$.next(new Set<string>([...prev, productId]));
    return this.http.post<any>(this.api, { productId, variantId: variantId || null }).pipe(
      map((res) => !!res?.success),
      catchError(() => {
        this.wishedProductIds$.next(prev);
        return of(false);
      })
    );
  }

  removeProductByProductId(productId: string): Observable<boolean> {
    if (!productId) return of(false);
    const prev = this.cloneSet(this.wishedProductIds$.value);
    const next = this.cloneSet(prev);
    next.delete(productId);
    this.wishedProductIds$.next(next);
    return this.http.delete<any>(`${this.api}/${productId}`).pipe(
      map((res) => !!res?.success),
      catchError(() => {
        this.wishedProductIds$.next(prev);
        return of(false);
      })
    );
  }

  toggleProduct(productId: string, variantId?: string | null): Observable<boolean> {
    if (this.isWishlisted(productId)) return this.removeProductByProductId(productId);
    return this.addProduct(productId, variantId);
  }

  isWishlisted(productId: string): boolean {
    return this.wishedProductIds$.value.has(productId);
  }

  isWishlisted$(productId: string): Observable<boolean> {
    return this.wishedProductIds$.pipe(map((s) => s.has(productId)));
  }

  syncWishlistState(): Observable<Set<string>> {
    return this.getMe().pipe(
      map((me) => {
        const ids = new Set<string>((me?.items || []).map((x) => String(x.productId || '')).filter(Boolean));
        this.wishedProductIds$.next(ids);
        return ids;
      }),
      catchError(() => of(this.wishedProductIds$.value))
    );
  }

  clearLocalState(): void {
    this.wishedProductIds$.next(new Set());
  }

  addToCart(productId: string, variantId?: string | null, quantity = 1): Observable<void> {
    return this.cartService.addToCart({ productId, variantId: variantId ?? null, quantity }).pipe(map(() => void 0));
  }

  private cloneSet(source: Set<string>): Set<string> {
    return new Set<string>(Array.from(source));
  }
}
