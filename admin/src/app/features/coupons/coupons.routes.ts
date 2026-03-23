import { Routes } from '@angular/router';

export const couponsRoutes: Routes = [
  { path: '', loadComponent: () => import('./pages/coupon-list/coupon-list-page.component').then(m => m.CouponListPageComponent) },
  { path: 'create', loadComponent: () => import('./pages/coupon-form/coupon-form-page.component').then(m => m.CouponFormPageComponent) },
  { path: ':id', loadComponent: () => import('./pages/coupon-detail/coupon-detail-page.component').then(m => m.CouponDetailPageComponent) },
  { path: ':id/edit', loadComponent: () => import('./pages/coupon-form/coupon-form-page.component').then(m => m.CouponFormPageComponent) },
];
