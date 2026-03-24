import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Subject, forkJoin, takeUntil } from 'rxjs';
import { HeaderBrandItem, HeaderCategoryItem } from '../../core/models/header.model';
import { AuthService } from '../../core/services/auth.service';
import { BrandService } from '../../core/services/brand.service';
import { CategoryService } from '../../core/services/category.service';
import { CartService } from '../../features/cart/services/cart.service';
import { SearchBarComponent } from './search-bar/search-bar';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink, SearchBarComponent],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit, OnDestroy {
  categories: HeaderCategoryItem[] = [];
  brands: HeaderBrandItem[] = [];
  megaColumns: Array<{ title: string; shortcutSlug: string; parent: HeaderCategoryItem; items: HeaderCategoryItem[] }> = [];
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

  headerLoading = true;
  headerError = false;
  cartBadgeCount = 0;
  accountMenuOpen = false;
  private cachedRoleToken = '';
  private cachedAccountType = '';

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly categoryService: CategoryService,
    private readonly brandService: BrandService,
    private readonly cartService: CartService,
    private readonly router: Router,
    private readonly authService: AuthService
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

  get isLoggedIn(): boolean {
    return this.authService.isAuthenticated();
  }

  get accountFirstName(): string {
    const payload = this.decodeTokenPayload();
    const fullName = String(payload?.['full_name'] || payload?.['fullName'] || payload?.['username'] || '').trim();
    if (!fullName) return 'Beauty Lover';
    return fullName.split(/\s+/)[0] || 'Beauty Lover';
  }

  get accountInitials(): string {
    const payload = this.decodeTokenPayload();
    const fullName = String(payload?.['full_name'] || payload?.['fullName'] || payload?.['username'] || '').trim();
    if (!fullName) return 'K';
    const parts = fullName.split(/\s+/).filter(Boolean);
    return (parts[0]?.[0] || 'K').toUpperCase();
  }

  get isAdminUser(): boolean {
    const accountType = this.getCachedAccountType();
    return accountType === 'admin' || accountType === 'super_admin';
  }

  toggleAccountMenu(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.accountMenuOpen = !this.accountMenuOpen;
  }

  closeAccountMenu(): void {
    this.accountMenuOpen = false;
  }

  logout(): void {
    this.authService.logout();
    this.cachedRoleToken = '';
    this.cachedAccountType = '';
    this.accountMenuOpen = false;
    this.router.navigate(['/']);
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

  onMegaItemClick(parent: HeaderCategoryItem, item: HeaderCategoryItem): void {
    if (parent.id === item.id) {
      this.onCategoryClick(parent);
      return;
    }
    this.onCategoryClick(parent, item);
  }

  onMegaColumnShortcutClick(categorySlug: string): void {
    this.router.navigate(['/catalog'], { queryParams: { category: categorySlug } });
  }

  onTrendingClick(kind: 'new' | 'best' | 'liked'): void {
    if (kind === 'new') {
      this.router.navigate(['/catalog'], { queryParams: { sort: 'new' } });
      return;
    }
    if (kind === 'best') {
      this.router.navigate(['/catalog'], { queryParams: { sort: 'popular' } });
      return;
    }
    this.router.navigate(['/catalog'], { queryParams: { rating: '5' } });
  }

  isCategoryShortcutActive(slug: string): boolean {
    const category = this.getQueryParam('category');
    return category === slug;
  }

  isTrendingActive(kind: 'new' | 'best' | 'liked'): boolean {
    const sort = this.getQueryParam('sort');
    const rating = this.getQueryParam('rating');
    if (kind === 'new') return sort === 'new';
    if (kind === 'best') return sort === 'popular';
    return rating === '5';
  }

  private buildMegaColumns(categories: HeaderCategoryItem[]): Array<{ title: string; shortcutSlug: string; parent: HeaderCategoryItem; items: HeaderCategoryItem[] }> {
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

    // ĐÃ CẬP NHẬT CHUẨN HÓA ĐƯỜNG DẪN Ở ĐÂY
    const shortcutSlugs = ['khuon-mat', 'oi-moi', 'oi-mat', 'oi-ma'];

    return merged.map((c, i) => ({
      title: labels[i] ?? c.name,
      shortcutSlug: shortcutSlugs[i] ?? c.slug,
      parent: c,
      items: c.children.length ? c.children.slice(0, 6) : [c],
    }));
  }

  private getQueryParam(key: string): string | null {
    const queryString = this.router.url.split('?')[1] ?? '';
    if (!queryString) return null;
    const params = new URLSearchParams(queryString);
    return params.get(key);
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.accountMenuOpen) this.accountMenuOpen = false;
  }

  private decodeTokenPayload(): Record<string, unknown> | null {
    const token = this.authService.getToken();
    if (!token) return null;
    try {
      const payloadPart = token.split('.')[1];
      if (!payloadPart) return null;
      const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
      return JSON.parse(atob(padded));
    } catch {
      return null;
    }
  }

  private getCachedAccountType(): string {
    const token = this.authService.getToken() || '';
    if (!token) return '';
    if (token === this.cachedRoleToken) return this.cachedAccountType;
    this.cachedRoleToken = token;
    this.cachedAccountType = this.authService.getAccountTypeFromToken();
    return this.cachedAccountType;
  }
}
