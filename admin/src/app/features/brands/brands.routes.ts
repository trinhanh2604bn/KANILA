import { Routes } from '@angular/router';

export const brandsRoutes: Routes = [
  { path: '', loadComponent: () => import('./pages/brand-list/brand-list-page.component').then(m => m.BrandListPageComponent) },
  { path: 'create', loadComponent: () => import('./pages/brand-form/brand-form-page.component').then(m => m.BrandFormPageComponent) },
  { path: ':id/edit', loadComponent: () => import('./pages/brand-form/brand-form-page.component').then(m => m.BrandFormPageComponent) },
];
