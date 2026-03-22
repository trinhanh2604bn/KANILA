import { Routes } from '@angular/router';

export const shipmentsRoutes: Routes = [
  { path: '', loadComponent: () => import('./pages/shipment-list/shipment-list-page.component').then(m => m.ShipmentListPageComponent) },
  { path: ':id', loadComponent: () => import('./pages/shipment-detail/shipment-detail-page.component').then(m => m.ShipmentDetailPageComponent) },
];
