import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, concat, forkJoin, map, of, switchMap } from 'rxjs';
import { Product, ProductMediaItem } from '../../../core/models/product.model';
import { HeaderCategoryItem } from '../../../core/models/header.model';
import { CategoryService } from '../../../core/services/category.service';
import { ProductService } from '../../../core/services/product.service';
import {
  ProductDetailContentSections,
  ProductDetailData,
  ProductDetailHighlights,
  ProductDetailImage,
  ProductDetailRecommendation,
  ProductDetailReview,
  ProductDetailVariant,
} from '../models/product-detail.model';

interface ApiResponse<T> {
  success?: boolean;
  data?: T;
}

interface ProductMediaRow {
  _id: string;
  productId: string;
  mediaUrl: string;
  altText?: string;
  sortOrder?: number;
  isPrimary?: boolean;
}

interface ProductVariantRow {
  _id: string;
  productId: string;
  sku: string;
  variantName: string;
}

interface InventoryBalanceRow {
  _id: string;
  variantId: string | { _id?: string };
  availableQty?: number;
}

interface ReviewRow {
  _id: string;
  rating: number;
  reviewTitle?: string;
  reviewContent?: string;
  verifiedPurchaseFlag?: boolean;
  helpfulCount?: number;
  createdAt?: string;
  customer_id?: { full_name?: string };
  variantId?: { variantName?: string };
}

interface ReviewMediaRow {
  _id: string;
  reviewId: string;
  mediaUrl: string;
}

interface ReviewSummaryRow {
  productId: string;
  reviewCount?: number;
  averageRating?: number;
  rating1Count?: number;
  rating2Count?: number;
  rating3Count?: number;
  rating4Count?: number;
  rating5Count?: number;
}

interface WishlistItemRow {
  _id: string;
  productId: string | { _id?: string };
}

interface PdpBuildOptions {
  /** First paint: omit demo reviews when the list is still loading. */
  skipReviewFallback?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProductDetailService {
  private readonly apiBase = 'http://localhost:5000/api';

  constructor(
    private readonly http: HttpClient,
    private readonly categoryService: CategoryService,
    private readonly productService: ProductService
  ) {}

  /**
   * Emits twice when successful: (1) core PDP data for fast first paint, (2) full data with recommendations + reviews + wishlist.
   */
  getProductDetail(slugOrId: string): Observable<ProductDetailData | null> {
    return this.loadProduct(slugOrId).pipe(
      switchMap((product) => {
        if (!product) return of(null);
        return this.loadCoreBundle(product).pipe(
          switchMap((core) => {
            if (!core) return of(null);
            const first = this.buildFrom(
              product,
              [],
              core.categories,
              core.medias,
              core.variants,
              core.inventory,
              core.reviewSummary,
              [],
              [],
              [],
              { skipReviewFallback: true }
            );
            if (!first) return of(null);
            const second$ = forkJoin({
              sec: this.loadSecondaryBundle(product),
              full: this.loadProductFullById(product._id),
            }).pipe(
              map(({ sec, full }) =>
                this.buildFrom(
                  full ?? product,
                  sec.relatedProducts,
                  core.categories,
                  core.medias,
                  core.variants,
                  core.inventory,
                  core.reviewSummary,
                  sec.reviews,
                  sec.reviewMedia,
                  sec.wishlistItems
                )
              ),
              catchError(() => of(first))
            );
            return concat(of(first), second$);
          }),
          catchError(() => of(null))
        );
      }),
      catchError(() => of(null))
    );
  }

  private buildFrom(
    product: Product | null,
    relatedProducts: Product[],
    categories: HeaderCategoryItem[],
    medias: ProductMediaRow[],
    variants: ProductVariantRow[],
    inventory: InventoryBalanceRow[],
    reviewSummary: ReviewSummaryRow | null,
    reviews: ReviewRow[],
    reviewMedia: ReviewMediaRow[],
    wishlistItems: WishlistItemRow[],
    opts?: PdpBuildOptions
  ): ProductDetailData | null {
    if (!product) return null;

    const images = this.mapImages(product, medias);
    const variantList = this.mapVariants(variants, inventory);
    const ratingDist = this.mapRatingDistribution(reviewSummary, reviews);
    const reviewList = this.mapReviews(reviews, reviewMedia);
    const useDemoReviews = !opts?.skipReviewFallback && reviewList.length === 0;
    const reviewsOut = useDemoReviews ? this.buildFallbackReviews() : reviewList;
    const breadcrumb = this.findCategoryPath(product.categoryId?._id ?? '', categories);
    const currentPrice = Number(product.price ?? 0);
    const oldPrice =
      Number(product.compareAtPrice ?? 0) > currentPrice ? Number(product.compareAtPrice) : undefined;
    const discountPercent = oldPrice ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100) : 0;
    const wishlistCount = wishlistItems.filter((w) => this.refId(w.productId) === product._id).length;

    const sameBrand = relatedProducts.filter((p) => p._id !== product._id && p.brandId?._id === product.brandId?._id);
    const similar = relatedProducts.filter((p) => p._id !== product._id && p.categoryId?._id === product.categoryId?._id);

    const frequentlyBoughtTogether = this.buildFrequentlyBoughtTogetherFallback(relatedProducts, product._id);
    const recentlyViewed = this.buildRecentlyViewed(relatedProducts, product._id);

    return {
      id: product._id,
      slug: product.slug,
      productName: product.productName,
      subtitle: product.shortDescription || 'Luminous matte finish, buildable coverage, seamless blend',
      brandName: product.brandId?.brandName ?? 'KANILA',
      brandId: this.refId(product.brandId?._id),
      categoryName: breadcrumb.categoryName || product.categoryId?.categoryName || 'Sản phẩm',
      categoryId: this.refId(product.categoryId?._id),
      parentCategoryName: breadcrumb.parentCategoryName || '',
      price: currentPrice,
      oldPrice,
      discountPercent,
      averageRating: reviewSummary?.averageRating ?? product.averageRating ?? 0,
      reviewCount: reviewSummary?.reviewCount ?? reviewsOut.length,
      soldCount: product.bought ?? 0,
      wishlistCount,
      inStock: (product.stock ?? 0) > 0 || variantList.some((v) => v.inStock),
      stockText: (product.stock ?? 0) > 0 || variantList.some((v) => v.inStock) ? 'Còn hàng' : 'Tạm hết hàng',
      shippingText: 'Giao nhanh trong 2h tại nội thành. Miễn phí đổi shade trong 7 ngày.',
      badges: this.buildBadges(product, reviewSummary),
      images,
      variants: variantList.length ? variantList : this.buildFallbackVariants(),
      highlights: this.buildHighlightsFallback(),
      content: this.buildContent(product),
      reviews: reviewsOut,
      ratingDistribution: ratingDist,
      recommendations: {
        frequentlyBoughtTogether: this.toReco(frequentlyBoughtTogether),
        similarProducts: this.toReco(similar.slice(0, 8)),
        sameBrandProducts: this.toReco(sameBrand.slice(0, 8)),
        recentlyViewed: this.toReco(recentlyViewed),
      },
      trustItems: ['100% chính hãng', 'Miễn phí ship từ 499K', 'Đổi trả 7 ngày'],
    };
  }

  /** Gallery, variants, stock, breadcrumbs, summary — kept small for first paint. */
  private loadCoreBundle(product: Product): Observable<{
    categories: HeaderCategoryItem[];
    medias: ProductMediaRow[];
    variants: ProductVariantRow[];
    inventory: InventoryBalanceRow[];
    reviewSummary: ReviewSummaryRow | null;
  } | null> {
    return forkJoin({
      categories: this.categoryService.getHeaderCategories().pipe(catchError(() => of([]))),
      medias: this.http
        .get<ApiResponse<ProductMediaRow[]>>(`${this.apiBase}/product-media/product/${product._id}`)
        .pipe(map((r) => r.data ?? []), catchError(() => of([]))),
      variants: this.http
        .get<ApiResponse<ProductVariantRow[]>>(`${this.apiBase}/product-variants/product/${product._id}`)
        .pipe(map((r) => r.data ?? []), catchError(() => of([]))),
      inventory: this.http
        .get<ApiResponse<InventoryBalanceRow[]>>(`${this.apiBase}/inventory-balances/product/${product._id}`)
        .pipe(map((r) => r.data ?? []), catchError(() => of([]))),
      reviewSummary: this.http
        .get<ApiResponse<ReviewSummaryRow>>(`${this.apiBase}/review-summary/product/${product._id}`)
        .pipe(map((r) => r.data ?? null), catchError(() => of(null))),
    }).pipe(
      catchError(() => of(null))
    );
  }

  /** Recommendations, reviews, wishlist — loaded after core PDP. */
  private loadSecondaryBundle(product: Product): Observable<{
    relatedProducts: Product[];
    reviews: ReviewRow[];
    reviewMedia: ReviewMediaRow[];
    wishlistItems: WishlistItemRow[];
  }> {
    const categoryId = this.resolveCategoryId(product);
    const related$ = this.productService
      .getPaginatedProducts(1, 72, {
        sort: 'popular',
        fields: 'card',
        ...(categoryId ? { categoryId } : {}),
      })
      .pipe(map((r) => r.data ?? []), catchError(() => of([] as Product[])));

    return forkJoin({
      relatedProducts: related$,
      reviews: this.http
        .get<ApiResponse<ReviewRow[]>>(`${this.apiBase}/reviews/product/${product._id}`)
        .pipe(map((r) => r.data ?? []), catchError(() => of([]))),
      reviewMedia: this.http
        .get<ApiResponse<ReviewMediaRow[]>>(`${this.apiBase}/review-media/product/${product._id}`)
        .pipe(map((r) => r.data ?? []), catchError(() => of([]))),
      wishlistItems: this.http
        .get<ApiResponse<WishlistItemRow[]>>(`${this.apiBase}/wishlist-items`)
        .pipe(map((r) => r.data ?? []), catchError(() => of([]))),
    });
  }

  private resolveCategoryId(product: Product): string {
    const c = product.categoryId;
    if (!c) return '';
    return typeof c === 'string' ? c : c._id ?? '';
  }

  /** PDP first paint: lean server projection (`fields=core`). */
  private readonly pdpCoreQuery = { fields: 'core' } as const;

  private loadProduct(slugOrId: string): Observable<Product | null> {
    const key = (slugOrId ?? '').trim();
    if (!key) return of(null);

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(key);
    if (isObjectId) {
      return this.http
        .get<ApiResponse<Product>>(`${this.apiBase}/products/${key}`, { params: this.pdpCoreQuery })
        .pipe(map((r) => r.data ?? null), catchError(() => of(null)));
    }

    return this.http
      .get<ApiResponse<Product>>(`${this.apiBase}/products/slug/${encodeURIComponent(key)}`, {
        params: this.pdpCoreQuery,
      })
      .pipe(
        map((r) => r.data ?? null),
        catchError(() =>
          this.http.get<ApiResponse<Product[]>>(`${this.apiBase}/products`).pipe(
            map((r) => (r.data ?? []).find((p) => (p.slug ?? '').toLowerCase() === key.toLowerCase()) ?? null),
            catchError(() => of(null))
          )
        )
      );
  }

  /** Full product document for second PDP paint (tabs, ingredients, audit fields). */
  private loadProductFullById(id: string): Observable<Product | null> {
    return this.http
      .get<ApiResponse<Product>>(`${this.apiBase}/products/${id}`)
      .pipe(map((r) => r.data ?? null), catchError(() => of(null)));
  }

  private mapImages(product: Product, medias: ProductMediaRow[]): ProductDetailImage[] {
    const source = medias.length
      ? medias
      : (product.productMedia ?? []).map((m) => ({
          _id: m._id,
          productId: m.productId,
          mediaUrl: m.mediaUrl,
          altText: m.altText,
          sortOrder: m.sortOrder,
          isPrimary: m.isPrimary,
        }));

    const rows = source
      .slice()
      .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((m, index) => ({
        url: m.mediaUrl,
        alt: m.altText || product.productName,
        type: this.detectImageType(m.altText, index),
        sortOrder: m.sortOrder ?? index,
        isPrimary: !!m.isPrimary,
      }));

    if (rows.length) return rows;
    return [
      {
        url: product.imageUrl || 'assets/images/banner/nen.png',
        alt: product.productName,
        type: 'product',
        sortOrder: 0,
        isPrimary: true,
      },
    ];
  }

  private mapVariants(rows: ProductVariantRow[], inventory: InventoryBalanceRow[]): ProductDetailVariant[] {
    const invByVariant = new Map<string, number>();
    for (const i of inventory) {
      const id = this.refId(i.variantId);
      invByVariant.set(id, (invByVariant.get(id) ?? 0) + Number(i.availableQty ?? 0));
    }

    return rows.map((v, idx) => {
      const stockQty = invByVariant.get(v._id) ?? 0;
      const shadeCode = (v.sku || '').split('-').pop() || `S${idx + 1}`;
      const shadeName = v.variantName || `Shade ${idx + 1}`;
      return {
        id: v._id,
        sku: v.sku,
        name: shadeName,
        shadeCode,
        shadeName,
        undertone: this.detectUndertone(shadeName),
        swatchColor: this.swatchFromName(shadeName, idx),
        inStock: stockQty > 0,
        stockQty,
      };
    });
  }

  private mapReviews(reviews: ReviewRow[], mediaRows: ReviewMediaRow[]): ProductDetailReview[] {
    const mediaByReview = new Map<string, string[]>();
    for (const m of mediaRows) {
      const list = mediaByReview.get(String(m.reviewId)) ?? [];
      list.push(m.mediaUrl);
      mediaByReview.set(String(m.reviewId), list);
    }

    return reviews.map((r, index) => ({
      id: r._id,
      userName: r.customer_id?.full_name || `Khách hàng ${index + 1}`,
      avatar: `https://i.pravatar.cc/100?img=${(index % 70) + 1}`,
      verified: !!r.verifiedPurchaseFlag,
      shade: r.variantId?.variantName || '',
      rating: r.rating ?? 5,
      title: r.reviewTitle || 'Đánh giá sản phẩm',
      body: r.reviewContent || '',
      images: mediaByReview.get(r._id) ?? [],
      date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN') : '',
      helpful: r.helpfulCount ?? 0,
    }));
  }

  private mapRatingDistribution(summary: ReviewSummaryRow | null, reviews: ReviewRow[]): { [k: number]: number } {
    if (summary) {
      return {
        1: summary.rating1Count ?? 0,
        2: summary.rating2Count ?? 0,
        3: summary.rating3Count ?? 0,
        4: summary.rating4Count ?? 0,
        5: summary.rating5Count ?? 0,
      };
    }
    const dist: { [k: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of reviews) {
      const k = Math.max(1, Math.min(5, Number(r.rating || 0)));
      dist[k] = (dist[k] ?? 0) + 1;
    }
    return dist;
  }

  private toReco(products: Product[]): ProductDetailRecommendation[] {
    return products.slice(0, 8).map((p) => ({
      id: p._id,
      slug: p.slug,
      name: p.productName,
      brand: p.brandId?.brandName ?? 'KANILA',
      attribute: p.shortDescription || 'Beauty makeup essential',
      rating: p.averageRating ?? 0,
      price: p.price ?? 0,
      oldPrice: p.compareAtPrice ?? undefined,
      image: this.resolveProductImage(p),
      badge: (p.bought ?? 0) > 500 ? 'Hot' : undefined,
    }));
  }

  private buildContent(product: Product): ProductDetailContentSections {
    const longText = product.longDescription || product.shortDescription || '';
    return {
      overview: [
        product.shortDescription || 'Lớp nền mịn đẹp, tiệp da tự nhiên.',
        longText || 'Công thức mỏng nhẹ giúp da thoáng, lên nền mượt và lâu trôi.',
      ].filter(Boolean),
      ingredients: this.splitText(product.ingredientText, [
        'Niacinamide hỗ trợ làm đều màu da.',
        'Centella giúp làm dịu da.',
        'Hyaluronic acid hỗ trợ duy trì độ ẩm.',
      ]),
      howToUse: this.splitText(product.usageInstruction, [
        'Dặm mỏng từ trung tâm khuôn mặt, tán dần ra ngoài.',
        'Layer thêm ở vùng cần che phủ cao.',
        'Khóa nền với phấn phủ mỏng ở vùng chữ T.',
      ]),
      whyLoveIt: [
        'Lớp nền mịn, không nặng mặt.',
        'Độ che phủ buildable dễ kiểm soát.',
        'Giữ nền ổn định nhiều giờ.',
      ],
      suitableFor: ['Da thường', 'Da hỗn hợp', 'Da dầu'],
      storage: ['Đậy kín sau khi dùng.', 'Tránh nhiệt độ cao và ánh nắng trực tiếp.'],
    };
  }

  private buildHighlightsFallback(): ProductDetailHighlights {
    return {
      finish: 'Soft matte finish',
      coverage: 'Medium buildable coverage',
      texture: 'Lightweight cushion texture',
      skinType: 'Suitable for all skin types',
      wearTime: 'Up to 12 hours wear',
      bestFor: 'Best for fresh daily makeup',
    };
  }

  private buildFallbackVariants(): ProductDetailVariant[] {
    return [
      { id: 'f1', sku: 'N15', name: 'N15 Light Neutral', shadeCode: 'N15', shadeName: 'Light Neutral', undertone: 'Neutral', swatchColor: '#f5d7be', inStock: true, stockQty: 30 },
      { id: 'f2', sku: 'W20', name: 'W20 Warm Beige', shadeCode: 'W20', shadeName: 'Warm Beige', undertone: 'Warm', swatchColor: '#e9bf9f', inStock: true, stockQty: 18 },
      { id: 'f3', sku: 'C23', name: 'C23 Soft Sand', shadeCode: 'C23', shadeName: 'Soft Sand', undertone: 'Cool', swatchColor: '#d8a888', inStock: true, stockQty: 12 },
    ];
  }

  private buildFallbackReviews(): ProductDetailReview[] {
    return [
      {
        id: 'fallback-1',
        userName: 'Ngoc Anh',
        avatar: 'https://i.pravatar.cc/100?img=11',
        verified: true,
        shade: 'W20 Warm Beige',
        rating: 5,
        title: 'Nền mịn và bền màu',
        body: 'Dễ tán, tiệp da và vẫn đẹp sau nhiều giờ làm việc.',
        images: [],
        date: '12/03/2026',
        helpful: 7,
      },
    ];
  }

  private buildBadges(product: Product, summary: ReviewSummaryRow | null): string[] {
    const tags: string[] = [];
    if ((product.bought ?? 0) > 800) tags.push('Best Seller');
    if (this.isRecent(product)) tags.push('New');
    if ((summary?.averageRating ?? product.averageRating ?? 0) >= 4.7) tags.push('Top Rated');
    return tags.slice(0, 3);
  }

  private findCategoryPath(categoryId: string, tree: HeaderCategoryItem[]): { parentCategoryName?: string; categoryName?: string } {
    for (const top of tree) {
      if (top.id === categoryId) return { categoryName: top.name };
      const child = top.children.find((c) => c.id === categoryId);
      if (child) return { parentCategoryName: top.name, categoryName: child.name };
    }
    return {};
  }

  private buildFrequentlyBoughtTogetherFallback(products: Product[], currentId: string): Product[] {
    return products.filter((p) => p._id !== currentId).sort((a, b) => (b.bought ?? 0) - (a.bought ?? 0)).slice(0, 8);
  }

  private buildRecentlyViewed(products: Product[], currentId: string): Product[] {
    const key = 'kanila_recently_viewed_products';
    const raw = localStorage.getItem(key);
    const list = raw ? JSON.parse(raw) as string[] : [];
    const next = [currentId, ...list.filter((x) => x !== currentId)].slice(0, 20);
    localStorage.setItem(key, JSON.stringify(next));

    const byId = new Map(products.map((p) => [p._id, p]));
    return next.map((id) => byId.get(id)).filter((p): p is Product => !!p && p._id !== currentId).slice(0, 8);
  }

  private splitText(raw: string | undefined, fallback: string[]): string[] {
    const text = (raw ?? '').trim();
    if (!text) return fallback;
    return text
      .split(/\r?\n|•|;/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  private detectImageType(altText: string | undefined, index: number): 'product' | 'texture' | 'swatch' | 'model' {
    const v = (altText ?? '').toLowerCase();
    if (v.includes('texture')) return 'texture';
    if (v.includes('swatch')) return 'swatch';
    if (v.includes('model')) return 'model';
    const map: Array<'product' | 'texture' | 'swatch' | 'model'> = ['product', 'texture', 'swatch', 'model'];
    return map[index % map.length];
  }

  private detectUndertone(name: string): string {
    const v = name.toLowerCase();
    if (v.includes('warm')) return 'Warm';
    if (v.includes('cool')) return 'Cool';
    if (v.includes('neutral')) return 'Neutral';
    return 'Neutral';
  }

  private swatchFromName(name: string, index: number): string {
    const colors = ['#f5d7be', '#e9bf9f', '#d8a888', '#b98764', '#9f7256'];
    const code = (name || '').toLowerCase();
    if (code.includes('light')) return '#f3d8c4';
    if (code.includes('beige')) return '#ddae89';
    if (code.includes('sand')) return '#cf9a74';
    return colors[index % colors.length];
  }

  private resolveProductImage(p: Product): string {
    const media = p.productMedia ?? [];
    if (media.length) {
      const sorted: ProductMediaItem[] = [...media].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      if (sorted[0]?.mediaUrl) return sorted[0].mediaUrl;
    }
    return p.imageUrl || 'assets/images/banner/nen.png';
  }

  private refId(v: string | { _id?: string } | undefined): string {
    if (!v) return '';
    return typeof v === 'string' ? v : v._id || '';
  }

  private isRecent(product: Product): boolean {
    // Use createdAt if present from API response; fallback false.
    const createdAt = (product as unknown as { createdAt?: string }).createdAt;
    if (!createdAt) return false;
    const ts = new Date(createdAt).getTime();
    if (!Number.isFinite(ts)) return false;
    const days = (Date.now() - ts) / (1000 * 60 * 60 * 24);
    return days <= 45;
  }
}
