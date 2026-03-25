import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { catchError, of, take } from 'rxjs';
import { ProductDetailContentSections, ProductDetailData } from '../../models/product-detail.model';
import { ProductDetailService } from '../../services/product-detail.service';
import { ProductCardComponent } from '../../../home/pages/components/product-card/product-card';
import { Product } from '../../../../core/models/product.model';
import { CartService } from '../../../cart/services/cart.service';
import { ToastService } from '../../../../core/services/toast.service';
import { CheckoutService } from '../../../checkout/services/checkout.service';
import { WishlistService } from '../../../account/services/wishlist.service';
import { CouponAvailableItem, CouponService } from '../../../account/services/coupon.service';
import { SameBrandSectionComponent } from './components/same-brand/same-brand.component';
import { RecentlyViewedSectionComponent } from './components/recently-viewed/recently-viewed.component';
import { HttpClient } from '@angular/common/http';

interface PdpShade {
  id: string;
  name: string;
  undertone: string;
  hex: string;
}

interface PdpHighlight {
  label: string;
  value: string;
  icon: string;
}

interface PdpReview {
  id: string;
  userName: string;
  avatar: string;
  verified: boolean;
  shade: string;
  rating: number;
  title: string;
  body: string;
  images: string[];
  date: string;
  createdAtMs: number;
  helpful: number;
}

interface PdpMiniProduct {
  id?: string;
  slug?: string;
  name: string;
  brand: string;
  attribute: string;
  price: number;
  oldPrice?: number;
  rating: number;
  sold?: number;
  image: string;
  badge?: string;
}

@Component({
  selector: 'app-catalog-product-detail-page',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductCardComponent, SameBrandSectionComponent, RecentlyViewedSectionComponent],
  templateUrl: './product-detail-page.html',
  styleUrl: './product-detail-page.css',
})
export class CatalogProductDetailPageComponent implements OnInit {
  reviewInsightTags: string[] = [];
  breadcrumb = ['Trang chủ', 'Face', 'Kem nền'];
  productName = 'Kanila Velvet Skin Cushion Foundation SPF50+';
  productSubtitle = 'Luminous matte finish, buildable coverage, seamless blend';
  brandName = 'KANILA Atelier';
  badges = ['Best Seller', 'New', 'Limited Edition'];

  rating = 4.8;
  reviewCount = 1247;
  soldCount = 9680;
  wishCount = 2143;

  currentPrice = 690000;
  oldPrice = 850000;
  discountPercent = 19;

  trustItems = [
    '100% chính hãng',
    'Miễn phí ship từ 499K',
    'Đổi trả 7 ngày',
  ];

  gallery = [
    { type: 'product', url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80' },
    { type: 'texture', url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1200&q=80' },
    { type: 'swatch', url: 'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?auto=format&fit=crop&w=1200&q=80' },
    { type: 'model', url: 'https://images.unsplash.com/photo-1600188769045-bc6020405c90?auto=format&fit=crop&w=1200&q=80' },
  ];

  shades: PdpShade[] = [
    { id: 'n15', name: 'N15 Light Neutral', undertone: 'Neutral', hex: '#f5d7be' },
    { id: 'w20', name: 'W20 Warm Beige', undertone: 'Warm', hex: '#e9bf9f' },
    { id: 'c23', name: 'C23 Soft Sand', undertone: 'Cool', hex: '#d8a888' },
    { id: 'w27', name: 'W27 Honey', undertone: 'Warm', hex: '#b98764' },
  ];

  highlights: PdpHighlight[] = [
    { label: 'Finish', value: 'Luminous Matte', icon: 'bi-stars' },
    { label: 'Coverage', value: 'Medium to Full', icon: 'bi-layers' },
    { label: 'Texture', value: 'Silk-cream, thin-film', icon: 'bi-droplet-half' },
    { label: 'Skin type', value: 'Normal / Oily / Combo', icon: 'bi-heart-pulse' },
    { label: 'Wear time', value: 'Up to 12 hours', icon: 'bi-clock-history' },
    { label: 'Best for', value: 'Blur pores, long-wear base', icon: 'bi-magic' },
  ];

  readonly infoTabs = [
    'overview',
    'ingredients',
    'howToUse',
    'whyLoveIt',
    'suitableFor',
    'storage',
  ] as const;
  activeTab: (typeof this.infoTabs)[number] = 'overview';

  contentSections: ProductDetailContentSections = {
    overview: [
      'Lớp nền tiệp da, không xỉn màu sau nhiều giờ.',
      'Che phủ buildable từ nhẹ đến cao mà vẫn thoáng mặt.',
      'Hiệu ứng luminous-matte giữ da căng mịn, không bóng dầu.',
    ],
    ingredients: [
      'Niacinamide + Panthenol: hỗ trợ làm dịu và duy trì độ ẩm.',
      'Soft-focus powder: giảm phản chiếu vùng lỗ chân lông.',
      'SPF50+ PA++++: bảo vệ da hằng ngày.',
    ],
    howToUse: [
      'Prep da với kem dưỡng mỏng nhẹ, chờ set 2-3 phút.',
      'Dặm cushion từ trung tâm mặt, tán dần ra ngoài.',
      'Layer thêm ở vùng cần che phủ cao để đạt nền hoàn hảo.',
    ],
    whyLoveIt: [
      'Texture mỏng nhưng che phủ tốt, hợp makeup everyday lẫn sự kiện.',
      'Tông màu tinh chỉnh theo undertone châu Á, dễ chọn shade.',
      'Độ bám cao, ít xuống tông trong môi trường nóng ẩm.',
    ],
    suitableFor: [
      'Da thường, da dầu, da hỗn hợp thiên dầu.',
      'Da có lỗ chân lông to, cần hiệu ứng mịn và lâu trôi.',
      'Người thích finish semi-matte sang, không quá lì.',
    ],
    storage: [
      'Đậy kín nắp sau khi dùng, tránh nơi nhiệt cao.',
      'Vệ sinh puff định kỳ để đảm bảo độ mịn nền.',
      'Ngưng sử dụng nếu có kích ứng bất thường.',
    ],
  };

  ratingDistribution: { [k: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 1, 5: 3 };
  stockText = 'Còn hàng';
  shippingText = 'Giao nhanh trong 2h tại nội thành • Miễn phí đổi shade trong 7 ngày.';

  loading = true;
  hasError = false;
  productId = '';

  currentBrandId = '';
  currentCategoryId = '';

  bundleProducts: PdpMiniProduct[] = [
    { name: 'Soft Velvet Puff Duo', brand: 'KANILA Atelier', attribute: '2 pcs, seamless blend', rating: 4.7, price: 149000, image: 'https://images.unsplash.com/photo-1629198721130-39b7f9f2e4fb?auto=format&fit=crop&w=600&q=80' },
    { name: 'Hydra Blur Primer', brand: 'KANILA Atelier', attribute: 'Hydrating prep base', rating: 4.8, price: 420000, oldPrice: 490000, image: 'https://images.unsplash.com/photo-1631730486784-1d4f2b6f0fce?auto=format&fit=crop&w=600&q=80' },
    { name: 'Micro-Set Powder', brand: 'KANILA Atelier', attribute: 'Oil-control, soft focus', rating: 4.6, price: 380000, image: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=600&q=80', badge: 'Hot' },
  ];

  similarProducts: PdpMiniProduct[] = [
    { name: 'Air Matte Foundation', brand: 'KANILA Atelier', attribute: 'Shade N20, velvet matte', rating: 4.6, price: 640000, image: 'https://images.unsplash.com/photo-1631730486806-d1ba66b74fd9?auto=format&fit=crop&w=600&q=80' },
    { name: 'Soft Focus Cushion', brand: 'Le Rosé Beauty', attribute: 'Natural satin glow', rating: 4.7, price: 590000, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80' },
    { name: 'Dew Lock Base', brand: 'Nude Bloom', attribute: 'Pore blurring primer', rating: 4.5, price: 520000, image: 'https://images.unsplash.com/photo-1522338140262-f46f5913618a?auto=format&fit=crop&w=600&q=80' },
    { name: 'Cloud Cover Tint', brand: 'Maison Flawless', attribute: 'Light-medium coverage', rating: 4.4, price: 560000, image: 'https://images.unsplash.com/photo-1503235930437-8c6293ba41f5?auto=format&fit=crop&w=600&q=80' },
  ];

  // Same Brand + Recently Viewed are rendered via dedicated components (see `components/`).

  reviews: PdpReview[] = [];

  selectedImageIndex = 0;
  selectedShadeId = this.shades[1]?.id ?? this.shades[0]?.id ?? '';
  quantity = 1;
  reviewFilter: 'all' | '5' | '4' | '3' | '2' | '1' | 'withImage' | 'verified' | 'helpful' = 'all';
  reviewSort: 'newest' | 'mostHelpful' | 'highestRating' | 'lowestRating' = 'newest';
  reviewShadeFilter: string | null = null;
  reviewSkinTypeFilter: string | null = null;
  helpfulVotingIds = new Set<string>();
  lightboxOpen = false;
  lightboxImages: string[] = [];
  lightboxIndex = 0;
  stickyVisible = false;
  isAddingToCart = false;
  wished = false;
  availableCoupons: CouponAvailableItem[] = [];

  // --- Write Review Modal ---
  writeReviewOpen = false;
  writeReviewRating = 5;
  writeReviewTitle = '';
  writeReviewContent = '';
  writeReviewMediaBase64: string[] = [];
  writeReviewMediaBusy = false;
  writeReviewSubmitting = false;
  writeReviewSuccess = false;
  writeReviewError = '';
  writeReviewStars = [1, 2, 3, 4, 5];
  private readonly apiUrl = 'http://localhost:5000/api';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly detailService: ProductDetailService,
    private readonly cartService: CartService,
    private readonly toast: ToastService,
    private readonly checkoutService: CheckoutService,
    private readonly wishlistService: WishlistService,
    private readonly couponService: CouponService,
    private readonly http: HttpClient
  ) {}

  ngOnInit(): void {
    this.couponService.getAvailable().pipe(take(1)).subscribe((list) => {
      this.availableCoupons = list.slice(0, 3);
    });
    this.route.paramMap.subscribe((params) => {
      const slugOrId = (params.get('slug') ?? '').trim();
      if (!slugOrId) {
        this.loading = false;
        this.hasError = true;
        return;
      }

      this.loading = true;
      this.hasError = false;
      let firstPaint = true;
      this.detailService
        .getProductDetail(slugOrId)
        .pipe(catchError(() => of(null)))
        .subscribe((detail) => {
          if (!detail) {
            if (firstPaint) {
              this.loading = false;
              this.hasError = true;
            }
            return;
          }
          this.applyDetail(detail);
          this.wishlistService.syncWishlistState().pipe(take(1)).subscribe();
          this.wished = this.wishlistService.isWishlisted(this.productId);
          if (firstPaint) {
            this.loading = false;
            this.hasError = false;
            firstPaint = false;
          }
        });
    });
  }

  get selectedImage(): string {
    return this.gallery[this.selectedImageIndex]?.url ?? '';
  }

  get selectedShade(): PdpShade {
    return this.shades.find((shade) => shade.id === this.selectedShadeId) ?? this.shades[0];
  }

  get filteredReviews(): PdpReview[] {
    let list = this.reviews.slice();

    if (this.reviewFilter === 'withImage') list = list.filter((r) => r.images.length > 0);
    else if (this.reviewFilter === 'verified') list = list.filter((r) => r.verified);
    else if (this.reviewFilter === 'helpful') list = list.filter((r) => r.helpful > 0);
    else if (this.reviewFilter !== 'all') list = list.filter((r) => r.rating === Number(this.reviewFilter));

    if (this.reviewShadeFilter) list = list.filter((r) => r.shade === this.reviewShadeFilter);
    if (this.reviewSkinTypeFilter) list = list.filter((r) => this.deriveSkinTypeTag(r) === this.reviewSkinTypeFilter);

    const ms = (r: PdpReview) => Number(r.createdAtMs ?? 0);
    if (this.reviewSort === 'newest') list.sort((a, b) => ms(b) - ms(a));
    else if (this.reviewSort === 'mostHelpful') list.sort((a, b) => (b.helpful ?? 0) - (a.helpful ?? 0) || ms(b) - ms(a));
    else if (this.reviewSort === 'highestRating') list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || ms(b) - ms(a));
    else if (this.reviewSort === 'lowestRating') list.sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0) || ms(b) - ms(a));

    return list;
  }

  get totalRatingSlots(): number {
    const sum = [1, 2, 3, 4, 5].reduce((acc, k) => acc + (this.ratingDistribution[k] ?? 0), 0);
    return sum || this.reviews.length || 1;
  }

  get recommendPercent(): number {
    const positive = (this.ratingDistribution[5] ?? 0) + (this.ratingDistribution[4] ?? 0);
    return Math.round((positive / this.totalRatingSlots) * 100);
  }

  get hasReviews(): boolean {
    return this.reviewCount > 0 || this.reviews.length > 0;
  }

  get hasRatingData(): boolean {
    return [1, 2, 3, 4, 5].some((star) => (this.ratingDistribution[star] ?? 0) > 0);
  }

  get availableReviewShades(): string[] {
    const set = new Set<string>();
    for (const r of this.reviews) {
      const s = String(r.shade ?? '').trim();
      if (s) set.add(s);
    }
    // Keep UI calm: show only a subset.
    return Array.from(set).slice(0, 12);
  }

  get availableReviewSkinTypes(): string[] {
    const set = new Set<string>();
    for (const r of this.reviews) {
      const t = this.deriveSkinTypeTag(r);
      if (t) set.add(t);
    }
    return Array.from(set).slice(0, 6);
  }

  get customerReviewPhotos(): string[] {
    return this.reviews.flatMap((review) => review.images).slice(0, 10);
  }

  get savingsAmount(): number {
    return Math.max(0, this.oldPrice - this.currentPrice);
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.stickyVisible = window.scrollY > 520;
  }

  setImage(index: number): void {
    this.selectedImageIndex = index;
  }

  prevImage(): void {
    this.selectedImageIndex = (this.selectedImageIndex - 1 + this.gallery.length) % this.gallery.length;
  }

  nextImage(): void {
    this.selectedImageIndex = (this.selectedImageIndex + 1) % this.gallery.length;
  }

  selectShade(shadeId: string): void {
    this.selectedShadeId = shadeId;
  }

  decreaseQty(): void {
    this.quantity = Math.max(1, this.quantity - 1);
  }

  increaseQty(): void {
    this.quantity = Math.min(99, this.quantity + 1);
  }

  scrollToReviews(): void {
    const section = document.getElementById('pdp-reviews');
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  goToMyReviews(): void {
    this.router.navigate(['/account/reviews']);
  }

  // ============ WRITE REVIEW MODAL ============

  openWriteReview(): void {
    this.writeReviewOpen = true;
    this.writeReviewRating = 5;
    this.writeReviewTitle = '';
    this.writeReviewContent = '';
    this.writeReviewMediaBase64 = [];
    this.writeReviewSuccess = false;
    this.writeReviewError = '';
    this.writeReviewSubmitting = false;
  }

  closeWriteReview(): void {
    this.writeReviewOpen = false;
  }

  setWriteReviewRating(v: number): void {
    this.writeReviewRating = Math.max(1, Math.min(5, v));
  }

  async onWriteReviewFilesSelected(files: FileList | null): Promise<void> {
    if (!files || !files.length) return;
    const list = Array.from(files).slice(0, 6);
    const MAX_MB = 2;
    this.writeReviewError = '';
    this.writeReviewMediaBusy = true;
    try {
      const readOne = (file: File) =>
        new Promise<string>((resolve, reject) => {
          if (!file.type.startsWith('image/')) return reject(new Error('Chỉ nhận ảnh.'));
          if (file.size > MAX_MB * 1024 * 1024) return reject(new Error('Mỗi ảnh tối đa 2MB.'));
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(new Error('Không thể đọc tệp.'));
          reader.readAsDataURL(file);
        });
      const base64 = await Promise.all(list.map((f) => readOne(f)));
      this.writeReviewMediaBase64 = base64.filter(Boolean);
    } catch (e: any) {
      this.writeReviewError = e?.message || 'Không thể tải ảnh.';
    } finally {
      this.writeReviewMediaBusy = false;
    }
  }

  removeWriteReviewMediaAt(i: number): void {
    this.writeReviewMediaBase64 = this.writeReviewMediaBase64.filter((_, idx) => idx !== i);
  }

  submitWriteReview(): void {
    if (this.writeReviewSubmitting) return;
    this.writeReviewSuccess = false;
    this.writeReviewError = '';

    if (!this.productId) {
      this.writeReviewError = 'Không xác định được sản phẩm.';
      return;
    }
    if (!this.writeReviewRating || this.writeReviewRating < 1 || this.writeReviewRating > 5) {
      this.writeReviewError = 'Vui lòng chọn số sao.';
      return;
    }
    if (!this.writeReviewTitle.trim()) {
      this.writeReviewError = 'Vui lòng nhập tiêu đề đánh giá.';
      return;
    }
    if (!this.writeReviewContent.trim() || this.writeReviewContent.trim().length < 20) {
      this.writeReviewError = 'Vui lòng viết nội dung chi tiết (tối thiểu 20 ký tự).';
      return;
    }

    this.writeReviewSubmitting = true;

    this.http
      .post<any>(`${this.apiUrl}/reviews/submit-direct`, {
        productId: this.productId,
        variantId: this.resolveVariantIdForApi(this.selectedShadeId),
        rating: this.writeReviewRating,
        reviewTitle: this.writeReviewTitle.trim(),
        reviewContent: this.writeReviewContent.trim(),
        mediaUrls: this.writeReviewMediaBase64,
      })
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.writeReviewSubmitting = false;
          this.writeReviewSuccess = true;
          this.toast.success('Đã gửi đánh giá! Cảm ơn bạn đã chia sẻ trải nghiệm.');
          setTimeout(() => {
            this.writeReviewOpen = false;
          }, 1500);
        },
        error: (err) => {
          this.writeReviewSubmitting = false;
          const msg = err?.error?.message || err?.message || '';
          if (msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('đăng nhập')) {
            this.writeReviewError = 'Vui lòng đăng nhập để viết đánh giá.';
          } else {
            this.writeReviewError = msg || 'Không thể gửi đánh giá. Vui lòng thử lại.';
          }
        },
      });
  }

  setReviewFilter(filter: 'all' | '5' | '4' | '3' | '2' | '1' | 'withImage' | 'verified' | 'helpful'): void {
    this.reviewFilter = filter;
  }

  setReviewSort(sort: 'newest' | 'mostHelpful' | 'highestRating' | 'lowestRating'): void {
    this.reviewSort = sort;
  }

  setReviewShade(shade: string | null): void {
    this.reviewShadeFilter = shade && shade.trim() ? shade : null;
  }

  setReviewSkinType(skinType: string | null): void {
    this.reviewSkinTypeFilter = skinType && skinType.trim() ? skinType : null;
  }

  voteHelpful(reviewId: string): void {
    if (this.helpfulVotingIds.has(reviewId)) return;
    this.helpfulVotingIds.add(reviewId);

    this.detailService
      .voteReview(reviewId, 'helpful')
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          const helpfulCount = res?.data?.helpfulCount;
          this.reviews = this.reviews.map((r) => (r.id === reviewId ? { ...r, helpful: typeof helpfulCount === 'number' ? helpfulCount : r.helpful + 1 } : r));
          this.helpfulVotingIds.delete(reviewId);
        },
        error: () => {
          this.helpfulVotingIds.delete(reviewId);
          this.toast.error('Không thể ghi nhận "Hữu ích" ngay lúc này. Vui lòng thử lại.');
        },
      });
  }

  reportReview(reviewId: string): void {
    // Backend report pipeline can be added later; UI shows a truthful placeholder now.
    // Keeping it non-blocking to avoid breaking the reviews UX.
    this.toast.warning('Chức năng báo cáo sẽ được bật ở bản tiếp theo.');
  }

  openReviewLightbox(images: string[], index: number): void {
    this.lightboxImages = images.slice(0, 20);
    this.lightboxIndex = Math.max(0, Math.min(index, this.lightboxImages.length - 1));
    this.lightboxOpen = true;
  }

  closeReviewLightbox(): void {
    this.lightboxOpen = false;
    this.lightboxImages = [];
    this.lightboxIndex = 0;
  }

  lightboxPrev(): void {
    if (!this.lightboxImages.length) return;
    this.lightboxIndex = (this.lightboxIndex - 1 + this.lightboxImages.length) % this.lightboxImages.length;
  }

  lightboxNext(): void {
    if (!this.lightboxImages.length) return;
    this.lightboxIndex = (this.lightboxIndex + 1) % this.lightboxImages.length;
  }

  getReviewContextTags(review: PdpReview): string[] {
    const tags: string[] = [];
    const shade = String(review.shade ?? '').trim();
    if (shade) tags.push(`Shade ${shade}`);
    // Verified purchase is shown via a dedicated badge in the card header.

    const raw = `${review.title ?? ''} ${review.body ?? ''}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const pick = (patterns: string[], label: string) => (patterns.some((p) => raw.includes(p)) ? label : null);

    const skin =
      pick(['da dau', 'dau nhon', 'dau tron', 'kiem dau'], 'Da dầu') ||
      pick(['da kho', 'kho', 'cang kho'], 'Da khô') ||
      pick(['hon hop', 'da hon hop', 'combo'], 'Da hỗn hợp') ||
      pick(['nhay cam', 'kich ung'], 'Da nhạy cảm');
    if (skin) tags.push(skin);

    const finish = pick(['semi matte', 'matte', 'li tu nhien', 'li tu nhien', 'min', 'min li'], 'Finish lì') || pick(['bong', 'glow', 'luminous'], 'Finish glow');
    if (finish) tags.push(finish);

    const coverage =
      pick(['che phu', 'coverage', 'phu do', 'muc do phu'], 'Coverage vừa/đủ che') ||
      pick(['che phu cao', 'phu cao'], 'Coverage cao');
    if (coverage) tags.push(coverage);

    return tags.slice(0, 4);
  }

  private deriveSkinTypeTag(review: PdpReview): string | null {
    const raw = `${review.title ?? ''} ${review.body ?? ''}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (raw.includes('da dau') || raw.includes('kiem dau') || raw.includes('dau nhon') || raw.includes('dau tron')) return 'Da dầu';
    if (raw.includes('da kho') || raw.includes('cang kho')) return 'Da khô';
    if (raw.includes('hon hop') || raw.includes('da hon hop') || raw.includes('combo')) return 'Da hỗn hợp';
    if (raw.includes('nhay cam') || raw.includes('kich ung')) return 'Da nhạy cảm';
    return null;
  }

  private updateReviewInsights(): void {
    if (!this.reviews.length) {
      this.reviewInsightTags = [];
      return;
    }

    const countBy = (items: string[]) => {
      const m = new Map<string, number>();
      for (const it of items) m.set(it, (m.get(it) ?? 0) + 1);
      return m;
    };

    const normalize = (s: string) =>
      String(s ?? '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    const shadeMentions: string[] = [];
    const skinMentions: string[] = [];
    const finishMentions: string[] = [];
    const benefitMentions: string[] = [];

    const BENEFITS = [
      { patterns: ['mịn li', 'min li', 'min'], label: 'Mịn lì tự nhiên' },
      { patterns: ['bền màu', 'ben mau', 'lau troi'], label: 'Bền màu lâu trôi' },
      { patterns: ['dễ tán', 'de tan'], label: 'Dễ tán' },
      { patterns: ['khong xuong tong', 'xuong tong'], label: 'Không xuống tông' },
    ];

    for (const r of this.reviews) {
      const raw = normalize(`${r.title ?? ''} ${r.body ?? ''}`);

      if (r.shade) shadeMentions.push(r.shade);

      if (raw.includes('da dau') || raw.includes('kiem dau') || raw.includes('dau nhon') || raw.includes('dau tron')) skinMentions.push('Da dầu');
      else if (raw.includes('da kho') || raw.includes('cang kho')) skinMentions.push('Da khô');
      else if (raw.includes('hon hop') || raw.includes('da hon hop') || raw.includes('combo')) skinMentions.push('Da hỗn hợp');
      else if (raw.includes('nhay cam') || raw.includes('kich ung')) skinMentions.push('Da nhạy cảm');

      if (raw.includes('bong') || raw.includes('glow') || raw.includes('luminous')) finishMentions.push('Finish glow');
      else if (raw.includes('matte') || raw.includes('semi matte') || raw.includes('li') || raw.includes('min')) finishMentions.push('Finish lì');

      const benefitHit = BENEFITS.find((b) => b.patterns.some((p) => raw.includes(p)));
      if (benefitHit) benefitMentions.push(benefitHit.label);
    }

    const topOne = (m: Map<string, number>) => {
      let best = '';
      let bestVal = -1;
      for (const [k, v] of m.entries()) {
        if (v > bestVal) {
          best = k;
          bestVal = v;
        }
      }
      return best || null;
    };

    const topShade = topOne(countBy(shadeMentions));
    const topSkin = topOne(countBy(skinMentions));
    const topFinish = topOne(countBy(finishMentions));
    const topBenefit = topOne(countBy(benefitMentions));

    const tags: string[] = [];
    if (topBenefit) tags.push(topBenefit);
    if (topSkin) tags.push(topSkin);
    if (topShade) tags.push(`Shade ${topShade}`);
    if (topFinish) tags.push(topFinish);

    this.reviewInsightTags = tags.slice(0, 6);
  }

  addToCartFeedback(): void {
    if (!this.productId) {
      this.toast.warning('Sản phẩm không hợp lệ.');
      return;
    }
    if (!this.selectedShadeId || !this.selectedShade) {
      this.toast.warning('Vui lòng chọn phân loại sản phẩm.');
      return;
    }
    if (!Number.isFinite(this.quantity) || this.quantity <= 0) {
      this.toast.warning('Số lượng không hợp lệ.');
      return;
    }

    const variantId = this.resolveVariantIdForApi(this.selectedShadeId);
    this.cartService
      .addToCart({
        productId: this.productId,
        variantId,
        quantity: this.quantity,
        productName: this.productName,
        brandName: this.brandName,
        variantLabel: this.selectedShade?.name || 'Default',
        imageUrl: this.gallery[0]?.url || '',
        unitPrice: this.currentPrice,
        compareAtPrice: this.oldPrice,
        stockStatus: this.stockText.toLowerCase().includes('hết') ? 'out_of_stock' : 'in_stock',
      })
      .subscribe(() => {
        const err = this.cartService.getCurrentError();
        if (err) this.toast.error(err.message);
        else this.toast.success('Đã thêm sản phẩm vào giỏ hàng.');
      });
    this.isAddingToCart = true;
    setTimeout(() => {
      this.isAddingToCart = false;
    }, 700);
  }

  buyNow(): void {
    if (!this.productId) {
      this.toast.warning('Sản phẩm không hợp lệ.');
      return;
    }
    if (!this.selectedShadeId || !this.selectedShade) {
      this.toast.warning('Vui lòng chọn phân loại sản phẩm.');
      return;
    }
    if (!Number.isFinite(this.quantity) || this.quantity <= 0) {
      this.toast.warning('Số lượng không hợp lệ.');
      return;
    }
    if (this.stockText.toLowerCase().includes('hết')) {
      this.toast.warning('Sản phẩm hiện không còn khả dụng.');
      return;
    }

    this.checkoutService.createBuyNowCheckoutSession({
      productId: this.productId,
      variantId: this.resolveVariantIdForApi(this.selectedShadeId),
      quantity: this.quantity,
    }).pipe(take(1)).subscribe({
      next: (session) => {
        this.router.navigate(['/checkout'], { queryParams: { sessionId: session.sessionId } });
      },
      error: (err) => {
        const issues = this.checkoutService.mapIssues(err);
        this.toast.error(issues[0]?.message || 'Không thể mua ngay. Vui lòng thử lại.');
      }
    });
  }

  toggleWishlist(): void {
    if (!this.productId) return;
    this.wishlistService.toggleProduct(this.productId, this.resolveVariantIdForApi(this.selectedShadeId)).pipe(take(1)).subscribe((ok) => {
      if (!ok) {
        this.toast.error('Không thể cập nhật danh mục yêu thích.');
        return;
      }
      this.wished = this.wishlistService.isWishlisted(this.productId);
      this.toast.success(this.wished ? 'Đã thêm vào yêu thích.' : 'Đã xóa khỏi yêu thích.');
    });
  }

  setTab(tab: (typeof this.infoTabs)[number]): void {
    this.activeTab = tab;
  }

  saveCoupon(couponId: string): void {
    this.couponService.saveCoupon(couponId).pipe(take(1)).subscribe((res) => {
      if (!res.success) {
        this.toast.error('Không thể lưu mã giảm giá.');
        return;
      }
      this.availableCoupons = this.availableCoupons.map((x) => x._id === couponId ? { ...x, isSaved: true } : x);
      this.toast.success(res.alreadySaved ? 'Mã đã có trong tài khoản.' : 'Lưu mã thành công.');
    });
  }

  ratingPercent(star: number): number {
    const count = this.ratingDistribution[star] ?? 0;
    return Math.round((count / this.totalRatingSlots) * 100);
  }

  isTopRatingRow(star: number): boolean {
    const values = [1, 2, 3, 4, 5].map((item) => this.ratingDistribution[item] ?? 0);
    const maxValue = Math.max(...values, 0);
    return (this.ratingDistribution[star] ?? 0) === maxValue && maxValue > 0;
  }

  starText(value: number): string {
    const full = '★'.repeat(Math.max(0, Math.min(5, Math.floor(value))));
    const empty = '☆'.repeat(5 - full.length);
    return `${full}${empty}`;
  }

  shadeCode(name: string): string {
    return name.split(' ')[0] ?? name;
  }

  shadeLabel(name: string): string {
    const parts = name.split(' ');
    return parts.slice(1).join(' ') || name;
  }

  private applyDetail(detail: ProductDetailData): void {
    this.productId = detail.id;
    this.productName = detail.productName;
    this.productSubtitle = detail.subtitle;
    this.brandName = detail.brandName;
    this.currentBrandId = detail.brandId ?? '';
    this.breadcrumb = ['Trang chủ', detail.parentCategoryName || detail.categoryName || 'Sản phẩm', detail.categoryName || 'Chi tiết'];
    this.currentCategoryId = detail.categoryId ?? '';
    this.badges = detail.badges.length ? detail.badges : this.badges;

    this.rating = detail.averageRating || 0;
    this.reviewCount = detail.reviewCount || 0;
    this.soldCount = detail.soldCount || 0;
    this.wishCount = detail.wishlistCount || 0;
    this.ratingDistribution = detail.ratingDistribution ?? this.ratingDistribution;

    this.currentPrice = detail.price || 0;
    this.oldPrice = detail.oldPrice ?? detail.price;
    this.discountPercent = detail.discountPercent || 0;
    this.stockText = detail.stockText || this.stockText;
    this.shippingText = detail.shippingText || this.shippingText;

    this.gallery = detail.images.map((i) => ({ type: i.type, url: i.url }));
    if (!this.gallery.length) this.gallery = [{ type: 'product', url: 'assets/images/banner/nen.png' }];
    this.selectedImageIndex = 0;

    this.shades = detail.variants.map((v) => ({
      id: v.id,
      name: `${v.shadeCode} ${v.shadeName}`.trim(),
      undertone: v.undertone,
      hex: v.swatchColor,
    }));
    if (this.shades.length) this.selectedShadeId = this.shades[0].id;

    this.highlights = [
      { label: 'Finish', value: detail.highlights.finish, icon: 'bi-stars' },
      { label: 'Coverage', value: detail.highlights.coverage, icon: 'bi-layers' },
      { label: 'Texture', value: detail.highlights.texture, icon: 'bi-droplet-half' },
      { label: 'Skin type', value: detail.highlights.skinType, icon: 'bi-heart-pulse' },
      { label: 'Wear time', value: detail.highlights.wearTime, icon: 'bi-clock-history' },
      { label: 'Best for', value: detail.highlights.bestFor, icon: 'bi-magic' },
    ];

    this.contentSections = detail.content;
    this.trustItems = detail.trustItems.length ? detail.trustItems : this.trustItems;

    this.bundleProducts = this.toMiniProducts(detail.recommendations.frequentlyBoughtTogether);
    this.similarProducts = this.toMiniProducts(detail.recommendations.similarProducts);

    this.reviews = detail.reviews.length
      ? detail.reviews.map((r) => ({
          id: r.id,
          userName: r.userName,
          avatar: r.avatar,
          verified: r.verified,
          shade: r.shade,
          rating: r.rating,
          title: r.title,
          body: r.body,
          images: r.images,
          date: r.date,
          helpful: r.helpful,
          createdAtMs: r.createdAtMs ?? 0,
        }))
      : [];

    this.updateReviewInsights();
  }

  private toMiniProducts(items: ProductDetailData['recommendations']['similarProducts']): PdpMiniProduct[] {
    return items.map((i) => ({
      id: i.id,
      slug: i.slug,
      name: i.name,
      brand: i.brand,
      attribute: i.attribute,
      rating: i.rating,
      price: i.price,
      oldPrice: i.oldPrice,
      sold: 0,
      image: i.image,
      badge: i.badge,
    }));
  }

  recoToProduct(item: PdpMiniProduct): Product {
    const slug = item.slug || this.slugify(item.name);
    return {
      _id: item.id || slug,
      slug,
      productName: item.name,
      productCode: (item.name || 'SKU').slice(0, 16).toUpperCase().replace(/\s+/g, '-'),
      price: item.price,
      compareAtPrice: item.oldPrice ?? null,
      shortDescription: item.attribute,
      averageRating: item.rating,
      bought: item.sold ?? 0,
      stock: 99,
      brandId: { _id: 'brand', brandName: item.brand },
      imageUrl: item.image,
      productMedia: [],
    };
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private isValidObjectId(value: string | null | undefined): boolean {
    const id = String(value || '').trim();
    return /^[a-f\d]{24}$/i.test(id);
  }

  private resolveVariantIdForApi(value: string | null | undefined): string | null {
    const id = String(value || '').trim();
    // Backend auto-picks first active variant when variantId is null.
    return this.isValidObjectId(id) ? id : null;
  }
}
