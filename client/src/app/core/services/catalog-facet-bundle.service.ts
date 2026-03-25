import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, forkJoin, map, of, shareReplay } from 'rxjs';
import {
  CatalogFacetService,
  InventoryBalanceRow,
  ProductOptionRow,
  ProductOptionValueRow,
  ProductVariantRow,
  PromotionRow,
  ReviewSummaryRow,
} from './catalog-facet.service';
import { ProductAttributeRow, ProductAttributeService } from './product-attribute.service';

/**
 * Single-flight cached bundle of all catalog facet tables (attributes, options, variants, …).
 * Survives catalog component destroy/re-enter — avoids re-downloading large facet payloads on every visit.
 */
export interface CatalogFacetData {
  attributes: ProductAttributeRow[];
  options: ProductOptionRow[];
  optionValues: ProductOptionValueRow[];
  variants: ProductVariantRow[];
  reviewSummaries: ReviewSummaryRow[];
  inventoryBalances: InventoryBalanceRow[];
  hasActiveSystemPromotion: boolean;
}

interface CatalogFacetsApiEnvelope {
  success?: boolean;
  message?: string;
  data?: {
    attributes?: ProductAttributeRow[];
    options?: ProductOptionRow[];
    optionValues?: ProductOptionValueRow[];
    variants?: ProductVariantRow[];
    reviewSummaries?: ReviewSummaryRow[];
    inventoryBalances?: InventoryBalanceRow[];
    activePromotions?: PromotionRow[];
    hasActiveSystemPromotion?: boolean;
  };
}

const emptyFacetData = (): CatalogFacetData => ({
  attributes: [],
  options: [],
  optionValues: [],
  variants: [],
  reviewSummaries: [],
  inventoryBalances: [],
  hasActiveSystemPromotion: false,
});

@Injectable({ providedIn: 'root' })
export class CatalogFacetBundleService {
  private bundle$?: Observable<CatalogFacetData>;

  private readonly apiBase = 'http://localhost:5000/api';

  constructor(
    private readonly http: HttpClient,
    private readonly productAttributeService: ProductAttributeService,
    private readonly facetService: CatalogFacetService
  ) {}

  /**
   * First subscriber triggers HTTP; later subscribers receive replay (no duplicate network for the bundle).
   * Prefers GET /api/catalog/facets (one round-trip); falls back to parallel legacy facet endpoints if needed.
   */
  getFacetBundle(): Observable<CatalogFacetData> {
    if (!this.bundle$) {
      this.bundle$ = this.http.get<CatalogFacetsApiEnvelope>(`${this.apiBase}/catalog/facets`).pipe(
        map((res) => this.normalizeCatalogFacetPayload(res.data)),
        catchError(() => this.loadFacetBundleLegacy()),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }
    return this.bundle$;
  }

  private normalizeCatalogFacetPayload(
    data: CatalogFacetsApiEnvelope['data'] | undefined
  ): CatalogFacetData {
    if (!data) return emptyFacetData();
    const promos = data.activePromotions ?? [];
    return {
      attributes: (data.attributes ?? []) as ProductAttributeRow[],
      options: (data.options ?? []) as ProductOptionRow[],
      optionValues: (data.optionValues ?? []) as ProductOptionValueRow[],
      variants: (data.variants ?? []) as ProductVariantRow[],
      reviewSummaries: (data.reviewSummaries ?? []) as ReviewSummaryRow[],
      inventoryBalances: (data.inventoryBalances ?? []) as InventoryBalanceRow[],
      hasActiveSystemPromotion:
        data.hasActiveSystemPromotion ?? (promos.length > 0),
    };
  }

  /** Parallel storefrontOnly facet GETs — kept for backward compatibility if /catalog/facets fails. */
  private loadFacetBundleLegacy(): Observable<CatalogFacetData> {
    return forkJoin({
      attributes: this.productAttributeService.getAll().pipe(catchError(() => of([]))),
      options: this.facetService.getProductOptions().pipe(catchError(() => of([]))),
      optionValues: this.facetService.getProductOptionValues().pipe(catchError(() => of([]))),
      variants: this.facetService.getProductVariants().pipe(catchError(() => of([]))),
      reviewSummaries: this.facetService.getReviewSummaries().pipe(catchError(() => of([]))),
      inventoryBalances: this.facetService.getInventoryBalances().pipe(catchError(() => of([]))),
      activePromotions: this.facetService.getActivePromotions().pipe(catchError(() => of([]))),
    }).pipe(
      map(({ attributes, options, optionValues, variants, reviewSummaries, inventoryBalances, activePromotions }) => ({
        attributes: attributes as ProductAttributeRow[],
        options: options as ProductOptionRow[],
        optionValues: optionValues as ProductOptionValueRow[],
        variants: variants as ProductVariantRow[],
        reviewSummaries: reviewSummaries as ReviewSummaryRow[],
        inventoryBalances: inventoryBalances as InventoryBalanceRow[],
        hasActiveSystemPromotion: activePromotions.length > 0,
      })),
      catchError(() => of(emptyFacetData()))
    );
  }
}
