export type PromotionStatus = 'draft' | 'active' | 'inactive' | 'scheduled' | 'expired';
export type DiscountType = 'percentage' | 'fixed' | 'free_shipping';
export type PromotionType = DiscountType; // backward-compat alias
export type ApplicableScope = 'all' | 'categories' | 'products';

export interface Promotion {
  id: string;
  promotionCode: string;
  promotionName: string;
  description: string;
  promotionType: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount: number;
  startAt: string;
  endAt: string | null;
  usageLimitTotal: number;
  usageLimitPerCustomer: number;
  isAutoApply: boolean;
  priority: number;
  stackableFlag: boolean;
  promotionStatus: PromotionStatus;
  createdByAccountId: string | null;
  createdAt: string;
  updatedAt: string;
  // UI computed
  status: PromotionStatus;
  type: DiscountType;
  usageCount: number;
  // Backward-compatible aliases for existing templates
  name: string;
  startDate: string;
  endDate: string | null;
  usageLimit: number;
  applicableScope: ApplicableScope;
  minOrderValue: number;
  perCustomerLimit: number;
}

export interface CreatePromotionPayload {
  promotionName: string;
  promotionCode?: string;
  description?: string;
  promotionType?: string;
  discountType: string;
  discountValue: number;
  maxDiscountAmount?: number;
  startAt: string;
  endAt?: string;
  usageLimitTotal?: number;
  usageLimitPerCustomer?: number;
  isAutoApply?: boolean;
  promotionStatus?: string;
}

export type UpdatePromotionPayload = Partial<CreatePromotionPayload>;
