import { Routes } from '@angular/router';

export const ORDERS_ROUTES: Routes = [
  {
    path: 'success',
    loadComponent: () =>
      import('./pages/order-success-page/order-success-page').then((m) => m.OrderSuccessPageComponent),
  },
];
