import { Routes } from '@angular/router';

export const ACCOUNT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/account-layout/account-layout').then((m) => m.AccountLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'profile' },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/profile-page/profile-page').then((m) => m.ProfilePageComponent),
      },
      {
        path: 'addresses',
        loadComponent: () =>
          import('./pages/addresses-page/addresses-page').then((m) => m.AddressesPageComponent),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./pages/orders-page/orders-page').then((m) => m.OrdersPageComponent),
      },
      {
        path: 'orders/:id',
        loadComponent: () =>
          import('./pages/order-detail-page/order-detail-page').then((m) => m.OrderDetailPageComponent),
      },
      {
        path: 'wishlist',
        loadComponent: () =>
          import('./pages/wishlist-page/wishlist-page').then((m) => m.WishlistPageComponent),
      },
      {
        path: 'coupons',
        loadComponent: () =>
          import('./pages/coupons-page/coupons-page').then((m) => m.CouponsPageComponent),
      },
      {
        path: 'security',
        loadComponent: () =>
          import('./pages/security-page/security-page').then((m) => m.SecurityPageComponent),
      },
      {
        path: 'payment-methods',
        loadComponent: () =>
          import('./pages/payment-methods-page/payment-methods-page').then((m) => m.PaymentMethodsPageComponent),
      },
      {
        path: 'support',
        loadComponent: () =>
          import('./pages/support-page/support-page').then((m) => m.SupportPageComponent),
      },
      {
        path: 'skin-profile',
        loadComponent: () =>
          import('./pages/skin-profile-page/skin-profile-page').then((m) => m.SkinProfilePageComponent),
      },
    ],
  },
];
