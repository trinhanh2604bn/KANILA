export interface HeaderCategoryItem {
  id: string;
  name: string;
  code: string;
  slug: string;
  displayOrder: number;
  children: HeaderCategoryItem[];
}

export interface HeaderBrandItem {
  id: string;
  name: string;
  code: string;
  slug: string;
  logoUrl?: string;
}

export interface HeaderSearchProductItem {
  id: string;
  name: string;
  slug?: string;
  productCode?: string;
  imageUrl?: string;
  brandName?: string;
  price?: number;
}
