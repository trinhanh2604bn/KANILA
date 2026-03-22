import { Component } from '@angular/core';

export interface QuickAction {
  label: string;
  icon: string;
  route: string;
  color: 'primary' | 'success' | 'warning' | 'info';
}

@Component({
  selector: 'app-quick-actions',
  standalone: true,
  templateUrl: './quick-actions.component.html',
  styleUrl: './quick-actions.component.css',
})
export class QuickActionsComponent {
  actions: QuickAction[] = [
    { label: 'Add Product', icon: 'add_circle', route: '/products', color: 'primary' },
    { label: 'Create Order', icon: 'receipt_long', route: '/orders', color: 'success' },
    { label: 'Add Customer', icon: 'person_add', route: '/customers', color: 'info' },
    { label: 'New Promotion', icon: 'sell', route: '/promotions', color: 'warning' },
  ];
}
