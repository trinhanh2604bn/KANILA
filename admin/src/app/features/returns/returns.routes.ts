import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/return-list/return-list-page.component').then(m => m.ReturnListPageComponent),
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/return-detail/return-detail-page.component').then(m => m.ReturnDetailPageComponent),
  }
];
// Trigger rebuild
