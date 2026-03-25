import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ProductCardComponent } from '../../../../../home/pages/components/product-card/product-card';
import { Product } from '../../../../../../core/models/product.model';
import { ProductService } from '../../../../../../core/services/product.service';
import { catchError, map, of } from 'rxjs';

interface CacheEntry {
  expiresAt: number;
  products: Product[];
}

@Component({
  selector: 'app-same-brand-section',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  templateUrl: './same-brand.component.html',
  styleUrl: './same-brand.component.css',
})
export class SameBrandSectionComponent implements OnChanges {
  @Input() currentProductId = '';
  @Input() currentBrandId = '';
  @Input() currentCategoryId = '';

  loading = true;
  hasError = false;
  products: Product[] = [];

  // Short in-memory cache to avoid hammering the API.
  private static readonly cache = new Map<string, CacheEntry>();
  private static readonly ttlMs = 60_000;

  constructor(private readonly productService: ProductService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['currentProductId'] ||
      changes['currentBrandId'] ||
      changes['currentCategoryId']
    ) {
      void this.refresh();
    }
  }

  private get cacheKey(): string {
    return `${this.currentBrandId}|${this.currentCategoryId}|${this.currentProductId}`;
  }

  private refresh(): Promise<void> {
    this.loading = true;
    this.hasError = false;
    this.products = [];

    if (!this.currentBrandId || !this.currentProductId) {
      this.loading = false;
      return Promise.resolve();
    }

    const now = Date.now();
    const cached = SameBrandSectionComponent.cache.get(this.cacheKey);
    if (cached && cached.expiresAt > now) {
      this.products = cached.products;
      this.loading = false;
      this.hasError = false;
      return Promise.resolve();
    }

    // Spec: GET /api/products?brandId=...&excludeProductId=...&limit=12
    // Sort priority (same category first, then best-selling/newest) is applied client-side.
    return new Promise((resolve) => {
      this.productService
        .getPaginatedProducts(1, 12, {
          brandId: this.currentBrandId,
          excludeProductId: this.currentProductId,
          sort: 'popular',
          fields: 'card',
        })
        .pipe(
          map((res) => res.data ?? []),
          map((rows) => {
            const categoryId = this.currentCategoryId;
            const sameCategory = categoryId
              ? rows.filter((p) => String(p.categoryId?._id ?? '') === String(categoryId))
              : [];
            const rest = categoryId ? rows.filter((p) => !sameCategory.includes(p)) : rows;
            return [...sameCategory, ...rest].slice(0, 12);
          }),
          catchError(() => of([] as Product[]))
        )
        .subscribe({
          next: (rows) => {
            this.products = rows;
            SameBrandSectionComponent.cache.set(this.cacheKey, {
              expiresAt: now + SameBrandSectionComponent.ttlMs,
              products: rows,
            });
            this.loading = false;
            resolve();
          },
          error: () => {
            this.loading = false;
            this.hasError = true;
            resolve();
          },
        });
    });
  }

  trackById(_: number, p: Product): string {
    return p._id;
  }
}

