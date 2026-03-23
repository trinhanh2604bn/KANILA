import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, shareReplay } from 'rxjs';
import { Product } from '../models/product.model';
import { HeaderSearchProductItem } from '../models/header.model';

@Injectable({ providedIn: 'root' })
export class ProductService {

  private apiUrl = 'http://localhost:5000/api/products';
  private headerSearchSource$?: Observable<Product[]>;

  constructor(private http: HttpClient) {}
  getProducts(): Observable<Product[]> {
    return this.http
      .get<{ success?: boolean; data?: Product[] }>(this.apiUrl)
      .pipe(map((res) => res.data ?? []));
  }

  getProductBySlug(slug: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/slug/${slug}`);
  }

  searchHeaderProducts(keyword: string, limit = 6): Observable<HeaderSearchProductItem[]> {
    const q = keyword.trim().toLowerCase();
    if (!q) return of([]);

    return this.getHeaderSearchSource().pipe(
      map((products) =>
        products
          .filter((p) => this.isDisplayable(p))
          .filter((p) => {
            const name = (p.productName ?? '').toLowerCase();
            const slug = (p.slug ?? '').toLowerCase();
            const code = (p.productCode ?? '').toLowerCase();
            return name.includes(q) || slug.includes(q) || code.includes(q);
          })
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

  private getHeaderSearchSource(): Observable<Product[]> {
    if (!this.headerSearchSource$) {
      this.headerSearchSource$ = this.getProducts().pipe(shareReplay(1));
    }
    return this.headerSearchSource$;
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