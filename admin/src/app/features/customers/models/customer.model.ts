export type CustomerSegment = 'new' | 'active' | 'vip' | 'at_risk';
export type CustomerStatus = 'active' | 'inactive';

/** Mirrors backend `customer_profiles` (snake_case from API). */
export interface Customer {
  id: string;
  accountId: string;
  customer_code: string;
  full_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  avatar_url: string;
  customer_status: CustomerStatus;
  gender: string;
  date_of_birth: string | null;
  registered_at: string;
  created_at: string;
  updated_at: string;
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
