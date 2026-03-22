import { Routes } from '@angular/router';

export const ACTIVITY_FEED_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/activity-feed/activity-feed-page.component').then(m => m.ActivityFeedPageComponent),
  }
];
