import { Routes } from '@angular/router';
import { Mainpage } from './pages/mainpage/mainpage';

export const HOME_ROUTES: Routes = [
  {
    path: '',
    component: Mainpage,
  },
  {
    path: 'mainpage',
    component: Mainpage,
  },
];