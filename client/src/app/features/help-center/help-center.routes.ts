import { Routes } from '@angular/router';

export const HELP_CENTER_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'faq' },
  { path: 'faq', loadComponent: () => import('../policy/faq/faq').then((m) => m.Faq) },
  { path: 'feedback', loadComponent: () => import('../policy/feedback/feedback').then((m) => m.Feedback) },
  { path: 'policies/payment', loadComponent: () => import('../policy/payment/payment').then((m) => m.Payment) },
  { path: 'policies/shipping', loadComponent: () => import('../policy/shipping/shipping').then((m) => m.Shipping) },
  { path: 'policies/security', loadComponent: () => import('../policy/security/security').then((m) => m.Security) },
  { path: 'policies/cookie', loadComponent: () => import('../policy/cookie/cookie').then((m) => m.Cookie) },
  { path: 'policies/return', loadComponent: () => import('../policy/return/return').then((m) => m.Return) },
];
