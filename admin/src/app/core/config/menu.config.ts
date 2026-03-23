export interface MenuItem {
  label: string;
  icon: string;
  route: string;
}

export interface MenuGroup {
  group: string;
  items: MenuItem[];
}

export const MENU_CONFIG: MenuGroup[] = [
  {
    group: '',
    items: [
      { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    ],
  },
  {
    group: 'Management',
    items: [
      { label: 'Accounts', icon: 'people', route: '/accounts' },
      { label: 'Customers', icon: 'person', route: '/customers' },
    ],
  },
  {
    group: 'Catalog',
    items: [
      { label: 'Products', icon: 'inventory_2', route: '/products' },
      { label: 'Categories', icon: 'category', route: '/categories' },
      { label: 'Brands', icon: 'branding_watermark', route: '/brands' },
    ],
  },
  {
    group: 'Operations',
    items: [
      { label: 'Orders', icon: 'receipt_long', route: '/orders' },
      { label: 'Inventory', icon: 'warehouse', route: '/inventory' },
      { label: 'Shipments', icon: 'local_shipping', route: '/shipments' },
      { label: 'Payments', icon: 'payments', route: '/payments' },
      { label: 'Returns', icon: 'keyboard_return', route: '/returns' },
    ],
  },
  {
    group: 'Moderation',
    items: [
      { label: 'Reviews', icon: 'reviews', route: '/reviews' },
    ],
  },
  {
    group: 'Marketing',
    items: [
      { label: 'Promotions', icon: 'sell', route: '/promotions' },
      { label: 'Coupons', icon: 'confirmation_number', route: '/coupons' },
    ],
  },
  {
    group: 'System',
    items: [
      { label: 'Settings', icon: 'settings', route: '/settings' },
    ],
  },
];
