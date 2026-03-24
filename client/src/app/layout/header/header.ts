import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, forkJoin, takeUntil } from 'rxjs';
import { HeaderBrandItem, HeaderCategoryItem, HeaderSearchProductItem } from '../../core/models/header.model';
import { BrandService } from '../../core/services/brand.service';
import { CategoryService } from '../../core/services/category.service';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../features/cart/services/cart.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit, OnDestroy {
  categories: HeaderCategoryItem[] = [];
  brands: HeaderBrandItem[] = [];
  megaColumns: Array<{ title: string; items: HeaderCategoryItem[] }> = [];
  topBrands: HeaderBrandItem[] = [];
  promoCards = [
    {
      title: 'Set quà',
      subtitle: 'Quà tặng tinh tế cho mọi dịp',
      cta: 'Khám phá ngay',
      icon: 'bi-gift',
      route: ['/catalog'],
      queryParams: { category: 'set-qua' },
      tone: 'tone-gift',
    },
    {
      title: 'Sản phẩm Hot',
      subtitle: 'Top sản phẩm được yêu thích',
      cta: 'Xem bộ sưu tập',
      icon: 'bi-stars',
      route: ['/catalog'],
      queryParams: { sort: 'popular' },
      tone: 'tone-hot',
    },
    {
      title: 'Deal Hot',
      subtitle: 'Ưu đãi giới hạn hôm nay',
      cta: 'Săn ưu đãi',
      icon: 'bi-lightning-charge',
      route: ['/catalog', 'sale'],
      queryParams: {},
      tone: 'tone-deal',
    },
    {
      title: 'Cộng đồng Kanila',
      subtitle: 'Tips và cảm hứng làm đẹp',
      cta: 'Tham gia ngay',
      icon: 'bi-people',
      route: ['/community'],
      queryParams: {},
      tone: 'tone-community',
    },
  ];

  searchKeyword = '';
  suggestions: HeaderSearchProductItem[] = [];
  showSuggestions = false;
  searchLoading = false;

  headerLoading = true;
  headerError = false;
  cartBadgeCount = 0;

  private readonly destroy$ = new Subject<void>();
  private readonly searchInput$ = new Subject<string>();

  constructor(
    private readonly categoryService: CategoryService,
    private readonly brandService: BrandService,
    private readonly productService: ProductService,
    private readonly cartService: CartService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    forkJoin({
      categories: this.categoryService.getHeaderCategories(),
      brands: this.brandService.getHeaderBrands(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ categories, brands }) => {
          this.categories = categories;
          this.brands = brands;
          this.megaColumns = this.buildMegaColumns(categories);
          this.topBrands = brands.slice(0, 10);
          this.headerLoading = false;
        },
        error: () => {
          this.headerError = true;
          this.headerLoading = false;
        },
      });

    this.searchInput$
      .pipe(debounceTime(250), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((keyword) => {
        const q = keyword.trim();
        if (!q) {
          this.suggestions = [];
          this.searchLoading = false;
          return;
        }

        this.searchLoading = true;
        this.productService.searchHeaderProducts(q, 6).pipe(takeUntil(this.destroy$)).subscribe({
          next: (items) => {
            this.suggestions = items;
            this.searchLoading = false;
          },
          error: () => {
            this.suggestions = [];
            this.searchLoading = false;
          },
        });
      });

    this.cartService.cartTotalQuantity$
      .pipe(takeUntil(this.destroy$))
      .subscribe((count) => {
        this.cartBadgeCount = Math.max(0, Number(count || 0));
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchInput(value: string): void {
    this.searchKeyword = value;
    this.showSuggestions = true;
    this.searchInput$.next(value);
  }

  onSearchFocus(): void {
    this.showSuggestions = true;
  }

  onSearchBlur(): void {
    setTimeout(() => {
      this.showSuggestions = false;
    }, 120);
  }

  onSearchSubmit(event: Event): void {
    event.preventDefault();
    const q = this.searchKeyword.trim();
    if (!q) return;
    this.showSuggestions = false;
    this.router.navigate(['/search'], { queryParams: { q } });
  }

  onCategoryClick(item: HeaderCategoryItem, sub?: HeaderCategoryItem): void {
    const queryParams = sub
      ? { category: item.slug, sub: sub.slug }
      : { category: item.slug };
    this.router.navigate(['/catalog'], { queryParams });
  }

  onBrandClick(item: HeaderBrandItem): void {
    this.router.navigate(['/catalog'], { queryParams: { brand: item.slug } });
  }

  onSuggestionClick(item: HeaderSearchProductItem): void {
    this.showSuggestions = false;
    const slugOrId = item.slug || item.id;
    if (!slugOrId) return;
    this.router.navigate(['/catalog', 'product', slugOrId]);
  }

  private buildMegaColumns(categories: HeaderCategoryItem[]): Array<{ title: string; items: HeaderCategoryItem[] }> {
    const pickByKeyword = (keyword: string): HeaderCategoryItem | undefined => {
      return categories.find((c) => c.name.toLowerCase().includes(keyword));
    };

    const face = pickByKeyword('mặt') ?? pickByKeyword('face');
    const lip = pickByKeyword('môi') ?? pickByKeyword('lip');
    const eye = pickByKeyword('mắt') ?? pickByKeyword('eye');
    const cheek = pickByKeyword('má') ?? pickByKeyword('cheek');

    const picked = [face, lip, eye, cheek].filter((x): x is HeaderCategoryItem => !!x);
    const fallback = categories.filter((c) => !picked.some((p) => p.id === c.id)).slice(0, 4);
    const merged = [...picked, ...fallback].slice(0, 4);

    const labels = ['Khuôn mặt', 'Đôi môi', 'Đôi mắt', 'Đôi má'];
    return merged.map((c, i) => ({
      title: labels[i] ?? c.name,
      items: c.children.length ? c.children.slice(0, 6) : [c],
    }));
  }
}
