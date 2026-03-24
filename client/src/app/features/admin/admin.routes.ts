import { Routes } from '@angular/router';
import { adminGuard } from '../../core/guards/admin.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'recommendation-analytics',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/recommendation-analytics-page/recommendation-analytics-page').then(
        (m) => m.RecommendationAnalyticsPageComponent
      ),
  },
];
