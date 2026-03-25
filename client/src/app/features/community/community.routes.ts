import { Routes } from '@angular/router';

export const COMMUNITY_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'communityhome' },
  {
    path: 'communityhome',
    loadComponent: () => import('./pages/communityhome/communityhome').then((m) => m.CommunityComponent),
  },
  { path: 'gallery', loadComponent: () => import('./pages/gallery/gallery').then((m) => m.GalleryPage) },
  {
    path: 'gallery/:id',
    loadComponent: () => import('./pages/gallery/gallery-detail/gallery-detail').then((m) => m.GalleryDetailPage),
  },
  { path: 'challenges', loadComponent: () => import('./pages/challenges/challenges').then((m) => m.ChallengesPage) },
  {
    path: 'challenges/:id',
    loadComponent: () => import('./pages/challenges/challenge-detail/challenge-detail').then((m) => m.ChallengeDetailPage),
  },
  {
    path: 'challenges/:id/join',
    loadComponent: () => import('./pages/challenges/challenge-join/challenge-join').then((m) => m.ChallengeJoinPage),
  },
  { path: 'profile', loadComponent: () => import('./pages/profile/profile').then((m) => m.ProfilePage) },
  { path: 'post/:id', loadComponent: () => import('./pages/gallery/post-detail/post-detail').then((m) => m.PostDetailPage) },
];
