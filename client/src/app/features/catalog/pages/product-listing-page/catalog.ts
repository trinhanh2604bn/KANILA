import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { HeaderCategoryItem } from '../../../../core/models/header.model';
import { Product } from '../../../../core/models/product.model';
import { BrandService } from '../../../../core/services/brand.service';
import { CategoryService } from '../../../../core/services/category.service';
import { ProductCardComponent } from '../../../home/pages/components/product-card/product-card';
import {
  CatalogFacetService,
  InventoryBalanceRow,
  ProductOptionRow,
  ProductOptionValueRow,
  ProductVariantRow,
  ReviewSummaryRow,
} from '../../../../core/services/catalog-facet.service';
import { ProductAttributeRow, ProductAttributeService } from '../../../../core/services/product-attribute.service';
import { ProductService } from '../../../../core/services/product.service';
import {
  CatalogBrandFilterItem,
  CatalogCategoryItem,
  CatalogFilterState,
  CatalogSortOption,
} from '../../models/catalog-filter.model';

interface CatalogProductRow {
  id: string;
  name: string;
  slug?: string;
  brand: string;
  brandSlug: string;
  parentSlug: string;
  subSlug?: string;
  skinTypes: string[];
  productType: string;
  shades: string[];
  finishes: string[];
  benefits: string[];
  hasPromotion: boolean;
  rating: number;
  inStock: boolean;
  stockQty: number;
  sizes: string[];
  price: number;
  oldPrice: number | null;
  isSale: boolean;
  sold: number;
  imageUrl?: string;
}

@Component({
  selector: 'app-catalog',
  imports: [FormsModule, RouterModule, CommonModule, ProductCardComponent],
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
  productTypes: string[] = [];
  skinTypes: string[] = [];
  shadeOptions: string[] = [];
  finishOptions: string[] = [];
  benefitOptions: string[] = [];
  promotionOptions: string[] = ['Đang giảm giá'];
  ratingOptions: number[] = [5, 4, 3];
  stockOptions: string[] = ['Còn hàng', 'Hết hàng'];
  sizeOptions: string[] = [];
  private brandItems: CatalogBrandFilterItem[] = [];
  private brandSlugMap = new Map<string, string>();

  allProducts: CatalogProductRow[] = [];
  filteredProducts: CatalogProductRow[] = [];

  selectedParentCategory: CatalogCategoryItem | null = null;
  selectedSubCategory: string | null = null;
  selectedBrands: string[] = [];
  selectedSkinTypes: string[] = [];
  selectedProductTypes: string[] = [];
  selectedShades: string[] = [];
  selectedFinishes: string[] = [];
  selectedBenefits: string[] = [];
  selectedPromotions: string[] = [];
  selectedRatings: number[] = [];
  selectedStockStatuses: string[] = [];
  selectedSizes: string[] = [];
  selectedPrice: { label: string, min: number, max: number } | null = null;
  
  activeSort: string = 'default'; 
  openDropdown: string | null = null;
  selectedBrandFromHeader: string | null = null;

  minPriceInput: number = 0;
  maxPriceInput: number = 5000000;
  maxLimit: number = 5000000;
  suggestedSkinType: string | null = null;

  brandSearchText: string = ''; 

  private readonly filterState: CatalogFilterState = {
    categorySlug: null,
    subCategorySlug: null,
    brandSlugs: [],
    productTypes: [],
    skinTypes: [],
    shades: [],
    finishes: [],
    benefits: [],
    promotions: [],
    ratings: [],
    stockStatuses: [],
    sizes: [],
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
    private readonly productAttributeService: ProductAttributeService,
    private readonly facetService: CatalogFacetService
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
      attributes: this.productAttributeService.getAll().pipe(catchError(() => of([]))),
      options: this.facetService.getProductOptions().pipe(catchError(() => of([]))),
      optionValues: this.facetService.getProductOptionValues().pipe(catchError(() => of([]))),
      variants: this.facetService.getProductVariants().pipe(catchError(() => of([]))),
      reviewSummaries: this.facetService.getReviewSummaries().pipe(catchError(() => of([]))),
      inventoryBalances: this.facetService.getInventoryBalances().pipe(catchError(() => of([]))),
      activePromotions: this.facetService.getActivePromotions().pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ categoryTree, brandItems, products, attributes, options, optionValues, variants, reviewSummaries, inventoryBalances, activePromotions }) => {
        this.categories = categoryTree.map((c) => ({
          id: c.id,
          slug: c.slug,
          name: c.name,
          subCategories: c.children.map((s) => ({ id: s.id, slug: s.slug, name: s.name })),
        }));

        this.brandItems = brandItems.map((b) => ({ id: b.id, name: b.name, slug: b.slug }));
        this.brands = this.brandItems.map((b) => b.name);
        this.brandSlugMap = new Map(this.brandItems.map((b) => [b.slug, b.name]));

        this.allProducts = this.mapProducts(
          products,
          attributes,
          options,
          optionValues,
          variants,
          reviewSummaries,
          inventoryBalances,
          activePromotions.length > 0
        );
        this.productTypes = this.extractProductTypes(this.allProducts);
        this.skinTypes = this.extractSkinTypes(this.allProducts);
        this.shadeOptions = this.extractUnique(this.allProducts.flatMap((p) => p.shades));
        this.finishOptions = this.extractUnique(this.allProducts.flatMap((p) => p.finishes));
        this.benefitOptions = this.extractUnique(this.allProducts.flatMap((p) => p.benefits));
        this.sizeOptions = this.extractUnique(this.allProducts.flatMap((p) => p.sizes));
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
    this.isScrolled = window.scrollY > 200;
  }

  get filteredBrandOptions(): string[] {
    if (!this.brandSearchText) return this.brands;
    const lowerSearch = this.brandSearchText.toLowerCase();
    return this.brands.filter(b => b.toLowerCase().includes(lowerSearch));
  }

  getShadeColor(shadeName: string): string {
    const lower = shadeName.toLowerCase();
    if (lower.includes('đỏ') || lower.includes('red') || lower.includes('ruby')) return '#C41E3A';
    if (lower.includes('hồng') || lower.includes('pink') || lower.includes('rose')) return '#FFB6C1';
    if (lower.includes('cam') || lower.includes('orange') || lower.includes('coral')) return '#FF7F50';
    if (lower.includes('nâu') || lower.includes('brown') || lower.includes('coffee')) return '#8B4513';
    if (lower.includes('nude') || lower.includes('beige')) return '#E6C2BA';
    if (lower.includes('trắng') || lower.includes('light') || lower.includes('fair') || lower.includes('ivory')) return '#FFF5EE';
    if (lower.includes('tự nhiên') || lower.includes('medium') || lower.includes('natural')) return '#DEB887';
    if (lower.includes('ngăm') || lower.includes('dark') || lower.includes('tan')) return '#A0522D';
    if (lower.includes('đen') || lower.includes('black')) return '#1a1a1a';
    return '#E9ECEF'; 
  }

  getSortLabel(sortValue: string): string {
    switch(sortValue) {
      case 'popular': return 'Bán chạy';
      case 'hot_deal': return 'Deal HOT';
      case 'price_desc': return 'Giá Cao - Thấp';
      case 'price_asc': return 'Giá Thấp - Cao';
      default: return 'Mặc định';
    }
  }

  toProductCardProduct(row: CatalogProductRow): Product {
    return {
      _id: row.id,
      productName: row.name,
      productCode: row.id,
      slug: row.slug,
      price: row.price,
      imageUrl: row.imageUrl,
      compareAtPrice: row.oldPrice,
      averageRating: row.rating,
      bought: row.sold,
      stock: row.stockQty,
      brandId: row.brand ? { _id: row.brandSlug || row.id, brandName: row.brand } : undefined,
      productMedia: row.imageUrl
        ? [
            {
              _id: row.id,
              productId: row.id,
              mediaType: 'image',
              mediaUrl: row.imageUrl,
              sortOrder: 0,
              isPrimary: true,
            },
          ]
        : [],
    };
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

  selectSubCategory(subSlug: string | null) {
    const newSub = this.selectedSubCategory === subSlug ? null : subSlug;
    this.updateRouteState({ sub: newSub });
  }

  resetToAllProducts() {
    this.updateRouteState({
      category: null, sub: null, brand: null, filterBrands: null, productType: null, skin: null,
      shade: null, finish: null, benefit: null, promotion: null, rating: null,
      stock: null, size: null, minPrice: null, maxPrice: null, sort: null,
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

    // --- LOGIC MỚI: Gộp cả Brand từ Header và Brand từ Dropdown để lọc ---
    let activeBrandsToFilter = [...this.selectedBrands];
    if (this.selectedBrandFromHeader && !activeBrandsToFilter.includes(this.selectedBrandFromHeader)) {
        activeBrandsToFilter.push(this.selectedBrandFromHeader);
    }

    if (activeBrandsToFilter.length > 0) {
      const lowerSelectedBrands = activeBrandsToFilter.map((b) => b.toLowerCase());
      temp = temp.filter((p) => lowerSelectedBrands.includes(p.brand.toLowerCase()));
    }

    if (this.selectedSkinTypes.length > 0) {
      temp = temp.filter((p) => p.skinTypes.some((s) => this.selectedSkinTypes.includes(s)));
    }
    if (this.selectedProductTypes.length > 0) {
      temp = temp.filter((p) => this.selectedProductTypes.includes(p.productType));
    }
    if (this.selectedShades.length > 0) {
      temp = temp.filter((p) => p.shades.some((s) => this.selectedShades.includes(s)));
    }
    if (this.selectedFinishes.length > 0) {
      temp = temp.filter((p) => p.finishes.some((s) => this.selectedFinishes.includes(s)));
    }
    if (this.selectedBenefits.length > 0) {
      temp = temp.filter((p) => p.benefits.some((s) => this.selectedBenefits.includes(s)));
    }
    if (this.selectedPromotions.length > 0) {
      temp = temp.filter((p) => p.hasPromotion);
    }
    if (this.selectedRatings.length > 0) {
      const minRating = Math.min(...this.selectedRatings);
      temp = temp.filter((p) => p.rating >= minRating);
    }
    if (this.selectedStockStatuses.length > 0) {
      temp = temp.filter((p) => (this.selectedStockStatuses.includes('Còn hàng') && p.inStock) || (this.selectedStockStatuses.includes('Hết hàng') && !p.inStock));
    }
    if (this.selectedSizes.length > 0) {
      temp = temp.filter((p) => p.sizes.some((s) => this.selectedSizes.includes(s)));
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
    if (dropdownName === 'brand') this.brandSearchText = ''; 
    this.openDropdown = this.openDropdown === dropdownName ? null : dropdownName;
  }

  toggleBrand(brand: string) {
    const index = this.selectedBrands.indexOf(brand);
    const next = [...this.selectedBrands];
    if (index > -1) next.splice(index, 1);
    else next.push(brand);
    // --- SỬA Ở ĐÂY: Lưu vào tham số filterBrands thay vì brand ---
    this.updateRouteState({ filterBrands: this.toBrandParam(next) });
  }

  toggleSkinType(type: string) {
    const index = this.selectedSkinTypes.indexOf(type);
    const next = [...this.selectedSkinTypes];
    if (index > -1) next.splice(index, 1);
    else next.push(type);
    this.updateRouteState({ skin: next.length ? next.join(',') : null });
  }
  toggleProductType(type: string) {
    const next = this.toggleStringSelection(this.selectedProductTypes, type);
    this.updateRouteState({ productType: next.length ? next.join(',') : null });
  }
  toggleShade(value: string) {
    const next = this.toggleStringSelection(this.selectedShades, value);
    this.updateRouteState({ shade: next.length ? next.join(',') : null });
  }
  toggleFinish(value: string) {
    const next = this.toggleStringSelection(this.selectedFinishes, value);
    this.updateRouteState({ finish: next.length ? next.join(',') : null });
  }
  toggleBenefit(value: string) {
    const next = this.toggleStringSelection(this.selectedBenefits, value);
    this.updateRouteState({ benefit: next.length ? next.join(',') : null });
  }
  togglePromotion(value: string) {
    const next = this.toggleStringSelection(this.selectedPromotions, value);
    this.updateRouteState({ promotion: next.length ? next.join(',') : null });
  }
  toggleRating(value: number) {
    const exists = this.selectedRatings.includes(value);
    const next = exists ? this.selectedRatings.filter((r) => r !== value) : [...this.selectedRatings, value];
    this.updateRouteState({ rating: next.length ? next.join(',') : null });
  }
  toggleStock(value: string) {
    const next = this.toggleStringSelection(this.selectedStockStatuses, value);
    this.updateRouteState({ stock: next.length ? next.join(',') : null });
  }
  toggleSize(value: string) {
    const next = this.toggleStringSelection(this.selectedSizes, value);
    this.updateRouteState({ size: next.length ? next.join(',') : null });
  }
  
  selectSort(sortType: string) {
    this.updateRouteState({ sort: sortType as CatalogSortOption });
    this.openDropdown = null; 
  }

  removeFilter(type: string, value: string | null) {
    if (type === 'brand' && value) {
      // --- SỬA Ở ĐÂY: Xóa từ tham số filterBrands ---
      this.updateRouteState({ filterBrands: this.toBrandParam(this.selectedBrands.filter((b) => b !== value)) });
    } else if (type === 'skin' && value) {
      this.updateRouteState({ skin: this.selectedSkinTypes.filter((s) => s !== value).join(',') || null });
    } else if (type === 'price') {
      this.updateRouteState({ minPrice: null, maxPrice: null });
    } else if (type === 'productType' && value) {
      this.updateRouteState({ productType: this.selectedProductTypes.filter((x) => x !== value).join(',') || null });
    } else if (type === 'shade' && value) {
      this.updateRouteState({ shade: this.selectedShades.filter((x) => x !== value).join(',') || null });
    } else if (type === 'finish' && value) {
      this.updateRouteState({ finish: this.selectedFinishes.filter((x) => x !== value).join(',') || null });
    } else if (type === 'benefit' && value) {
      this.updateRouteState({ benefit: this.selectedBenefits.filter((x) => x !== value).join(',') || null });
    } else if (type === 'promotion' && value) {
      this.updateRouteState({ promotion: this.selectedPromotions.filter((x) => x !== value).join(',') || null });
    } else if (type === 'rating' && value) {
      const rating = Number(value);
      this.updateRouteState({ rating: this.selectedRatings.filter((x) => x !== rating).join(',') || null });
    } else if (type === 'stock' && value) {
      this.updateRouteState({ stock: this.selectedStockStatuses.filter((x) => x !== value).join(',') || null });
    } else if (type === 'size' && value) {
      this.updateRouteState({ size: this.selectedSizes.filter((x) => x !== value).join(',') || null });
    }
  }

  clearAllFilters() {
    this.updateRouteState({
      skin: null, minPrice: null, maxPrice: null, brand: null, filterBrands: null, productType: null,
      shade: null, finish: null, benefit: null, promotion: null, rating: null,
      stock: null, size: null,
    });
  }

  hasActiveFilters(): boolean {
    return (
      this.selectedBrands.length > 0 ||
      this.selectedSkinTypes.length > 0 ||
      this.selectedPrice !== null ||
      this.selectedProductTypes.length > 0 ||
      this.selectedShades.length > 0 ||
      this.selectedFinishes.length > 0 ||
      this.selectedBenefits.length > 0 ||
      this.selectedPromotions.length > 0 ||
      this.selectedRatings.length > 0 ||
      this.selectedStockStatuses.length > 0 ||
      this.selectedSizes.length > 0 ||
      !!this.selectedBrandFromHeader
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
    
    // --- LOGIC MỚI LẤY TỪ URL ĐỂ PHÂN BIỆT RÕ RÀNG ---
    const headerBrandParam = (params['brand'] ?? '').trim();
    const filterBrandsParam = (params['filterBrands'] ?? '').trim();

    const productTypeParam = (params['productType'] ?? '').trim();
    const skinParam = (params['skin'] ?? '').trim();
    const shadeParam = (params['shade'] ?? '').trim();
    const finishParam = (params['finish'] ?? '').trim();
    const benefitParam = (params['benefit'] ?? '').trim();
    const promotionParam = (params['promotion'] ?? '').trim();
    const ratingParam = (params['rating'] ?? '').trim();
    const stockParam = (params['stock'] ?? '').trim();
    const sizeParam = (params['size'] ?? '').trim();
    const sortParam = (params['sort'] ?? '').trim();
    const minPriceParam = Number(params['minPrice']);
    const maxPriceParam = Number(params['maxPrice']);

    // Tách chuỗi URL thành mảng
    const headerBrandSlugs = headerBrandParam ? headerBrandParam.split(',').map((b) => b.trim()).filter(Boolean) : [];
    const filterBrandSlugs = filterBrandsParam ? filterBrandsParam.split(',').map((b) => b.trim()).filter(Boolean) : [];

    const headerBrandNames = headerBrandSlugs.map((slug) => this.brandSlugMap.get(slug) ?? this.matchBrandName(slug)).filter(Boolean) as string[];
    const filterBrandNames = filterBrandSlugs.map((slug) => this.brandSlugMap.get(slug) ?? this.matchBrandName(slug)).filter(Boolean) as string[];

    const skinTypes = skinParam ? skinParam.split(',').map((s) => decodeURIComponent(s.trim())).filter(Boolean) : [];
    const productTypes = this.splitParam(productTypeParam);
    const shades = this.splitParam(shadeParam);
    const finishes = this.splitParam(finishParam);
    const benefits = this.splitParam(benefitParam);
    const promotions = this.splitParam(promotionParam);
    const ratings = this.splitParam(ratingParam).map((v) => Number(v)).filter((v) => Number.isFinite(v));
    const stockStatuses = this.splitParam(stockParam);
    const sizes = this.splitParam(sizeParam);

    this.filterState.categorySlug = categorySlug;
    this.filterState.subCategorySlug = subSlug;
    this.filterState.productTypes = productTypes;
    this.filterState.skinTypes = skinTypes;
    this.filterState.shades = shades;
    this.filterState.finishes = finishes;
    this.filterState.benefits = benefits;
    this.filterState.promotions = promotions;
    this.filterState.ratings = ratings;
    this.filterState.stockStatuses = stockStatuses;
    this.filterState.sizes = sizes;
    this.filterState.minPrice = Number.isFinite(minPriceParam) && minPriceParam > 0 ? minPriceParam : 0;
    this.filterState.maxPrice = Number.isFinite(maxPriceParam) && maxPriceParam > 0 ? maxPriceParam : this.maxLimit;
    this.filterState.sort = this.isValidSort(sortParam) ? (sortParam as CatalogSortOption) : ('default' as CatalogSortOption);

    this.selectedParentCategory = this.categories.find((c) => c.slug === this.filterState.categorySlug) ?? null;
    this.selectedSubCategory = this.filterState.subCategorySlug;
    
    // Gán vào 2 biến tách biệt (Header chỉ lấy 1 hãng, Filter lấy nhiều hãng)
    this.selectedBrandFromHeader = headerBrandNames.length > 0 ? headerBrandNames[0] : null;
    this.selectedBrands = filterBrandNames;
    
    this.selectedProductTypes = this.filterState.productTypes;
    this.selectedSkinTypes = this.filterState.skinTypes;
    this.selectedShades = this.filterState.shades;
    this.selectedFinishes = this.filterState.finishes;
    this.selectedBenefits = this.filterState.benefits;
    this.selectedPromotions = this.filterState.promotions;
    this.selectedRatings = this.filterState.ratings;
    this.selectedStockStatuses = this.filterState.stockStatuses;
    this.selectedSizes = this.filterState.sizes;
    this.minPriceInput = this.filterState.minPrice;
    this.maxPriceInput = this.filterState.maxPrice;
    this.activeSort = this.filterState.sort || 'default';
    this.updatePriceLabel();
    if (this.minPriceInput === 0 && this.maxPriceInput === this.maxLimit) this.selectedPrice = null;
  }

  // Dùng Record<string, any> để TypeScript không báo lỗi khi truyền tham số mới
  private updateRouteState(next: Record<string, any>) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: next,
      queryParamsHandling: 'merge',
    });
  }

  private isValidSort(sort: string): boolean {
    return ['default', 'popular', 'hot_deal', 'price_desc', 'price_asc'].includes(sort);
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

  private mapProducts(
    products: Product[],
    attributes: ProductAttributeRow[],
    options: ProductOptionRow[],
    optionValues: ProductOptionValueRow[],
    variants: ProductVariantRow[],
    reviewSummaries: ReviewSummaryRow[],
    inventoryBalances: InventoryBalanceRow[],
    hasActiveSystemPromotion: boolean
  ): CatalogProductRow[] {
    const skinTypeMap = this.buildSkinTypeMap(attributes);
    const finishBenefitMap = this.buildFinishBenefitMap(attributes);
    const optionMap = this.buildOptionValueMap(options, optionValues);
    const variantFacetMap = this.buildVariantFacetMap(variants, inventoryBalances);
    const ratingMap = new Map<string, number>(
      reviewSummaries.map((r) => [this.refId(r.productId), r.averageRating ?? 0])
    );
    return products
      .filter((p) => p.productStatus !== 'inactive' && p.isActive !== false)
      .map((p) => {
        const categoryRef = p.categoryId?._id ?? '';
        const categoryCtx = this.findCategoryContext(categoryRef);
        const optionFacet = optionMap.get(p._id) ?? { shades: [] };
        const variantFacet = variantFacetMap.get(p._id) ?? { inStock: (p.stock ?? 0) > 0, sizes: [] };
        const finishBenefit = finishBenefitMap.get(p._id) ?? { finishes: [], benefits: [] };
        const isDiscount = !!(p.compareAtPrice && p.compareAtPrice > (p.price ?? 0));
        const brandName = p.brandId?.brandName ?? '';
        return {
          id: p._id,
          name: p.productName,
          slug: p.slug,
          brand: brandName,
          brandSlug: this.slugify(brandName),
          parentSlug: categoryCtx.parentSlug,
          subSlug: categoryCtx.subSlug,
          productType: categoryCtx.parentName,
          skinTypes: skinTypeMap.get(p._id) ?? [],
          shades: optionFacet.shades,
          finishes: finishBenefit.finishes,
          benefits: finishBenefit.benefits,
          hasPromotion: isDiscount || hasActiveSystemPromotion,
          rating: ratingMap.get(p._id) ?? p.averageRating ?? 0,
          inStock: variantFacet.inStock,
          stockQty: p.stock ?? 0,
          sizes: variantFacet.sizes,
          price: p.price ?? 0,
          oldPrice: p.compareAtPrice ?? null,
          isSale: isDiscount,
          sold: p.bought ?? 0,
          imageUrl: this.resolveImage(p),
        };
      });
  }

  private findCategoryContext(categoryId: string): { parentSlug: string; parentName: string; subSlug?: string } {
    for (const top of this.categories) {
      if (top.id === categoryId) return { parentSlug: top.slug, parentName: top.name };
      const sub = top.subCategories.find((s) => s.id === categoryId);
      if (sub) return { parentSlug: top.slug, parentName: top.name, subSlug: sub.slug };
    }
    return { parentSlug: '', parentName: '' };
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

  private extractProductTypes(products: CatalogProductRow[]): string[] {
    return this.extractUnique(products.map((p) => p.productType).filter(Boolean));
  }

  private extractUnique(values: string[]): string[] {
    return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
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

  private splitParam(raw: string): string[] {
    return raw ? raw.split(',').map((x) => decodeURIComponent(x.trim())).filter(Boolean) : [];
  }

  private toggleStringSelection(source: string[], value: string): string[] {
    const exists = source.includes(value);
    return exists ? source.filter((x) => x !== value) : [...source, value];
  }

  private buildOptionValueMap(options: ProductOptionRow[], values: ProductOptionValueRow[]): Map<string, { shades: string[] }> {
    const optionById = new Map<string, ProductOptionRow>();
    for (const o of options) optionById.set(o._id, o);
    const map = new Map<string, { shades: string[] }>();
    for (const v of values) {
      const optionId = this.refId(v.productOptionId);
      const option = optionById.get(optionId);
      if (!option) continue;
      const productId = this.refId(option.productId);
      if (!productId) continue;
      const optionName = (option.optionName ?? '').toLowerCase();
      const val = (v.optionValue ?? '').trim();
      if (!val) continue;
      const current = map.get(productId) ?? { shades: [] };
      if (/(shade|color|mau|màu)/i.test(optionName) && !current.shades.includes(val)) current.shades.push(val);
      map.set(productId, current);
    }
    return map;
  }

  private buildFinishBenefitMap(attributes: ProductAttributeRow[]): Map<string, { finishes: string[]; benefits: string[] }> {
    const map = new Map<string, { finishes: string[]; benefits: string[] }>();
    const finishRegex = /(finish|matte|glossy|shimmer|dewy|satin|velvet)/i;
    const benefitRegex = /(benefit|waterproof|long|lasting|moisturiz|duong|dưỡng|ben mau|bền màu)/i;
    for (const a of attributes) {
      const productId = this.refId(a.productId);
      if (!productId) continue;
      const name = (a.attributeName ?? '').trim();
      const value = (a.attributeValue ?? '').trim();
      const current = map.get(productId) ?? { finishes: [], benefits: [] };
      if (finishRegex.test(name) || finishRegex.test(value)) {
        const normalized = value || name;
        if (normalized && !current.finishes.includes(normalized)) current.finishes.push(normalized);
      }
      if (benefitRegex.test(name) || benefitRegex.test(value)) {
        const normalized = value || name;
        if (normalized && !current.benefits.includes(normalized)) current.benefits.push(normalized);
      }
      map.set(productId, current);
    }
    return map;
  }

  private buildVariantFacetMap(
    variants: ProductVariantRow[],
    inventoryBalances: InventoryBalanceRow[]
  ): Map<string, { inStock: boolean; sizes: string[] }> {
    const byVariantId = new Map<string, ProductVariantRow>();
    for (const v of variants) byVariantId.set(v._id, v);
    const map = new Map<string, { inStock: boolean; sizes: string[] }>();
    for (const v of variants) {
      const productId = this.refId(v.productId);
      if (!productId) continue;
      const current = map.get(productId) ?? { inStock: false, sizes: [] };
      const size = this.formatVariantSize(v);
      if (size && !current.sizes.includes(size)) current.sizes.push(size);
      map.set(productId, current);
    }
    for (const b of inventoryBalances) {
      const variantId = this.refId(b.variantId);
      const variant = byVariantId.get(variantId);
      if (!variant) continue;
      const productId = this.refId(variant.productId);
      if (!productId) continue;
      const current = map.get(productId) ?? { inStock: false, sizes: [] };
      if ((b.availableQty ?? 0) > 0) current.inStock = true;
      map.set(productId, current);
    }
    return map;
  }

  private formatVariantSize(v: ProductVariantRow): string {
    if ((v.volumeMl ?? 0) > 0) return `${v.volumeMl}ml`;
    if ((v.weightGrams ?? 0) > 0) return `${v.weightGrams}g`;
    return '';
  }

  private refId(value: string | { _id?: string; productId?: string | { _id?: string } } | undefined): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      if (value._id) return String(value._id);
      const pid = (value as { productId?: string | { _id?: string } }).productId;
      if (typeof pid === 'string') return pid;
      if (pid && typeof pid === 'object' && pid._id) return String(pid._id);
    }
    return '';
  }
}