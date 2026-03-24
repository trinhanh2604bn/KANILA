import { Routes } from '@angular/router';

export const ACCOUNT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/profile-page/profile-page').then((m) => m.ProfilePageComponent),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./pages/profile-page/profile-page').then((m) => m.ProfilePageComponent),
  },
  {
    path: 'addresses',
    loadComponent: () =>
      import('./pages/profile-page/profile-page').then((m) => m.ProfilePageComponent),
  },
  {
    path: 'coupons',
    loadComponent: () =>
      import('./pages/profile-page/profile-page').then((m) => m.ProfilePageComponent),
  },
  {
    path: 'security',
    loadComponent: () =>
      import('./pages/profile-page/profile-page').then((m) => m.ProfilePageComponent),
  },
];
