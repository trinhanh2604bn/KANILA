import { take } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Header } from '../../../../layout/header/header';
import { Footer } from '../../../../layout/footer/footer';
import { Slider } from '../components/slider/slider';
import { Divider } from '../components/divider/divider';
import { ProductSlider } from '../components/product-slider/product-slider';
import { Bfslider } from '../components/bfslider/bfslider';
import { Brand } from '../components/brand/brand';
import { Roya } from '../components/roya/roya';
import { ProductService } from '../../../../core/services/product.service';
import { Product } from '../../../../core/models/product.model';
import { CartService } from '../../../cart/services/cart.service';
import { ToastService } from '../../../../core/services/toast.service';
import { GlobalToastComponent } from '../../../../layout/global-toast/global-toast';
import { CheckoutService } from '../../../checkout/services/checkout.service';
import { AuthService } from '../../../../core/services/auth.service';
import { RecommendationService } from '../../../../core/services/recommendation.service';
import { ProfileHubService } from '../../../account/services/profile-hub.service';
import { ScrollToTop } from '../../../../layout/scroll-to-top/scroll-to-top';
import { CouponAvailableItem, CouponService } from '../../../account/services/coupon.service';

@Component({
  selector: 'app-mainpage',
  imports: [CommonModule,
    Slider,
    Divider,
    ProductSlider,
    Bfslider,
    Brand,
    Roya,
  Footer,
Header,
GlobalToastComponent,
ScrollToTop,
],
  templateUrl: './mainpage.html',
  styleUrl: './mainpage.css',
})
export class Mainpage implements OnInit {
  featuredProducts: Product[] = [];
  featuredLoading = true;
  featuredError: string | null = null;

  selectedFeaturedIndex: number | null = null;
  hoveredFeaturedIndex: number | null = null;

  previewProduct: Product | null = null;
  personalizedProducts: Product[] = [];
  personalizedLoading = false;
  personalizedError = '';
  hasSkinProfile = false;
  campaignCoupons: CouponAvailableItem[] = [];

  constructor(
    private readonly productService: ProductService,
    private readonly router: Router,
    private readonly cartService: CartService,
    private readonly toast: ToastService,
    private readonly checkoutService: CheckoutService,
    private readonly authService: AuthService,
    private readonly recommendationService: RecommendationService,
    private readonly profileHubService: ProfileHubService,
    private readonly couponService: CouponService,
  ) {}

  ngOnInit(): void {
    this.featuredLoading = true;
    this.featuredError = null;

    this.productService.getHomeFeaturedProducts(3).subscribe({
      next: (list) => {
        this.featuredProducts = list.slice(0, 3);
        this.featuredLoading = false;
      },
      error: (err) => {
        // eslint-disable-next-line no-console
        console.error(err);
        this.featuredError = 'Không thể tải sản phẩm nổi bật.';
        this.featuredLoading = false;
      },
    });

    this.loadPersonalizedRecommendations();
    this.couponService.getAvailable().pipe(take(1)).subscribe((list) => {
      this.campaignCoupons = list.slice(0, 4);
    });
  }

  goCategory(): void {
    // No dedicated category/list route exists in this client yet.
    // For now, navigate to the home page.
    this.router.navigateByUrl('/');
  }

  goToCommunity(): void {
    this.router.navigate(['/community/communityhome']);
  }

  trackById(_index: number, product: Product): string {
    return product._id;
  }

  selectFeaturedProduct(index: number): void {
    if (this.featuredProducts.length === 0) return;
    this.selectedFeaturedIndex = index;

    setTimeout(() => {
      const el = document.getElementById(`anhbg-product-${index}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 0);
  }

  setHoveredFeaturedProduct(index: number | null): void {
    this.hoveredFeaturedIndex = index;
  }

  getFeaturedImage(product: Product): string {
    const media = product.productMedia;
    if (media?.length) {
      const images = media.filter((m) => m.mediaType !== 'video');
      const list = images.length ? images : media;
      const sorted = [...list].sort((a, b) => {
        if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
        return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      });
      if (sorted[0]?.mediaUrl) return sorted[0].mediaUrl;
    }
    return product.imageUrl?.trim() || 'assets/images/banner/nen.png';
  }

  getVariantLabel(product: Product, index: number): string {
    const code = product.productCode?.trim();
    if (!code) return `màu ${index + 1}`;
    const parts = code.split('-');
    return parts[parts.length - 1] || `màu ${index + 1}`;
  }

  getDisplayRating(product: Product): number {
    const r = product.averageRating ?? 0;
    return Math.min(5, Math.round(r * 10) / 10);
  }

  openPreview(product: Product, e: Event): void {
    e.stopPropagation();
    this.previewProduct = product;
  }

  closePreview(): void {
    this.previewProduct = null;
  }

  stockStatus(product: Product): string {
    return (product.stock ?? 0) > 0 ? 'Còn hàng' : 'Hết hàng';
  }

  soldProgressPercent(product: Product): number {
    const bought = product.bought ?? 0;
    const stock = product.stock ?? 0;
    const total = bought + stock;
    if (total <= 0) return 72;
    return Math.min(100, Math.round((bought / total) * 100));
  }

  goToDetail(product: Product, e: Event): void {
    e.stopPropagation();
    const slugOrId = product.slug || product._id;
    if (slugOrId) {
      this.router.navigate(['/catalog', 'product', slugOrId]);
    }
  }

  addToCart(product: Product, e: Event): void {
    e.stopPropagation();
    const productId = product._id;
    if (!productId) return;
    this.cartService
      .addToCart({
        productId,
        quantity: 1,
        variantId: null,
        productName: product.productName,
        brandName: product.brandId?.brandName || '',
        variantLabel: product.productCode || 'Default',
        imageUrl: this.getFeaturedImage(product),
        unitPrice: product.price || 0,
        compareAtPrice: product.compareAtPrice ?? null,
        stockStatus: (product.stock ?? 0) > 0 ? 'in_stock' : 'out_of_stock',
      })
      .subscribe(() => {
        const err = this.cartService.getCurrentError();
        if (err) this.toast.error(err.message);
        else this.toast.success('Đã thêm sản phẩm vào giỏ hàng.');
      });
  }

  buyNow(product: Product, e: Event): void {
    e.stopPropagation();
    const productId = product._id;
    if (!productId) {
      this.toast.warning('Sản phẩm không hợp lệ.');
      return;
    }
    if ((product.stock ?? 0) <= 0) {
      this.toast.warning('Sản phẩm hiện không còn khả dụng.');
      return;
    }
    this.checkoutService.createBuyNowCheckoutSession({
      productId,
      variantId: null,
      quantity: 1,
    }).pipe(take(1)).subscribe({
      next: (session) => {
        this.router.navigate(['/checkout'], { queryParams: { sessionId: session.sessionId } });
      },
      error: (err) => {
        const issues = this.checkoutService.mapIssues(err);
        this.toast.error(issues[0]?.message || 'Không thể mua ngay. Vui lòng thử lại.');
      },
    });
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  goToSkinProfile(): void {
    this.router.navigate(['/account/skin-profile']);
  }

  retryPersonalized(): void {
    this.loadPersonalizedRecommendations();
  }

  private loadPersonalizedRecommendations(): void {
    if (!this.isAuthenticated()) return;
    this.personalizedLoading = true;
    this.personalizedError = '';
    this.profileHubService.getSkinProfile().pipe(take(1)).subscribe((profile) => {
      this.hasSkinProfile = !!profile && (
        (profile.skin_type?.length || 0) > 0 ||
        !!profile.skin_tone ||
        (profile.concerns?.length || 0) > 0
      );
      if (!this.hasSkinProfile) {
        this.personalizedLoading = false;
        this.personalizedProducts = [];
        return;
      }
      this.recommendationService.getMyHomepageRecommendations(20).pipe(take(1)).subscribe({
        next: (products) => {
          this.personalizedProducts = products;
          this.personalizedLoading = false;
        },
        error: () => {
          this.personalizedLoading = false;
          this.personalizedError = 'Không thể tải gợi ý cá nhân hóa.';
        },
      });
    });
  }

  saveCampaignCoupon(couponId: string): void {
    this.couponService.saveCoupon(couponId).pipe(take(1)).subscribe((res) => {
      if (!res.success) {
        this.toast.error('Không thể lưu mã giảm giá.');
        return;
      }
      this.campaignCoupons = this.campaignCoupons.map((x) => x._id === couponId ? { ...x, isSaved: true } : x);
      this.toast.success(res.alreadySaved ? 'Mã đã có trong ví ưu đãi.' : 'Đã lưu mã ưu đãi.');
    });
  }
}
