export type CatalogSortOption = 'popular' | 'hot_deal' | 'price_desc' | 'price_asc';

export interface CatalogSubcategoryItem {
  id: string;
  slug: string;
  name: string;
}

export interface CatalogCategoryItem {
  id: string;
  slug: string;
  name: string;
  subCategories: CatalogSubcategoryItem[];
}

export interface CatalogBrandFilterItem {
  id: string;
  name: string;
  slug: string;
}

export interface CatalogPriceRangeOption {
  min: number;
  max: number;
}

export interface CatalogFilterState {
  categorySlug: string | null;
  subCategorySlug: string | null;
  brandSlugs: string[];
  productTypes: string[];
  skinTypes: string[];
  shades: string[];
  finishes: string[];
  benefits: string[];
  promotions: string[];
  ratings: number[];
  stockStatuses: string[];
  sizes: string[];
  minPrice: number;
  maxPrice: number;
  sort: CatalogSortOption;
}

export interface CatalogQueryParams {
  category?: string | null;
  sub?: string | null;
  brand?: string | null;
  productType?: string | null;
  skin?: string | null;
  shade?: string | null;
  finish?: string | null;
  benefit?: string | null;
  promotion?: string | null;
  rating?: string | null;
  stock?: string | null;
  size?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  sort?: CatalogSortOption | null;
  /** 1-based page index for paginated GET /api/products */
  page?: number | null;
}
