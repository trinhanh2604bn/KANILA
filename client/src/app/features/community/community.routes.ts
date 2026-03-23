import { Routes } from '@angular/router';

export const COMMUNITY_ROUTES: Routes = [
  { path: '', loadComponent: () => import('../about/agent/agent').then((m) => m.Agent) },
];
