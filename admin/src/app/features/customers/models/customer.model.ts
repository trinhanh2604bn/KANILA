export type CustomerSegment = 'new' | 'active' | 'vip' | 'at_risk';
export type CustomerStatus = 'active' | 'inactive';

export interface Customer {
  id: string;
  accountId: string;
  customerCode: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatarUrl: string;
  customerStatus: CustomerStatus;
  gender: string;
  dateOfBirth: string | null;
  registeredAt: string;
  createdAt: string;
  updatedAt: string;
  // UI-computed fields
  name: string;
  status: CustomerStatus;
  segment: 'new' | 'active' | 'vip' | 'at_risk';
  behaviorLabel: string;
  totalSpent: number;
  avgOrderValue: number;
  ordersCount: number;
  lastOrderDate: string;
  orders: any[];
  activities: any[];
}
