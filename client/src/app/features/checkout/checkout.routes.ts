import { Routes } from '@angular/router';

export const CHECKOUT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/checkout-page/checkout-page').then((m) => m.CheckoutPageComponent),
  },
];
