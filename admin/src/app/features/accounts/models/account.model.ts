export interface Account {
  id: string;
  email: string;
  username: string;
  phone: string;
  accountType: 'customer' | 'admin' | 'staff';
  accountStatus: 'active' | 'inactive' | 'locked';
  roleId?: string;
  roleName?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountPayload {
  email: string;
  username: string;
  phone?: string;
  password: string;
  accountType: 'admin' | 'staff';
  roleId?: string;
  accountStatus: 'active' | 'inactive';
}

export interface UpdateAccountPayload {
  username?: string;
  phone?: string;
  accountType?: 'admin' | 'staff';
  roleId?: string;
  accountStatus?: 'active' | 'inactive' | 'locked';
}
