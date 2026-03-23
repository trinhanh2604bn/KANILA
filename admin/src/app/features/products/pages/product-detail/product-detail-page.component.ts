import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription, forkJoin, of, catchError } from 'rxjs';
import { ProductsApiService } from '../../services/products-api.service';
import { ProductVariantsApiService } from '../../services/product-variants-api.service';
import { Product } from '../../models/product.model';
import { ProductVariant } from '../../models/variant.model';

@Component({
  selector: 'app-product-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-detail-page.component.html',
  styleUrl: './product-detail-page.component.css',
})
export class ProductDetailPageComponent implements OnInit, OnDestroy {
  private readonly api = inject(ProductsApiService);
  private readonly variantApi = inject(ProductVariantsApiService);
  private readonly route = inject(ActivatedRoute);

  private routeSub?: Subscription;

  product = signal<Product | null>(null);
  variants = signal<ProductVariant[]>([]);
  loading = signal(true);
  activeImage = signal<string>('');

  ngOnInit(): void {
    // paramMap is reliable with lazy `loadChildren`; snapshot can miss `id` in some outlet setups.
    this.routeSub = this.route.paramMap.subscribe((pm) => {
      const id = pm.get('id')?.trim();
      if (!id) {
        this.loading.set(false);
        this.product.set(null);
        return;
      }
      this.loadProduct(id);
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  private loadProduct(id: string): void {
    this.loading.set(true);
    this.product.set(null);

    forkJoin({
      product: this.api.getById(id),
      variants: this.variantApi.getByProductId(id).pipe(catchError(() => of([] as ProductVariant[]))),
    }).subscribe({
      next: ({ product, variants }) => {
        this.product.set(product);
        this.variants.set(variants);
        const imgs = product.images?.length ? product.images : [];
        const first = imgs[0] ? this.api.resolveImageUrl(imgs[0]) : this.api.resolveImageUrl(product.imageUrl);
        this.activeImage.set(first);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.product.set(null);
        // HTTP errors: global error interceptor already shows a toast.
      },
    });
  }

  thumbUrl(url: string): string {
    return this.api.resolveImageUrl(url);
  }

  formatPrice(val: number): string {
    return val.toLocaleString('vi-VN') + '₫';
  }

  stockToneClass(stock: number): string {
    if (stock <= 5) return 'badge-danger';
    if (stock <= 20) return 'badge-warning';
    return 'badge-success';
  }
}
