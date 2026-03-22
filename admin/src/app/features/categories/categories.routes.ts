import { Routes } from '@angular/router';

export const categoriesRoutes: Routes = [
  { path: '', loadComponent: () => import('./pages/category-list/category-list-page.component').then(m => m.CategoryListPageComponent) },
  { path: 'create', loadComponent: () => import('./pages/category-form/category-form-page.component').then(m => m.CategoryFormPageComponent) },
  { path: ':id/edit', loadComponent: () => import('./pages/category-form/category-form-page.component').then(m => m.CategoryFormPageComponent) },
];
