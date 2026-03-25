import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ProductService } from '../../../../../core/services/product.service';
import { CommonModule } from '@angular/common';
import { ProductCardComponent } from '../product-card/product-card';
import { Product } from '../../../../../core/models/product.model';

@Component({
  selector: 'app-product-slider',
  imports: [CommonModule, ProductCardComponent],
  templateUrl: './product-slider.html',
  styleUrl: './product-slider.css',
})
export class ProductSlider implements OnInit, OnChanges {
  /** Bounded pool from paginated API (popular); client slices 5 per view. */
  products: Product[] = [];
  /** Cached slice for *ngFor — updated only when page or data changes (avoids getter + new array every CD) */
  paginatedProducts: Product[] = [];

  loading = true;
  errorMessage: string | null = null;

  currentPage = 1;
  totalPages = 1;
  canGoPrev = false;
  canGoNext = false;

  /** One “page” = one full row (5 cards) */
  readonly itemsPerPage = 5;

  @Input() productsOverride: Product[] | null = null;
  @Input() errorOverride: string | null = null;

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    // Override mode (used by personalized homepage): avoid recomputing/reloading.
    if (this.productsOverride !== null) {
      this.products = this.productsOverride ?? [];
      this.errorMessage = this.errorOverride;
      this.currentPage = 1;
      this.loading = false;
      this.refreshPagination();
      return;
    }

    this.loading = true;
    this.errorMessage = null;

    this.productService.getHomeSliderProducts(50).subscribe({
      next: (list) => {
        this.products = list;
        this.currentPage = 1;
        this.refreshPagination();
        this.loading = false;
      },
      error: (err) => {
        // Keep UI stable even if the API fails (CORS/network/auth/etc).
        // eslint-disable-next-line no-console
        console.error(err);
        this.errorMessage = 'Không thể tải sản phẩm. Vui lòng thử lại sau.';
        this.loading = false;
      },
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['productsOverride'] && this.productsOverride !== null) {
      this.products = this.productsOverride ?? [];
      this.errorMessage = this.errorOverride;
      this.currentPage = 1;
      this.loading = false;
      this.refreshPagination();
    }
  }

  /** Recompute slice + nav flags — call after `currentPage` or `products` changes */
  private refreshPagination(): void {
    const n = this.products.length;
    this.totalPages = n <= 0 ? 1 : Math.ceil(n / this.itemsPerPage);
    this.currentPage = Math.min(Math.max(1, this.currentPage), this.totalPages);

    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedProducts = this.products.slice(start, start + this.itemsPerPage);

    this.canGoPrev = this.currentPage > 1;
    this.canGoNext = this.currentPage < this.totalPages;
  }

  trackByProductId(_index: number, product: Product): string {
    return product._id;
  }

  goToPage(page: number, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    const next = Math.min(Math.max(1, page), this.totalPages);
    if (next === this.currentPage) return;
    this.currentPage = next;
    this.refreshPagination();
  }

  prev(event?: Event): void {
    this.goToPage(this.currentPage - 1, event);
  }

  next(event?: Event): void {
    this.goToPage(this.currentPage + 1, event);
  }
}
