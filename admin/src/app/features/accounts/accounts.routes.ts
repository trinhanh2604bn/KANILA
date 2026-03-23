import { Routes } from '@angular/router';

export const accountsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/account-list/account-list-page.component').then((m) => m.AccountListPageComponent),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./pages/account-form/account-form-page.component').then((m) => m.AccountFormPageComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/account-detail/account-detail-page.component').then((m) => m.AccountDetailPageComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./pages/account-form/account-form-page.component').then((m) => m.AccountFormPageComponent),
  },
];
