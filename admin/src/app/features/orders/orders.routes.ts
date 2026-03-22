import { Routes } from '@angular/router';
import { OrderListPageComponent } from './pages/order-list/order-list-page.component';
import { OrderDetailPageComponent } from './pages/order-detail/order-detail-page.component';

export const routes: Routes = [
  { path: '', component: OrderListPageComponent },
  { path: ':id', component: OrderDetailPageComponent }
];
