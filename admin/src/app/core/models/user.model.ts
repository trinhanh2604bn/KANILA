export interface User {
  _id: string;
  email: string;
  name: string;
  accountType: 'admin' | 'staff' | 'customer';
  role: string; // kept for backward compat with existing components
  lastLoginAt?: string;
  avatar?: string;
}
