export interface User {
  _id: string;
  email: string;
  name: string;
  account_type: 'admin' | 'staff' | 'customer';
  role: string; // mirrors account_type for UI
  last_login_at?: string;
  avatar?: string;
}
