import { Routes } from '@angular/router';
import { Catalog } from './pages/product-listing-page/catalog';

export const CATALOG_ROUTES: Routes = [
  { path: 'search', loadComponent: () => import('./pages/search-page/search-page').then((m) => m.CatalogSearchPageComponent) },
  { path: 'product/:slug', loadComponent: () => import('./pages/product-detail-page/product-detail-page').then((m) => m.CatalogProductDetailPageComponent) },
  { path: 'brand/:slug', loadComponent: () => import('./pages/brand-page/brand-page').then((m) => m.CatalogBrandPageComponent) },
  { path: 'tag/:slug', loadComponent: () => import('./pages/collection-tag-page/collection-tag-page').then((m) => m.CatalogCollectionTagPageComponent) },
  { path: 'recommendations', loadComponent: () => import('./pages/recommendation-page/recommendation-page').then((m) => m.CatalogRecommendationPageComponent) },
  { path: 'sale', component: Catalog },
  { path: 'new', component: Catalog },     
  { path: 'popular', component: Catalog },
  { path: '', component: Catalog },
];
