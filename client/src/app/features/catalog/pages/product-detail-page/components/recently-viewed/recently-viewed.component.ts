import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { ProductCardComponent } from '../../../../../home/pages/components/product-card/product-card';
import { Product } from '../../../../../../core/models/product.model';
import { ProductService } from '../../../../../../core/services/product.service';
import { catchError, debounceTime, map, of, Subject, switchMap, takeUntil } from 'rxjs';

type RecentlyViewedState = {
  productIds: string[];
  updatedAt: number;
};

@Component({
  selector: 'app-recently-viewed-section',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  templateUrl: './recently-viewed.component.html',
  styleUrl: './recently-viewed.component.css',
})
export class RecentlyViewedSectionComponent implements OnChanges, OnDestroy {
  @Input() currentProductId = '';

  loading = true;
  products: Product[] = [];
  hasError = false;

  private readonly storageKey = 'recently_viewed';
  private readonly update$ = new Subject<void>();
  private readonly destroy$ = new Subject<void>();

  constructor(private readonly productService: ProductService) {
    this.update$
      .pipe(
        debounceTime(300),
        switchMap(() => this.loadFromStorageAndFetch()),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (rows) => {
          this.products = rows;
          this.loading = false;
          this.hasError = false;
        },
        error: () => {
          this.products = [];
          this.loading = false;
          this.hasError = true;
        },
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentProductId']) {
      this.loading = true;
      this.hasError = false;
      this.products = [];
      if (this.currentProductId) {
        // Debounce storage update + API fetch for smoother UX.
      }
      this.update$.next();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private readState(): RecentlyViewedState {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return { productIds: [], updatedAt: 0 };
      const parsed = JSON.parse(raw) as Partial<RecentlyViewedState> & { productIds?: unknown };
      const ids = Array.isArray(parsed.productIds) ? parsed.productIds : [];
      const productIds = ids.map((x) => String(x)).filter(Boolean);
      const updatedAt = Number(parsed.updatedAt ?? 0);
      return { productIds, updatedAt: Number.isFinite(updatedAt) ? updatedAt : 0 };
    } catch {
      return { productIds: [], updatedAt: 0 };
    }
  }

  private writeState(next: RecentlyViewedState): void {
    const safe: RecentlyViewedState = {
      productIds: (next.productIds ?? []).map((x) => String(x)).filter(Boolean),
      updatedAt: Date.now(),
    };
    localStorage.setItem(this.storageKey, JSON.stringify(safe));
  }

  /**
   * Guest logic:
   * - Add product id to the top
   * - Remove duplicates
   * - Limit to 20 items
   */
  private trackRecentlyViewed(productId: string): void {
    const state = this.readState();
    const next = [productId, ...(state.productIds ?? []).filter((x) => x !== productId)].slice(0, 20);
    this.writeState({ productIds: next, updatedAt: Date.now() });
  }

  private loadFromStorageAndFetch() {
    if (this.currentProductId) this.trackRecentlyViewed(this.currentProductId);
    const state = this.readState();
    const orderedIds = state.productIds ?? [];

    // Fetch up to 20, then we slice UI to max ~12.
    const idsToFetch = orderedIds
      .filter((id) => id && id !== this.currentProductId)
      .slice(0, 20);

    if (!idsToFetch.length) return of([] as Product[]);

    const idsParam = idsToFetch.join(',');
    return this.productService
      .getPaginatedProducts(1, 20, {
        ids: idsParam,
        fields: 'card',
      })
      .pipe(
        map((res) => res.data ?? []),
        map((rows) => {
          // Preserve "recent" order from localStorage.
          const byId = new Map(rows.map((p) => [p._id, p]));
          const ordered = idsToFetch.map((id) => byId.get(id)).filter((p): p is Product => !!p);
          return ordered.slice(0, 12);
        }),
        catchError(() => of([] as Product[]))
      );
  }

  trackById(_: number, p: Product): string {
    return p._id;
  }

  get shouldShowSection(): boolean {
    return this.loading || this.products.length > 0;
  }
}

