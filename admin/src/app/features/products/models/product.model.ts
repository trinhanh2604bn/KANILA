import type { ProductOption, ProductVariant } from './variant.model';

export interface Product {
  id: string;
  productName: string;
  productCode: string;
  slug: string;
  brandId: string;
  brandName: string;
  categoryId: string;
  categoryName: string;
  price: number;
  imageUrl: string;
  images: string[];
  shortDescription: string;
  longDescription: string;
  ingredientText: string;
  usageInstruction: string;
  stock: number;
  bought: number;
  averageRating: number;
  isActive: boolean;
  productStatus: 'active' | 'inactive';
  status: 'published' | 'draft';
  createdAt: string;
  updatedAt: string;
  createdByEmail?: string;
  updatedByEmail?: string;
  /** Optional embedded data from older mocks; real variants load via product-variants API. */
  options?: ProductOption[];
  variants?: ProductVariant[];
}

export interface CreateProductPayload {
  productName: string;
  productCode: string;
  brandId: string;
  categoryId: string;
  price: number;
  slug?: string;
  imageUrl?: string;
  images?: string[];
  shortDescription?: string;
  longDescription?: string;
  ingredientText?: string;
  usageInstruction?: string;
  stock?: number;
  isActive?: boolean;
  status?: 'published' | 'draft';
}

export type UpdateProductPayload = Partial<CreateProductPayload>;
