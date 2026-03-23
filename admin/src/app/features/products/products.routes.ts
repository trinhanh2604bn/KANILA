import { Routes } from '@angular/router';

/** More specific paths first so `/products/:id/edit` is not captured by `:id` (e.g. id = "edit"). */
export const productsRoutes: Routes = [
  { path: '', loadComponent: () => import('./pages/product-list/product-list-page.component').then(m => m.ProductListPageComponent) },
  { path: 'create', loadComponent: () => import('./pages/product-form/product-form-page.component').then(m => m.ProductFormPageComponent) },
  { path: ':id/edit', loadComponent: () => import('./pages/product-form/product-form-page.component').then(m => m.ProductFormPageComponent) },
  { path: ':id', loadComponent: () => import('./pages/product-detail/product-detail-page.component').then(m => m.ProductDetailPageComponent) },
];
