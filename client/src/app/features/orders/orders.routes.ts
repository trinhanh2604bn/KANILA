import { Routes } from '@angular/router';

export const ORDERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/my-orders-page/my-orders-page').then((m) => m.MyOrdersPageComponent),
  },
  {
    path: 'lookup',
    loadComponent: () =>
      import('./pages/order-lookup-page/order-lookup-page').then((m) => m.OrderLookupPageComponent),
  },
  {
    path: 'success',
    loadComponent: () =>
      import('./pages/order-success-page/order-success-page').then((m) => m.OrderSuccessPageComponent),
  },
  {
    path: ':id/tracking',
    loadComponent: () =>
      import('./pages/order-tracking-page/order-tracking-page').then((m) => m.OrderTrackingPageComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/order-detail-page/order-detail-page').then((m) => m.OrderDetailPageComponent),
  },
];
