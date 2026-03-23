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
  skinTypes: string[];
  minPrice: number;
  maxPrice: number;
  sort: CatalogSortOption;
}

export interface CatalogQueryParams {
  category?: string | null;
  sub?: string | null;
  brand?: string | null;
  skin?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  sort?: CatalogSortOption | null;
}
