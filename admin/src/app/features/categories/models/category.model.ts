export interface Category {
  id: string;
  categoryName: string;
  categoryCode: string;
  description: string;
  parentCategoryId: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  children?: Category[];
  level?: number;
  expanded?: boolean;
}

export interface CreateCategoryPayload {
  categoryName: string;
  categoryCode: string;
  description?: string;
  parentCategoryId?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}

export type UpdateCategoryPayload = Partial<CreateCategoryPayload>;
