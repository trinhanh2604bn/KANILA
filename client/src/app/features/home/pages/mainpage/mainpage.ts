import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Header } from '../../../../layout/header/header';
import { Footer } from '../../../../layout/footer/footer';
import { Slider } from '../../components/slider/slider';
import { Divider } from '../../components/divider/divider';
import { ProductSlider } from '../../components/product-slider/product-slider';
import { Bfslider } from '../../components/bfslider/bfslider';
import { Brand } from '../../components/brand/brand';
import { Roya } from '../../components/roya/roya';
import { ProductService } from '../../../../core/services/product.service';
import { Product } from '../../../../core/models/product.model';

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
Header],
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

  constructor(
    private readonly productService: ProductService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.featuredLoading = true;
    this.featuredError = null;

    this.productService.getProducts().subscribe({
      next: (list) => {
        // “Bán chạy” / trending feel: prioritize most sold items.
        this.featuredProducts = [...list]
          .sort((a, b) => (b.bought ?? 0) - (a.bought ?? 0))
          .slice(0, 3);
        this.featuredLoading = false;
      },
      error: (err) => {
        // eslint-disable-next-line no-console
        console.error(err);
        this.featuredError = 'Không thể tải sản phẩm nổi bật.';
        this.featuredLoading = false;
      },
    });
  }

  goCategory(): void {
    // No dedicated category/list route exists in this client yet.
    // For now, navigate to the home page.
    this.router.navigateByUrl('/');
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
    if (product._id) {
      this.router.navigate(['/product', product._id]);
    }
  }

  addToCart(_product: Product, e: Event): void {
    // Cart integration is not implemented in this page yet.
    e.stopPropagation();
  }
}
