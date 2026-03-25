import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login/login-page.component').then(m => m.LoginPageComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/admin-shell/admin-shell.component').then(m => m.AdminShellComponent),
    canActivate: [authGuard],
    children: [
      { path: 'accounts', loadChildren: () => import('./features/accounts/accounts.routes').then(m => m.accountsRoutes) },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/pages/dashboard/dashboard-page.component').then(m => m.DashboardPageComponent) },
      { path: 'roles', loadChildren: () => import('./features/roles/roles.routes').then(m => m.rolesRoutes) },
      { path: 'products', loadChildren: () => import('./features/products/products.routes').then(m => m.productsRoutes) },
      { path: 'categories', loadChildren: () => import('./features/categories/categories.routes').then(m => m.categoriesRoutes) },
      { path: 'brands', loadChildren: () => import('./features/brands/brands.routes').then(m => m.brandsRoutes) },
      { path: 'orders', loadChildren: () => import('./features/orders/orders.routes').then(m => m.routes) },
      { path: 'inventory', loadChildren: () => import('./features/inventory/inventory.routes').then(m => m.routes) },
      { path: 'payments', loadChildren: () => import('./features/payments/payments.routes').then(m => m.routes) },
      { path: 'returns', loadChildren: () => import('./features/returns/returns.routes').then(m => m.routes) },
      { path: 'reviews', loadChildren: () => import('./features/reviews/reviews.routes').then(m => m.routes) },
      { path: 'promotions', loadChildren: () => import('./features/promotions/promotions.routes').then(m => m.promotionsRoutes) },
      { path: 'coupons', loadChildren: () => import('./features/coupons/coupons.routes').then(m => m.couponsRoutes) },
      { path: 'customers', loadChildren: () => import('./features/customers/customers.routes').then(m => m.customersRoutes) },
      { path: 'shipments', loadChildren: () => import('./features/shipments/shipments.routes').then(m => m.shipmentsRoutes) },
      { path: 'audit-log', loadChildren: () => import('./features/audit-log/audit-log.routes').then(m => m.AUDIT_LOG_ROUTES) },
      { path: 'activity', loadChildren: () => import('./features/activity-feed/activity-feed.routes').then(m => m.ACTIVITY_FEED_ROUTES) },
      { path: 'settings', loadChildren: () => import('./features/settings/settings.routes').then(m => m.SETTINGS_ROUTES) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
