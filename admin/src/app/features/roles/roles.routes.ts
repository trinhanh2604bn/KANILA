import { Routes } from '@angular/router';

export const rolesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/role-list/role-list-page.component').then((m) => m.RoleListPageComponent),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./pages/role-form/role-form-page.component').then((m) => m.RoleFormPageComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./pages/role-form/role-form-page.component').then((m) => m.RoleFormPageComponent),
  },
];
