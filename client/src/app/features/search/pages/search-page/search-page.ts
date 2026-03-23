import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, of, switchMap, takeUntil } from 'rxjs';
import { HeaderSearchProductItem } from '../../../../core/models/header.model';
import { ProductService } from '../../../../core/services/product.service';

@Component({
  selector: 'app-search-page',
  imports: [CommonModule],
  templateUrl: './search-page.html',
  styleUrl: './search-page.css',
})
export class SearchPageComponent implements OnInit, OnDestroy {
  keyword = '';
  items: HeaderSearchProductItem[] = [];
  loading = false;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly productService: ProductService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(
        takeUntil(this.destroy$),
        switchMap((params) => {
          this.keyword = (params.get('q') ?? '').trim();
          if (!this.keyword) {
            this.items = [];
            return of([]);
          }
          this.loading = true;
          return this.productService.searchHeaderProducts(this.keyword, 40);
        })
      )
      .subscribe({
        next: (items) => {
          this.items = items;
          this.loading = false;
        },
        error: () => {
          this.items = [];
          this.loading = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goToProduct(item: HeaderSearchProductItem): void {
    if (item.slug) {
      this.router.navigate(['/products', item.slug]);
      return;
    }
    this.router.navigate(['/product', item.id]);
  }
}
