export interface ProductMediaItem {
  _id: string;
  productId: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  altText?: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface Product {
  _id: string;
  productName: string;
  productCode: string;
  slug?: string;
  price: number;
  /** Legacy single image; used when no productMedia */
  imageUrl?: string;
  /** Optional original/list price — must be greater than `price` to show discount */
  compareAtPrice?: number | null;
  shortDescription?: string;
  longDescription?: string;
  ingredientText?: string;
  usageInstruction?: string;
  averageRating: number;
  bought: number;
  stock: number;
  isActive?: boolean;
  productStatus?: 'active' | 'inactive';
  categoryId?: { _id: string; categoryName: string };
  brandId?: { _id: string; brandName: string };
  /** From API: GET /api/products — media from ProductMedia collection */
  productMedia?: ProductMediaItem[];
}
