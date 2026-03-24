import { Routes } from '@angular/router';

export const CONTENT_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'introduction' },
  { path: 'introduction', loadComponent: () => import('../about/pages/introduction/introduction').then((m) => m.Introduction) },
  { path: 'contact', loadComponent: () => import('../about/pages/contact/contact').then((m) => m.Contact) },
];
