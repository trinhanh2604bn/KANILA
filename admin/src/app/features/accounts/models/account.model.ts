/** Mirrors backend `accounts` collection (snake_case fields from API). */
export interface Account {
  id: string;
  email: string;
  username: string;
  phone: string;
  account_type: 'customer' | 'admin' | 'staff';
  account_status: 'active' | 'inactive' | 'locked';
  roleId?: string;
  roleName?: string;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAccountPayload {
  email: string;
  username: string;
  phone?: string;
  password: string;
  account_type: 'admin' | 'staff';
  roleId?: string;
  account_status: 'active' | 'inactive';
}

export interface UpdateAccountPayload {
  username?: string;
  phone?: string;
  account_type?: 'admin' | 'staff';
  roleId?: string;
  account_status?: 'active' | 'inactive' | 'locked';
}
