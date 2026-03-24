export interface ProductDetailImage {
  url: string;
  alt: string;
  type: 'product' | 'texture' | 'swatch' | 'model';
  sortOrder: number;
  isPrimary?: boolean;
}

export interface ProductDetailVariant {
  id: string;
  sku: string;
  name: string;
  shadeCode: string;
  shadeName: string;
  undertone: string;
  swatchColor: string;
  inStock: boolean;
  stockQty: number;
}

export interface ProductDetailReview {
  id: string;
  userName: string;
  avatar: string;
  verified: boolean;
  shade: string;
  rating: number;
  title: string;
  body: string;
  images: string[];
  date: string;
  helpful: number;
}

export interface ProductDetailRecommendation {
  id: string;
  slug?: string;
  name: string;
  brand: string;
  attribute: string;
  rating: number;
  price: number;
  oldPrice?: number;
  image: string;
  badge?: string;
}

export interface ProductDetailContentSections {
  overview: string[];
  ingredients: string[];
  howToUse: string[];
  whyLoveIt: string[];
  suitableFor: string[];
  storage: string[];
}

export interface ProductDetailHighlights {
  finish: string;
  coverage: string;
  texture: string;
  skinType: string;
  wearTime: string;
  bestFor: string;
}

export interface ProductDetailData {
  id: string;
  slug?: string;
  productName: string;
  subtitle: string;
  brandName: string;
  categoryName: string;
  parentCategoryName?: string;
  price: number;
  oldPrice?: number;
  discountPercent: number;
  averageRating: number;
  reviewCount: number;
  soldCount: number;
  wishlistCount: number;
  inStock: boolean;
  stockText: string;
  shippingText: string;
  badges: string[];
  images: ProductDetailImage[];
  variants: ProductDetailVariant[];
  highlights: ProductDetailHighlights;
  content: ProductDetailContentSections;
  reviews: ProductDetailReview[];
  ratingDistribution: { [k: number]: number };
  recommendations: {
    frequentlyBoughtTogether: ProductDetailRecommendation[];
    similarProducts: ProductDetailRecommendation[];
    sameBrandProducts: ProductDetailRecommendation[];
    recentlyViewed: ProductDetailRecommendation[];
  };
  trustItems: string[];
}
