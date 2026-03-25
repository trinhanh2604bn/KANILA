import { Subscription, take } from 'rxjs';
import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Product } from '../../../../../core/models/product.model';
import { CartService } from '../../../../cart/services/cart.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { CheckoutService } from '../../../../checkout/services/checkout.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { WishlistService } from '../../../../account/services/wishlist.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-card.html',
  styleUrls: ['./product-card.css'],
})
export class ProductCardComponent implements OnChanges, OnDestroy {
  @Input() product?: Product | null;

  showPreview = false;
  wished = false;
  private wishedSub?: Subscription;

  constructor(
    private readonly router: Router,
    private readonly cartService: CartService,
    private readonly toast: ToastService,
    private readonly checkoutService: CheckoutService,
    private readonly authService: AuthService,
    private readonly wishlistService: WishlistService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['product']) this.bindWishlistState();
  }

  ngOnDestroy(): void {
    this.wishedSub?.unsubscribe();
  }

  /** Primary image: ProductMedia (isPrimary / sortOrder) then legacy imageUrl */
  get primaryImageUrl(): string {
    const media = this.product?.productMedia;
    if (media?.length) {
      const images = media.filter((m) => m.mediaType !== 'video');
      const list = images.length ? images : media;
      const sorted = [...list].sort((a, b) => {
        if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
        return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      });
      const first = sorted[0];
      if (first?.mediaUrl) return first.mediaUrl;
    }
    return this.product?.imageUrl?.trim() || 'assets/images/banner/nen.png';
  }

  get displayRating(): number {
    const r = this.product?.averageRating ?? 0;
    return Math.min(5, Math.round(r * 10) / 10);
  }

  get hasDiscount(): boolean {
    const c = this.product?.compareAtPrice;
    const p = this.product?.price ?? 0;
    return c != null && c > p;
  }

  get discountPercent(): number {
    if (!this.hasDiscount) return 0;
    const c = this.product!.compareAtPrice!;
    const p = this.product!.price;
    if (c <= 0) return 0;
    return Math.min(99, Math.round(((c - p) / c) * 100));
  }

  /** Progress bar: share sold vs remaining stock (caps at 100%) */
  get soldProgressPercent(): number {
    const bought = this.product?.bought ?? 0;
    const stock = this.product?.stock ?? 0;
    const total = bought + stock;
    if (total <= 0) return 72;
    return Math.min(100, Math.round((bought / total) * 100));
  }

  get stockStatus(): string {
    return (this.product?.stock ?? 0) > 0 ? 'Còn hàng' : 'Hết hàng';
  }

  openPreview(e: Event): void {
    e.stopPropagation();
    this.showPreview = true;
  }

  closePreview(): void {
    this.showPreview = false;
  }

  buyNow(e: Event): void {
    e.stopPropagation();
    const productId = this.product?._id;
    if (!productId) {
      this.toast.warning('Sản phẩm không hợp lệ.');
      return;
    }
    if ((this.product?.stock ?? 0) <= 0) {
      this.toast.warning('Sản phẩm hiện không còn khả dụng.');
      return;
    }
    if (!this.isAuthenticated()) {
      this.toast.warning('Vui lòng đăng nhập để sử dụng Mua ngay.');
      this.router.navigate(['/auth/login']);
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
      }
    });
  }

  addToCart(e: Event): void {
    e.stopPropagation();
    const productId = this.product?._id;
    if (!productId) return;
    this.cartService
      .addToCart({
        productId,
        variantId: null,
        quantity: 1,
        productName: this.product?.productName,
        brandName: this.product?.brandId?.brandName || '',
        variantLabel: this.product?.productCode || 'Default',
        imageUrl: this.primaryImageUrl,
        unitPrice: this.product?.price || 0,
        compareAtPrice: this.product?.compareAtPrice ?? null,
        stockStatus: (this.product?.stock ?? 0) > 0 ? 'in_stock' : 'out_of_stock',
      })
      .subscribe(() => {
        const err = this.cartService.getCurrentError();
        if (err) this.toast.error(err.message);
        else this.toast.success('Đã thêm sản phẩm vào giỏ hàng.');
      });
  }

  toggleWishlist(e: Event): void {
    e.stopPropagation();
    const productId = this.product?._id;
    if (!productId) return;
    this.wishlistService.toggleProduct(productId, null).pipe(take(1)).subscribe((ok) => {
      if (!ok) {
        this.toast.error('Không thể cập nhật danh mục yêu thích.');
        return;
      }
      this.toast.success(this.wishlistService.isWishlisted(productId) ? 'Đã thêm vào yêu thích.' : 'Đã xóa khỏi yêu thích.');
    });
  }

  goToDetail(e: Event): void {
    e.stopPropagation();
    const slugOrId = this.product?.slug || this.product?._id;
    if (slugOrId) {
      this.router.navigate(['/catalog', 'product', slugOrId]);
    }
  }

  onCardClick(): void {
    const slugOrId = this.product?.slug || this.product?._id;
    if (slugOrId) {
      this.router.navigate(['/catalog', 'product', slugOrId]);
    }
  }

  private isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  private bindWishlistState(): void {
    const productId = this.product?._id;
    this.wishedSub?.unsubscribe();
    if (!productId) {
      this.wished = false;
      return;
    }
    this.wishedSub = this.wishlistService.isWishlisted$(productId).subscribe((v) => (this.wished = v));
  }
}
