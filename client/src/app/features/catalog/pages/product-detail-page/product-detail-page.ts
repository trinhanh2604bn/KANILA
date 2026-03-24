import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { catchError, of } from 'rxjs';
import { ProductDetailContentSections, ProductDetailData } from '../../models/product-detail.model';
import { ProductDetailService } from '../../services/product-detail.service';
import { ProductCardComponent } from '../../../home/pages/components/product-card/product-card';
import { Product } from '../../../../core/models/product.model';
import { CartService } from '../../../cart/services/cart.service';
import { ToastService } from '../../../../core/services/toast.service';

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
  imports: [CommonModule, RouterModule, ProductCardComponent],
  templateUrl: './product-detail-page.html',
  styleUrl: './product-detail-page.css',
})
export class CatalogProductDetailPageComponent implements OnInit {
  readonly reviewInsightTags: string[] = ['Mịn lì tự nhiên', 'Bền màu lâu trôi', 'Dễ tán', 'Không xuống tông'];
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
  private productId = '';

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

  sameBrandProducts: PdpMiniProduct[] = [
    { name: 'Skin Veil Concealer', brand: 'KANILA Atelier', attribute: 'High coverage, crease-free', rating: 4.8, price: 320000, image: 'https://images.unsplash.com/photo-1590156202996-79f2b73f95c1?auto=format&fit=crop&w=600&q=80' },
    { name: 'Velvet Cheek Mousse', brand: 'KANILA Atelier', attribute: 'Soft-matte blush tint', rating: 4.7, price: 330000, image: 'https://images.unsplash.com/photo-1631730487054-4ab2ea4d2c8f?auto=format&fit=crop&w=600&q=80' },
    { name: 'Glass Tint Lip Oil', brand: 'KANILA Atelier', attribute: 'Sheer glossy wash', rating: 4.6, price: 290000, image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=600&q=80' },
  ];

  recentProducts: PdpMiniProduct[] = [
    { name: 'Glow Corrector Palette', brand: 'Nude Bloom', attribute: 'Peach/green/lilac correctors', rating: 4.5, price: 450000, image: 'https://images.unsplash.com/photo-1596815064285-45ed8a9c0463?auto=format&fit=crop&w=600&q=80' },
    { name: 'Feather Lash Mascara', brand: 'Maison Flawless', attribute: 'Length + curl hold', rating: 4.6, price: 370000, image: 'https://images.unsplash.com/photo-1583001931096-959e9a1a6223?auto=format&fit=crop&w=600&q=80' },
    { name: 'Radiance Mist', brand: 'Le Rosé Beauty', attribute: 'Hydrating setting mist', rating: 4.4, price: 310000, image: 'https://images.unsplash.com/photo-1571781418606-70265b9cce90?auto=format&fit=crop&w=600&q=80' },
  ];

  reviews: PdpReview[] = [
    {
      id: 'r1',
      userName: 'Mai Anh',
      avatar: 'https://i.pravatar.cc/100?img=5',
      verified: true,
      shade: 'W20 Warm Beige',
      rating: 5,
      title: 'Đẹp mịn như filter, vẫn nhẹ mặt',
      body: 'Finish rất sang, không bị mốc vùng cánh mũi sau 8 tiếng văn phòng. Layer thêm vẫn không dày.',
      images: ['https://images.unsplash.com/photo-1603575448364-4f4f0f3c9033?auto=format&fit=crop&w=600&q=80'],
      date: '12/03/2026',
      helpful: 22,
    },
    {
      id: 'r2',
      userName: 'Quynh Le',
      avatar: 'https://i.pravatar.cc/100?img=32',
      verified: true,
      shade: 'N15 Light Neutral',
      rating: 4,
      title: 'Che phủ tốt, nền không bị xỉn',
      body: 'Mình da hỗn hợp thiên dầu, tầm 6 tiếng vẫn đẹp. Khuyên set nhẹ vùng chữ T để kiểm dầu tốt hơn.',
      images: [],
      date: '07/03/2026',
      helpful: 14,
    },
    {
      id: 'r3',
      userName: 'Linh Chi',
      avatar: 'https://i.pravatar.cc/100?img=15',
      verified: false,
      shade: 'C23 Soft Sand',
      rating: 5,
      title: 'Ảnh lên tông da cực tự nhiên',
      body: 'Texture mỏng, tán bằng mút siêu nhanh. Độ bám rất tốt cả khi đi ngoài trời.',
      images: ['https://images.unsplash.com/photo-1596704017254-9f1d2d3ed3f4?auto=format&fit=crop&w=600&q=80'],
      date: '03/03/2026',
      helpful: 9,
    },
    {
      id: 'r4',
      userName: 'Thanh Vy',
      avatar: 'https://i.pravatar.cc/100?img=47',
      verified: true,
      shade: 'W27 Honey',
      rating: 3,
      title: 'Tông đẹp nhưng cần dưỡng kỹ',
      body: 'Da khô như mình thì prep kỹ sẽ đẹp hơn nhiều. Sau khi dưỡng đủ ẩm thì finish rất xịn.',
      images: [],
      date: '27/02/2026',
      helpful: 6,
    },
  ];

  selectedImageIndex = 0;
  selectedShadeId = this.shades[1].id;
  quantity = 1;
  reviewFilter: 'all' | '5' | '4' | '3' | '2' | '1' | 'withImage' | 'verified' = 'all';
  stickyVisible = false;
  isAddingToCart = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly detailService: ProductDetailService,
    private readonly cartService: CartService,
    private readonly toast: ToastService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const slugOrId = (params.get('slug') ?? '').trim();
      if (!slugOrId) {
        this.loading = false;
        this.hasError = true;
        return;
      }

      this.loading = true;
      this.hasError = false;
      this.detailService
        .getProductDetail(slugOrId)
        .pipe(catchError(() => of(null)))
        .subscribe((detail) => {
          if (!detail) {
            this.loading = false;
            this.hasError = true;
            return;
          }
          this.applyDetail(detail);
          this.loading = false;
          this.hasError = false;
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
    if (this.reviewFilter === 'all') return this.reviews;
    if (this.reviewFilter === 'withImage') return this.reviews.filter((r) => r.images.length > 0);
    if (this.reviewFilter === 'verified') return this.reviews.filter((r) => r.verified);
    return this.reviews.filter((r) => r.rating === Number(this.reviewFilter));
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

    const variantId = this.selectedShadeId || null;
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

  setTab(tab: (typeof this.infoTabs)[number]): void {
    this.activeTab = tab;
  }

  setReviewFilter(filter: 'all' | '5' | '4' | '3' | '2' | '1' | 'withImage' | 'verified'): void {
    this.reviewFilter = filter;
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
    this.breadcrumb = ['Trang chủ', detail.parentCategoryName || detail.categoryName || 'Sản phẩm', detail.categoryName || 'Chi tiết'];
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
    this.sameBrandProducts = this.toMiniProducts(detail.recommendations.sameBrandProducts);
    this.recentProducts = this.toMiniProducts(detail.recommendations.recentlyViewed);

    this.reviews = detail.reviews.length ? detail.reviews.map((r) => ({
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
    })) : this.reviews;
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
}
