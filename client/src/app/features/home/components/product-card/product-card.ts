import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Product } from '../../../../core/models/product.model';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-card.html',
  styleUrls: ['./product-card.css'],
})
export class ProductCardComponent {
  @Input() product?: Product | null;

  showPreview = false;

  constructor(private router: Router) {}

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
    this.goToDetail(e);
  }

  addToCart(e: Event): void {
    e.stopPropagation();
    // Cart integration can call a service here
  }

  goToDetail(e: Event): void {
    e.stopPropagation();
    if (this.product?._id) {
      this.router.navigate(['/product', this.product._id]);
    }
  }

  onCardClick(): void {
    if (this.product?._id) {
      this.router.navigate(['/product', this.product._id]);
    }
  }
}
