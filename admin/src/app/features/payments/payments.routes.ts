import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/payment-list/payment-list-page.component').then(m => m.PaymentListPageComponent),
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/payment-detail/payment-detail-page.component').then(m => m.PaymentDetailPageComponent),
  }
];
// Trigger rebuild
