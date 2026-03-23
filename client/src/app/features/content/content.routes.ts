import { Routes } from '@angular/router';

export const CONTENT_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'introduction' },
  { path: 'introduction', loadComponent: () => import('../about/introduction/introduction').then((m) => m.Introduction) },
  { path: 'contact', loadComponent: () => import('../about/contact/contact').then((m) => m.Contact) },
];
