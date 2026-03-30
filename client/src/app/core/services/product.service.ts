import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { Product } from '../models/product.model';
import { HeaderSearchProductItem } from '../models/header.model';

/** Response shape when GET /api/products includes `page` (pagination enabled on the server). */
export interface PaginatedProductsResponse {
  success?: boolean;
  message?: string;
  data: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  count?: number;
}

@Injectable({ providedIn: 'root' })
export class ProductService {

  private apiUrl = 'http://localhost:5000/api/products';

  constructor(private http: HttpClient) {}

  /**
   * Legacy full list (no `page` query) — **downloads the entire product collection**.
   * Kept for backward compatibility; **do not use** for new UI — prefer {@link getPaginatedProducts}
   * or {@link getHomeFeaturedProducts} / {@link getHomeSliderProducts} / {@link getHomeDiscoverPool}.
   */
  getProducts(): Observable<Product[]> {
    return this.http
      .get<{ success?: boolean; data?: Product[] }>(this.apiUrl)
      .pipe(map((res) => res.data ?? []));
  }

  /**
   * Lightweight full collection (no pagination) using listing card fields.
   * Useful for catalog filter UIs that still do in-memory filtering.
   */
  getCardProducts(): Observable<Product[]> {
    return this.http
      .get<{ success?: boolean; data?: Product[] }>(this.apiUrl, { params: { fields: 'card' } })
      .pipe(map((res) => res.data ?? []));
  }

  /** Home hero “nổi bật”: top sellers by `bought` (server `sort=popular`). */
  getHomeFeaturedProducts(limit = 3): Observable<Product[]> {
    const cap = Math.min(50, Math.max(1, limit));
    return this.getPaginatedProducts(1, cap, { sort: 'popular', fields: 'card' }).pipe(map((res) => res.data ?? []));
  }

  /**
   * Home product carousel: bounded pool sorted by the given key (client still paginates 5 per "page" in the slider).
   * Uses one HTTP request instead of loading the full catalog.
   */
  getHomeSliderProducts(limit = 50, sort: string = 'popular'): Observable<Product[]> {
    const cap = Math.min(50, Math.max(5, limit));
    return this.getPaginatedProducts(1, cap, { sort, fields: 'card' }).pipe(map((res) => res.data ?? []));
  }

  /**
   * “Discover” grid random sample: server returns a popular pool; component shuffles and slices locally.
   * Max 100 matches backend page-size cap.
   */
  getHomeDiscoverPool(limit = 100): Observable<Product[]> {
    const cap = Math.min(100, Math.max(1, limit));
    return this.getPaginatedProducts(1, cap, { sort: 'popular', fields: 'card' }).pipe(map((res) => res.data ?? []));
  }

  /**
   * Paginated storefront listing: GET /api/products?page=&limit=&…
   * Server applies categoryId, brandId, min/max price, minRating, sort, saleOnly, etc.
   */
  getPaginatedProducts(
    page: number,
    limit: number,
    query: Record<string, string | number | boolean | null | undefined>
  ): Observable<PaginatedProductsResponse> {
    let params = new HttpParams().set('page', String(Math.max(1, page))).set('limit', String(Math.max(1, limit)));
    for (const [key, raw] of Object.entries(query)) {
      if (raw === undefined || raw === null || raw === '') continue;
      params = params.set(key, String(raw));
    }
    return this.http.get<PaginatedProductsResponse>(this.apiUrl, { params }).pipe(
      map((res) => ({
        ...res,
        data: res.data ?? [],
        total: res.total ?? 0,
        page: res.page ?? page,
        limit: res.limit ?? limit,
        totalPages: Math.max(1, res.totalPages ?? 1),
      }))
    );
  }

  getProductBySlug(slug: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/slug/${slug}`);
  }

  /**
   * Server-side search: `GET /api/products?page=1&limit=&search=…` (requires backend `search` / `q` on paginated listing).
   */
  searchProductsPreview(keyword: string, limit = 8): Observable<Product[]> {
    const q = keyword.trim();
    if (!q) return of([]);
    const cap = Math.min(100, Math.max(1, limit));
    return this.getPaginatedProducts(1, cap, { search: q, fields: 'card' }).pipe(map((res) => res.data ?? []));
  }

  searchHeaderProducts(keyword: string, limit = 6): Observable<HeaderSearchProductItem[]> {
    const q = keyword.trim();
    if (!q) return of([]);

    return this.searchProductsPreview(q, limit).pipe(
      map((products) =>
        products
          .filter((p) => this.isDisplayable(p))
          .slice(0, limit)
          .map((p) => ({
            id: p._id,
            name: p.productName,
            slug: p.slug,
            productCode: p.productCode,
            imageUrl: this.resolveImage(p),
            brandName: p.brandId?.brandName,
            price: p.price,
          }))
      )
    );
  }

  private isDisplayable(p: Product): boolean {
    if (p.productStatus === 'inactive') return false;
    if (p.isActive === false) return false;
    return true;
  }

  private resolveImage(p: Product): string {
    const media = p.productMedia ?? [];
    if (media.length > 0) {
      const sorted = [...media].sort((a, b) => {
        if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
        return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      });
      if (sorted[0]?.mediaUrl) return sorted[0].mediaUrl;
    }
    return p.imageUrl ?? '';
  }
}
