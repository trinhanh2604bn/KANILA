import { RouterModule, Routes } from '@angular/router';
import { ClientLayout } from './layout/client-layout/client-layout';
import { NgModule } from '@angular/core';
import { Home } from './features/home/home';
import { Introduction } from './features/about/introduction/introduction';
import { Contact } from './features/about/contact/contact';
import { Agent } from './features/about/agent/agent';
import { Cookie } from './features/policy/cookie/cookie';
import { Faq } from './features/policy/faq/faq';
import { Feedback } from './features/policy/feedback/feedback';
import { Payment } from './features/policy/payment/payment';
import { Security } from './features/policy/security/security';
import { Shipping } from './features/policy/shipping/shipping';
import { Return } from './features/policy/return/return';
import { Catalog } from './features/catalog/catalog';

export const routes: Routes = [
  {
    path: '',
    component: ClientLayout,
    children: [
      { path: '', component: Home},
      { path: 'about/introduction', component: Introduction},
      { path: 'about/contact', component: Contact},
      { path: 'about/agent', component: Agent},
      { path: 'policy/cookie', component: Cookie},
      { path: 'policy/faq', component: Faq},
      { path: 'policy/feedback', component: Feedback},
      { path: 'policy/payment', component: Payment},
      { path: 'policy/security', component: Security},
      { path: 'policy/shipping', component: Shipping},
      { path: 'policy/return', component: Return},
      { path: 'catalog', component: Catalog},
      { path: 'sale', component: Catalog},
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
