import { Routes } from '@angular/router';
import { Catalog } from './catalog';

export const CATALOG_ROUTES: Routes = [
  { path: '', component: Catalog },
  { path: 'sale', component: Catalog },
];
