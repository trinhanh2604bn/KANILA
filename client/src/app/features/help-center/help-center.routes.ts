import { Routes } from '@angular/router';

export const HELP_CENTER_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'faq' },
  { path: 'faq', loadComponent: () => import('../policy/pages/faq/faq').then((m) => m.Faq) },
  { path: 'feedback', loadComponent: () => import('../policy/pages/feedback/feedback').then((m) => m.Feedback) },
  { path: 'policies/payment', loadComponent: () => import('../policy/pages/payment/payment').then((m) => m.Payment) },
  { path: 'policies/shipping', loadComponent: () => import('../policy/pages/shipping/shipping').then((m) => m.Shipping) },
  { path: 'policies/security', loadComponent: () => import('../policy/pages/security/security').then((m) => m.Security) },
  { path: 'policies/cookie', loadComponent: () => import('../policy/pages/cookie/cookie').then((m) => m.Cookie) },
  { path: 'policies/return', loadComponent: () => import('../policy/pages/return/return').then((m) => m.Return) },
];
