import { Routes } from '@angular/router';
import { ClientLayout } from './layout/client-layout/client-layout';
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: 'home', loadChildren: () => import('./features/home/home.routes').then((m) => m.HOME_ROUTES) },
  {
    path: '',
    component: ClientLayout,
    children: [
      // { path: '', pathMatch: 'full', redirectTo: 'home' },
      // { path: 'home', loadChildren: () => import('./features/home/home.routes').then((m) => m.HOME_ROUTES) },
      { path: 'auth', loadChildren: () => import('./features/auth').then((m) => m.AUTH_ROUTES) },
      { path: 'catalog', loadChildren: () => import('./features/catalog').then((m) => m.CATALOG_ROUTES) },
      { path: 'community', loadChildren: () => import('./features/community/community.routes').then((m) => m.COMMUNITY_ROUTES) },
      { path: 'content', loadChildren: () => import('./features/content/content.routes').then((m) => m.CONTENT_ROUTES) },
      { path: 'help-center', loadChildren: () => import('./features/help-center/help-center.routes').then((m) => m.HELP_CENTER_ROUTES) },
      { path: 'account', loadChildren: () => import('./features/account/account.routes').then((m) => m.ACCOUNT_ROUTES) },
      { path: 'orders', loadChildren: () => import('./features/orders/orders.routes').then((m) => m.ORDERS_ROUTES) },
      { path: 'wishlist', loadChildren: () => import('./features/wishlist/wishlist.routes').then((m) => m.WISHLIST_ROUTES) },
      { path: 'cart', loadChildren: () => import('./features/cart/cart.routes').then((m) => m.CART_ROUTES) },
      { path: 'checkout', loadChildren: () => import('./features/checkout/checkout.routes').then((m) => m.CHECKOUT_ROUTES) },
      { path: 'payment', loadChildren: () => import('./features/payment/payment.routes').then((m) => m.PAYMENT_ROUTES) },
      { path: 'search', loadChildren: () => import('./features/search/search.routes').then((m) => m.SEARCH_ROUTES) },
      { path: 'loyalty', loadChildren: () => import('./features/loyalty/loyalty.routes').then((m) => m.LOYALTY_ROUTES) },
    ],
  },
  { path: '**', redirectTo: 'home' },
];
