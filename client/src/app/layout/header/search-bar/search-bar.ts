import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnInit, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, map, of, switchMap } from 'rxjs';
import { HeaderBrandItem, HeaderCategoryItem } from '../../../core/models/header.model';
import { Product } from '../../../core/models/product.model';
import { BrandService } from '../../../core/services/brand.service';
import { CategoryService } from '../../../core/services/category.service';
import { ProductService } from '../../../core/services/product.service';

type SuggestionType = 'product' | 'category' | 'brand' | 'keyword' | 'history';

interface SuggestionItem {
  type: SuggestionType;
  label: string;
  value: string;
  imageUrl?: string;
  price?: number;
  slug?: string;
  parentSlug?: string;
}

interface CategorySearchNode {
  name: string;
  slug: string;
  parentSlug?: string;
}

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './search-bar.html',
  styleUrl: './search-bar.css',
})
export class SearchBarComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly brandService = inject(BrandService);
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly keywordControl = new FormControl('', { nonNullable: true });

  products: Product[] = [];
  categories: HeaderCategoryItem[] = [];
  brands: HeaderBrandItem[] = [];
  readonly staticKeywords = ['lip', 'foundation', 'face', 'mascara'];

  productSuggestions: SuggestionItem[] = [];
  categorySuggestions: SuggestionItem[] = [];
  brandSuggestions: SuggestionItem[] = [];
  keywordSuggestions: SuggestionItem[] = [];
  historySuggestions: SuggestionItem[] = [];
  domainRejected = false;
  readonly domainKeywords = [
    'my pham', 'makeup', 'skincare', 'son', 'phan', 'phan phu', 'phan mat', 'phan ma',
    'kem', 'kem nen', 'duong', 'serum', 'toner', 'cushion', 'mascara',
    'eyeliner', 'tay trang', 'chong nang', 'duong am', 'lip', 'foundation',
    'blush', 'powder', 'make up'
  ];
  readonly domainHints = ['lip', 'foundation', 'face'];

  isOpen = false;
  activeIndex = -1;

  ngOnInit(): void {
    this.categoryService.getHeaderCategories().subscribe((rows) => {
      this.categories = rows;
    });
    this.brandService.getHeaderBrands().subscribe((rows) => {
      this.brands = rows;
    });

    this.keywordControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((value) => {
          const keyword = value.trim();
          this.activeIndex = -1;
          if (!keyword) {
            return of({ keyword: '', products: [] as Product[], rejected: false });
          }
          if (!this.isDomainRelevant(keyword)) {
            return of({ keyword, products: [] as Product[], rejected: true });
          }
          return this.productService.searchProductsPreview(keyword, 6).pipe(
            map((products) => ({ keyword, products, rejected: false })),
            catchError(() => of({ keyword, products: [] as Product[], rejected: false }))
          );
        })
      )
      .subscribe((state) => {
        const keyword = state.keyword;
        this.isOpen = !!keyword;
        this.domainRejected = state.rejected;
        if (!keyword) {
          this.productSuggestions = [];
          this.categorySuggestions = [];
          this.brandSuggestions = [];
          this.keywordSuggestions = [];
          this.historySuggestions = this.readHistory().map((x) => ({ type: 'history', label: x, value: x }));
          return;
        }
        if (state.rejected) {
          this.productSuggestions = [];
          this.categorySuggestions = [];
          this.brandSuggestions = [];
          this.keywordSuggestions = [];
          this.historySuggestions = [];
          return;
        }
        this.applySuggestionsFromState(keyword, state.products);
      });
  }

  onFocus(): void {
    const keyword = this.keywordControl.value.trim();
    this.isOpen = true;
    if (!keyword) {
      this.activeIndex = -1;
      this.productSuggestions = [];
      this.categorySuggestions = [];
      this.brandSuggestions = [];
      this.keywordSuggestions = [];
      this.historySuggestions = this.readHistory().map((x) => ({ type: 'history', label: x, value: x }));
      return;
    }
    if (!this.isDomainRelevant(keyword)) {
      this.domainRejected = true;
      this.productSuggestions = [];
      this.categorySuggestions = [];
      this.brandSuggestions = [];
      this.keywordSuggestions = [];
      this.historySuggestions = [];
      return;
    }
    this.domainRejected = false;
    this.productService.searchProductsPreview(keyword, 6).subscribe({
      next: (products) => this.applySuggestionsFromState(keyword, products),
      error: () => this.applySuggestionsFromState(keyword, []),
    });
  }

  onSubmit(event?: Event): void {
    event?.preventDefault();
    const keyword = this.keywordControl.value.trim();
    if (!keyword) return;
    this.pushHistory(keyword);
    this.isOpen = false;
    this.router.navigate(['/catalog'], { queryParams: { search: keyword } });
    this.keywordControl.setValue('', { emitEvent: false });
  }

  onKeydown(event: KeyboardEvent): void {
    if (!this.isOpen) return;
    const items = this.flatSuggestions;
    if (!items.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeIndex = (this.activeIndex + 1) % items.length;
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex = this.activeIndex <= 0 ? items.length - 1 : this.activeIndex - 1;
      return;
    }

    if (event.key === 'Enter' && this.activeIndex >= 0) {
      event.preventDefault();
      this.selectSuggestion(items[this.activeIndex]);
    }
  }

  selectSuggestion(item: SuggestionItem): void {
    this.isOpen = false;
    if (item.type === 'product') {
      this.router.navigate(['/catalog', 'product', item.slug || item.value]);
      this.keywordControl.setValue('', { emitEvent: false });
      return;
    }
    if (item.type === 'category') {
      const category = item.parentSlug || item.slug || item.value;
      const queryParams = item.parentSlug
        ? { category, sub: item.slug || item.value }
        : { category };
      this.router.navigate(['/catalog'], { queryParams });
      this.keywordControl.setValue('', { emitEvent: false });
      return;
    }
    if (item.type === 'brand') {
      this.router.navigate(['/catalog'], { queryParams: { brand: item.slug || item.value } });
      this.keywordControl.setValue('', { emitEvent: false });
      return;
    }
    this.pushHistory(item.value);
    this.router.navigate(['/catalog'], { queryParams: { search: item.value } });
    this.keywordControl.setValue('', { emitEvent: false });
  }

  isActive(item: SuggestionItem): boolean {
    return this.flatSuggestions[this.activeIndex] === item;
  }

  private applySuggestionsFromState(keyword: string, products: Product[]): void {
    const normalizedKeyword = this.normalize(keyword);
    const looseKeyword = this.toLooseText(normalizedKeyword);

    this.productSuggestions = products.slice(0, 6).map((p) => ({
      type: 'product' as const,
      label: p.productName,
      value: p._id,
      slug: p.slug || p._id,
      imageUrl: this.resolveImage(p),
      price: p.price,
    }));

    const flattenedCategories = this.flattenCategories(this.categories);
    this.categorySuggestions = flattenedCategories
      .filter((c) => this.isMatch(this.normalize(c.name), normalizedKeyword, looseKeyword))
      .slice(0, 4)
      .map((c) => ({
        type: 'category',
        label: c.name,
        value: c.slug,
        slug: c.slug,
        parentSlug: c.parentSlug,
      }));

    this.brandSuggestions = this.brands
      .filter((b) => this.isMatch(this.normalize(b.name), normalizedKeyword, looseKeyword))
      .slice(0, 4)
      .map((b) => ({
        type: 'brand',
        label: b.name,
        value: b.slug,
        slug: b.slug,
      }));

    this.keywordSuggestions = this.staticKeywords
      .filter((k) => this.isMatch(this.normalize(k), normalizedKeyword, looseKeyword))
      .slice(0, 4)
      .map((k) => ({
        type: 'keyword',
        label: k,
        value: k,
      }));

    this.historySuggestions = this.readHistory()
      .filter((k) => this.isMatch(this.normalize(k), normalizedKeyword, looseKeyword))
      .slice(0, 3)
      .map((k) => ({ type: 'history', label: k, value: k }));
  }

  private flattenCategories(items: HeaderCategoryItem[]): CategorySearchNode[] {
    const result: CategorySearchNode[] = [];
    for (const item of items) {
      result.push({ name: item.name, slug: item.slug });
      if (item.children.length) {
        result.push(...item.children.map((child) => ({ name: child.name, slug: child.slug, parentSlug: item.slug })));
      }
    }
    return result;
  }

  private normalize(value: string): string {
    return (value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private toLooseText(value: string): string {
    return value.replace(/(.)\1+/g, '$1');
  }

  private isMatch(field: string, keyword: string, looseKeyword: string): boolean {
    if (!field || !keyword) return false;
    const looseField = this.toLooseText(field);
    if (field.includes(keyword) || looseField.includes(looseKeyword)) return true;
    if (keyword.length >= 4 && !keyword.includes(' ')) {
      return field
        .split(' ')
        .filter((t) => t.length >= 4)
        .some((t) => this.toLooseText(t).includes(looseKeyword));
    }
    return false;
  }

  private isDomainRelevant(keyword: string): boolean {
    const normalizedKeyword = this.normalize(keyword);
    if (!normalizedKeyword) return true;
    if (normalizedKeyword.length <= 2) return true;
    if (this.domainKeywords.some((k) => k.includes(normalizedKeyword) || normalizedKeyword.includes(k))) return true;
    const entitySource = [
      ...this.categories.flatMap((c) => [this.normalize(c.name), ...c.children.map((s) => this.normalize(s.name))]),
      ...this.brands.map((b) => this.normalize(b.name)),
    ];
    const looseKeyword = this.toLooseText(normalizedKeyword);
    return entitySource.some((x) => this.isMatch(x, normalizedKeyword, looseKeyword));
  }

  private resolveImage(p: Product): string {
    const media = p.productMedia ?? [];
    if (media.length > 0) {
      const sorted = [...media].sort((a, b) => {
        if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
        return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      });
      if (sorted[0]?.mediaUrl) return sorted[0].mediaUrl;
    }
    return p.imageUrl ?? '';
  }

  private pushHistory(keyword: string): void {
    const key = 'kanila_search_history';
    const current = this.readHistory().filter((x) => this.normalize(x) !== this.normalize(keyword));
    const next = [keyword, ...current].slice(0, 8);
    localStorage.setItem(key, JSON.stringify(next));
  }

  private readHistory(): string[] {
    try {
      const raw = localStorage.getItem('kanila_search_history');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
    } catch {
      return [];
    }
  }

  get flatSuggestions(): SuggestionItem[] {
    return [
      ...this.historySuggestions,
      ...this.productSuggestions,
      ...this.categorySuggestions,
      ...this.brandSuggestions,
      ...this.keywordSuggestions,
    ];
  }



  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node | null;
    if (!target) return;
    if (!this.elementRef.nativeElement.contains(target)) {
      this.isOpen = false;
      this.activeIndex = -1;
    }
  }
}