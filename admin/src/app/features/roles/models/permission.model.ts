export interface PermissionAction {
  id: string;
  label: string; // 'Read', 'Create', 'Update', 'Delete', 'Moderate'
  selected: boolean;
}

export interface PermissionGroup {
  id: string; // 'accounts', 'products', 'orders', etc.
  title: string;
  description: string;
  actions: PermissionAction[];
  isAllSelected?: boolean;
  isIndeterminate?: boolean;
}
