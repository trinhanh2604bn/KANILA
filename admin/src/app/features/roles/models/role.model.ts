export interface Permission {
  key: string;
  label: string;
}

export interface PermissionGroup {
  module: string;
  permissions: Permission[];
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  accountCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRolePayload {
  name: string;
  description: string;
  permissions: string[];
}

export interface UpdateRolePayload {
  name?: string;
  description?: string;
  permissions?: string[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    module: 'Accounts',
    permissions: [
      { key: 'accounts.view', label: 'View accounts' },
      { key: 'accounts.create', label: 'Create accounts' },
      { key: 'accounts.edit', label: 'Edit accounts' },
      { key: 'accounts.delete', label: 'Delete accounts' },
    ],
  },
  {
    module: 'Products',
    permissions: [
      { key: 'products.view', label: 'View products' },
      { key: 'products.create', label: 'Create products' },
      { key: 'products.edit', label: 'Edit products' },
      { key: 'products.delete', label: 'Delete products' },
    ],
  },
  {
    module: 'Orders',
    permissions: [
      { key: 'orders.view', label: 'View orders' },
      { key: 'orders.create', label: 'Create orders' },
      { key: 'orders.edit', label: 'Edit orders' },
      { key: 'orders.cancel', label: 'Cancel orders' },
    ],
  },
  {
    module: 'Inventory',
    permissions: [
      { key: 'inventory.view', label: 'View inventory' },
      { key: 'inventory.manage', label: 'Manage stock' },
    ],
  },
  {
    module: 'Marketing',
    permissions: [
      { key: 'promotions.view', label: 'View promotions' },
      { key: 'promotions.manage', label: 'Manage promotions' },
      { key: 'coupons.view', label: 'View coupons' },
      { key: 'coupons.manage', label: 'Manage coupons' },
    ],
  },
  {
    module: 'System',
    permissions: [
      { key: 'settings.view', label: 'View settings' },
      { key: 'settings.manage', label: 'Manage settings' },
      { key: 'roles.manage', label: 'Manage roles' },
    ],
  },
];
