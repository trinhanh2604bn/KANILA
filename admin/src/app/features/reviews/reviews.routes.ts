import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/review-list/review-list-page.component').then(m => m.ReviewListPageComponent),
  }
];
// Trigger rebuild
