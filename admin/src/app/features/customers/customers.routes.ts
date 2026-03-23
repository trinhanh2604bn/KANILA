import { Routes } from '@angular/router';

export const customersRoutes: Routes = [
  { path: '', loadComponent: () => import('./pages/customer-list/customer-list-page.component').then(m => m.CustomerListPageComponent) },
  { path: ':id', loadComponent: () => import('./pages/customer-detail/customer-detail-page.component').then(m => m.CustomerDetailPageComponent) },
];
