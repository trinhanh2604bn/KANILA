export interface Brand {
  id: string;
  brandName: string;
  brandCode: string;
  description: string;
  logoUrl: string;
  isActive: boolean;
  productCount: number;
  createdAt: string;
}

export interface CreateBrandPayload {
  brandName: string;
  brandCode: string;
  description?: string;
  logoUrl?: string;
  isActive?: boolean;
}

export type UpdateBrandPayload = Partial<CreateBrandPayload>;
