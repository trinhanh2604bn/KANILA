import { Routes } from '@angular/router';
import { ClientLayout } from './layout/client-layout/client-layout';

import { Mainpage } from './features/home/pages/mainpage/mainpage';
export const routes: Routes = [
    { path: '', redirectTo: 'mainpage', pathMatch: 'full' },
    { path: '', component: Mainpage },
    {
        path: '',
        component: ClientLayout,
        children: [
            {path: 'auth',
            loadChildren: () => import('./features/auth/auth-routing.module').then(m => m.AuthRoutingModule)},
        ]
      }
    
];