import { Routes } from '@angular/router';

export const promotionsRoutes: Routes = [
  { path: '', loadComponent: () => import('./pages/promotion-list/promotion-list-page.component').then(m => m.PromotionListPageComponent) },
  { path: 'create', loadComponent: () => import('./pages/promotion-form/promotion-form-page.component').then(m => m.PromotionFormPageComponent) },
  { path: ':id', loadComponent: () => import('./pages/promotion-detail/promotion-detail-page.component').then(m => m.PromotionDetailPageComponent) },
  { path: ':id/edit', loadComponent: () => import('./pages/promotion-form/promotion-form-page.component').then(m => m.PromotionFormPageComponent) },
];
