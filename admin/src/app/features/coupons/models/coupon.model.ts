export type CouponStatus = 'active' | 'inactive' | 'scheduled' | 'expired';
export type DiscountType = 'percentage' | 'fixed' | 'free_shipping';

export interface Coupon {
  id: string;
  promotionId: string;
  couponCode: string;
  validFrom: string | null;
  validTo: string | null;
  usageLimitTotal: number;
  usageLimitPerCustomer: number;
  minOrderAmount: number;
  couponStatus: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  // Populated from Promotion
  discountType: DiscountType;
  discountValue: number;
  promotionName: string;
  promotionCode: string;
  // UI computed
  status: CouponStatus;
  usedCount: number;
}

export interface CreateCouponPayload {
  promotionId: string;
  couponCode: string;
  validFrom?: string;
  validTo?: string;
  usageLimitTotal?: number;
  usageLimitPerCustomer?: number;
  minOrderAmount?: number;
  couponStatus?: string;
}

export type UpdateCouponPayload = Partial<CreateCouponPayload>;
