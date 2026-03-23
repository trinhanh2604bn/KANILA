import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { HeaderCategoryItem } from '../../core/models/header.model';
import { Product } from '../../core/models/product.model';
import { BrandService } from '../../core/services/brand.service';
import { CategoryService } from '../../core/services/category.service';
import { ProductAttributeRow, ProductAttributeService } from '../../core/services/product-attribute.service';
import { ProductService } from '../../core/services/product.service';
import {
  CatalogBrandFilterItem,
  CatalogCategoryItem,
  CatalogFilterState,
  CatalogQueryParams,
  CatalogSortOption,
} from './models/catalog-filter.model';

interface CatalogProductRow {
  id: string;
  name: string;
  slug?: string;
  brand: string;
  brandSlug: string;
  parentSlug: string;
  subSlug?: string;
  skinTypes: string[];
  price: number;
  oldPrice: number | null;
  isSale: boolean;
  sold: number;
  imageUrl?: string;
}

@Component({
  selector: 'app-catalog',
  imports: [FormsModule, RouterModule, CommonModule],
  templateUrl: './catalog.html',
  styleUrl: './catalog.css',
})
export class Catalog implements OnInit {
  isSalePage: boolean = false;
  isScrolled: boolean = false;
  loading = true;
  hasError = false;

  categories: CatalogCategoryItem[] = [];

  brands: string[] = [];
  skinTypes: string[] = [];
  private brandItems: CatalogBrandFilterItem[] = [];
  private brandSlugMap = new Map<string, string>();

  allProducts: CatalogProductRow[] = [];

  filteredProducts: CatalogProductRow[] = [];

  selectedParentCategory: CatalogCategoryItem | null = null;
  selectedSubCategory: string | null = null;
  selectedBrands: string[] = [];
  selectedSkinTypes: string[] = [];
  selectedPrice: { label: string, min: number, max: number } | null = null;
  activeSort: CatalogSortOption = 'popular';
  openDropdown: string | null = null;
  selectedBrandFromHeader: string | null = null;

  minPriceInput: number = 0;
  maxPriceInput: number = 5000000;
  maxLimit: number = 5000000;
  suggestedSkinType: string | null = null;

  private readonly filterState: CatalogFilterState = {
    categorySlug: null,
    subCategorySlug: null,
    brandSlugs: [],
    skinTypes: [],
    minPrice: 0,
    maxPrice: 5000000,
    sort: 'popular',
  };

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly categoryService: CategoryService,
    private readonly brandService: BrandService,
    private readonly productService: ProductService,
    private readonly productAttributeService: ProductAttributeService
  ) {}

  ngOnInit() {
    this.route.url.subscribe((urlSegments) => {
      this.isSalePage = urlSegments.length > 0 && urlSegments[0].path === 'sale';
    });

    this.loading = true;
    this.hasError = false;

    forkJoin({
      categoryTree: this.categoryService.getHeaderCategories(),
      brandItems: this.brandService.getHeaderBrands(),
      products: this.productService.getProducts(),
      attributes: this.productAttributeService.getAll(),
    }).subscribe({
      next: ({ categoryTree, brandItems, products, attributes }) => {
        this.categories = categoryTree.map((c) => ({
          id: c.id,
          slug: c.slug,
          name: c.name,
          subCategories: c.children.map((s) => ({ id: s.id, slug: s.slug, name: s.name })),
        }));

        this.brandItems = brandItems.map((b) => ({ id: b.id, name: b.name, slug: b.slug }));
        this.brands = this.brandItems.map((b) => b.name);
        this.brandSlugMap = new Map(this.brandItems.map((b) => [b.slug, b.name]));

        this.allProducts = this.mapProducts(products, attributes);
        this.skinTypes = this.extractSkinTypes(this.allProducts);
        this.suggestedSkinType = this.resolveSuggestedSkinType(this.skinTypes);
        this.maxLimit = this.computeMaxPrice(this.allProducts);
        this.route.queryParams.subscribe((params) => {
          this.applyRouteState(params);
          this.applyLocalFilters();
        });
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.hasError = true;
      },
    });
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 100;
  }

  getSubCategoryName(): string {
    if (this.selectedParentCategory && this.selectedSubCategory) {
      const sub = this.selectedParentCategory.subCategories.find((s) => s.slug === this.selectedSubCategory);
      return sub ? sub.name : '';
    }
    return '';
  }

  selectParentCategory(cat: CatalogCategoryItem) {
    const newCatSlug = this.selectedParentCategory?.id === cat.id ? null : cat.slug;
    this.updateRouteState({ category: newCatSlug, sub: null });
  }

  selectSubCategory(subSlug: string) {
    const newSub = this.selectedSubCategory === subSlug ? null : subSlug;
    this.updateRouteState({ sub: newSub });
  }

  resetToAllProducts() {
    this.updateRouteState({
      category: null,
      sub: null,
      brand: null,
      skin: null,
      minPrice: null,
      maxPrice: null,
      sort: null,
    });
  }

  clearCategoryFilter() {
    this.updateRouteState({ category: null, sub: null });
  }

  clearBrandFilter() {
    this.updateRouteState({ brand: null });
  }

  applyLocalFilters() {
    let temp = [...this.allProducts];
    if (this.isSalePage) temp = temp.filter((p) => p.isSale === true);

    if (this.selectedSubCategory) temp = temp.filter((p) => p.subSlug === this.selectedSubCategory);
    else if (this.selectedParentCategory) {
      const parentSlug = this.selectedParentCategory.slug;
      temp = temp.filter((p) => p.parentSlug === parentSlug);
    }

    if (this.selectedBrands.length > 0) {
      const lowerSelectedBrands = this.selectedBrands.map((b) => b.toLowerCase());
      temp = temp.filter((p) => lowerSelectedBrands.includes(p.brand.toLowerCase()));
    }

    if (this.selectedSkinTypes.length > 0) {
      temp = temp.filter((p) => p.skinTypes.some((s) => this.selectedSkinTypes.includes(s)));
    }

    temp = temp.filter((p) => p.price >= this.minPriceInput && p.price <= this.maxPriceInput);

    if (this.activeSort === 'price_asc') temp.sort((a, b) => a.price - b.price);
    else if (this.activeSort === 'price_desc') temp.sort((a, b) => b.price - a.price);
    else if (this.activeSort === 'popular') temp.sort((a, b) => (b.sold ?? 0) - (a.sold ?? 0));
    else if (this.activeSort === 'hot_deal') {
      temp = temp.filter((p) => p.isSale);
      temp.sort((a, b) => (b.oldPrice ?? b.price) - b.price - ((a.oldPrice ?? a.price) - a.price));
    }

    this.filteredProducts = temp;
  }

  onMinPriceInput() {
    if (this.minPriceInput < 0) this.minPriceInput = 0;
    if (this.minPriceInput > this.maxPriceInput) this.minPriceInput = this.maxPriceInput;
    this.updatePriceLabel();
  }
  onMaxPriceInput() {
    if (this.maxPriceInput > this.maxLimit) this.maxPriceInput = this.maxLimit;
    if (this.maxPriceInput < this.minPriceInput) this.maxPriceInput = this.minPriceInput;
    this.updatePriceLabel();
  }
  updatePriceLabel() {
    this.selectedPrice = {
      label: `Giá: ${this.minPriceInput.toLocaleString('vi-VN')}đ - ${this.maxPriceInput.toLocaleString('vi-VN')}đ`,
      min: this.minPriceInput,
      max: this.maxPriceInput,
    };
  }
  onPriceChangeDone() {
    const min = this.minPriceInput > 0 ? this.minPriceInput : null;
    const max = this.maxPriceInput < this.maxLimit ? this.maxPriceInput : null;
    this.updateRouteState({ minPrice: min, maxPrice: max });
  }
  toggleDropdown(dropdownName: string, event: Event) {
    event.stopPropagation();
    this.openDropdown = this.openDropdown === dropdownName ? null : dropdownName;
  }
  toggleBrand(brand: string) {
    const index = this.selectedBrands.indexOf(brand);
    const next = [...this.selectedBrands];
    if (index > -1) next.splice(index, 1);
    else next.push(brand);
    this.updateRouteState({ brand: this.toBrandParam(next) });
  }
  toggleSkinType(type: string) {
    const index = this.selectedSkinTypes.indexOf(type);
    const next = [...this.selectedSkinTypes];
    if (index > -1) next.splice(index, 1);
    else next.push(type);
    this.updateRouteState({ skin: next.length ? next.join(',') : null });
  }
  selectSort(sortType: CatalogSortOption) {
    this.updateRouteState({ sort: sortType });
  }
  removeFilter(type: string, value: string | null) {
    if (type === 'brand' && value) {
      this.updateRouteState({ brand: this.toBrandParam(this.selectedBrands.filter((b) => b !== value)) });
    } else if (type === 'skin' && value) {
      this.updateRouteState({ skin: this.selectedSkinTypes.filter((s) => s !== value).join(',') || null });
    } else if (type === 'price') {
      this.updateRouteState({ minPrice: null, maxPrice: null });
    }
  }

  clearAllFilters() {
    this.updateRouteState({ skin: null, minPrice: null, maxPrice: null, brand: null });
  }

  hasActiveFilters(): boolean {
    return (
      this.selectedBrands.length > 0 ||
      this.selectedSkinTypes.length > 0 ||
      this.selectedPrice !== null ||
      !!this.selectedBrandFromHeader ||
      !!this.selectedParentCategory ||
      !!this.selectedSubCategory
    );
  }

  @HostListener('document:click')
  onDocumentClick() { this.openDropdown = null; }

  applySuggestedSkinType(): void {
    if (!this.suggestedSkinType) return;
    if (!this.selectedSkinTypes.includes(this.suggestedSkinType)) {
      this.toggleSkinType(this.suggestedSkinType);
    }
  }

  private applyRouteState(params: Record<string, string>) {
    const categorySlug = (params['category'] ?? '').trim() || null;
    const subSlug = (params['sub'] ?? '').trim() || null;
    const brandParam = (params['brand'] ?? '').trim();
    const skinParam = (params['skin'] ?? '').trim();
    const sortParam = (params['sort'] ?? '').trim() as CatalogSortOption;
    const minPriceParam = Number(params['minPrice']);
    const maxPriceParam = Number(params['maxPrice']);

    const brandSlugs = brandParam
      ? brandParam
          .split(',')
          .map((b) => b.trim())
          .filter(Boolean)
      : [];

    const brandNames = brandSlugs.map((slug) => this.brandSlugMap.get(slug) ?? this.matchBrandName(slug)).filter(Boolean) as string[];
    const skinTypes = skinParam
      ? skinParam
          .split(',')
          .map((s) => decodeURIComponent(s.trim()))
          .filter(Boolean)
      : [];

    this.filterState.categorySlug = categorySlug;
    this.filterState.subCategorySlug = subSlug;
    this.filterState.brandSlugs = brandSlugs;
    this.filterState.skinTypes = skinTypes;
    this.filterState.minPrice = Number.isFinite(minPriceParam) && minPriceParam > 0 ? minPriceParam : 0;
    this.filterState.maxPrice = Number.isFinite(maxPriceParam) && maxPriceParam > 0 ? maxPriceParam : this.maxLimit;
    this.filterState.sort = this.isValidSort(sortParam) ? sortParam : 'popular';

    this.selectedParentCategory = this.categories.find((c) => c.slug === this.filterState.categorySlug) ?? null;
    this.selectedSubCategory = this.filterState.subCategorySlug;
    this.selectedBrands = brandNames;
    this.selectedBrandFromHeader = brandNames.length === 1 ? brandNames[0] : null;
    this.selectedSkinTypes = this.filterState.skinTypes;
    this.minPriceInput = this.filterState.minPrice;
    this.maxPriceInput = this.filterState.maxPrice;
    this.activeSort = this.filterState.sort;
    this.updatePriceLabel();
    if (this.minPriceInput === 0 && this.maxPriceInput === this.maxLimit) this.selectedPrice = null;
  }

  private updateRouteState(next: CatalogQueryParams) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: next,
      queryParamsHandling: 'merge',
    });
  }

  private isValidSort(sort: string): sort is CatalogSortOption {
    return ['popular', 'hot_deal', 'price_desc', 'price_asc'].includes(sort);
  }

  private toBrandParam(names: string[]): string | null {
    if (!names.length) return null;
    const slugs = names
      .map((name) => this.brandItems.find((b) => b.name.toLowerCase() === name.toLowerCase())?.slug ?? this.slugify(name))
      .filter(Boolean);
    return slugs.length ? slugs.join(',') : null;
  }

  private matchBrandName(value: string): string {
    const byName = this.brandItems.find((b) => b.name.toLowerCase() === value.toLowerCase());
    return byName?.name ?? value;
  }

  private mapProducts(products: Product[], attributes: ProductAttributeRow[]): CatalogProductRow[] {
    const skinTypeMap = this.buildSkinTypeMap(attributes);
    return products
      .filter((p) => p.productStatus !== 'inactive' && p.isActive !== false)
      .map((p) => {
        const categoryRef = p.categoryId?._id ?? '';
        const categoryCtx = this.findCategoryContext(categoryRef);
        const brandName = p.brandId?.brandName ?? '';
        return {
          id: p._id,
          name: p.productName,
          slug: p.slug,
          brand: brandName,
          brandSlug: this.slugify(brandName),
          parentSlug: categoryCtx.parentSlug,
          subSlug: categoryCtx.subSlug,
          skinTypes: skinTypeMap.get(p._id) ?? [],
          price: p.price ?? 0,
          oldPrice: p.compareAtPrice ?? null,
          isSale: !!(p.compareAtPrice && p.compareAtPrice > (p.price ?? 0)),
          sold: p.bought ?? 0,
          imageUrl: this.resolveImage(p),
        };
      });
  }

  private findCategoryContext(categoryId: string): { parentSlug: string; subSlug?: string } {
    for (const top of this.categories) {
      if (top.id === categoryId) return { parentSlug: top.slug };
      const sub = top.subCategories.find((s) => s.id === categoryId);
      if (sub) return { parentSlug: top.slug, subSlug: sub.slug };
    }
    return { parentSlug: '' };
  }

  private buildSkinTypeMap(attributes: ProductAttributeRow[]): Map<string, string[]> {
    const map = new Map<string, string[]>();
    for (const row of attributes) {
      const name = (row.attributeName ?? '').toLowerCase();
      if (!name.includes('skin') && !name.includes('da')) continue;
      const productId = typeof row.productId === 'string' ? row.productId : row.productId?._id ?? '';
      const value = (row.attributeValue ?? '').trim();
      if (!productId || !value) continue;
      const list = map.get(productId) ?? [];
      if (!list.includes(value)) list.push(value);
      map.set(productId, list);
    }
    return map;
  }

  private extractSkinTypes(products: CatalogProductRow[]): string[] {
    return Array.from(new Set(products.flatMap((p) => p.skinTypes))).sort((a, b) => a.localeCompare(b));
  }

  private computeMaxPrice(products: CatalogProductRow[]): number {
    if (!products.length) return 5000000;
    const max = Math.max(...products.map((p) => p.price || 0));
    return Math.max(5000000, Math.ceil(max / 100000) * 100000);
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

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private resolveSuggestedSkinType(available: string[]): string | null {
    const raw = localStorage.getItem('kanila_skin_type');
    if (!raw) return null;
    const match = available.find((s) => s.toLowerCase() === raw.toLowerCase());
    return match ?? null;
  }
}
