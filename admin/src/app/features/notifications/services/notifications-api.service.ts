import { Injectable, signal } from '@angular/core';
import { Observable, delay, of, tap } from 'rxjs';
import { AppNotification } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationsApiService {
  private mockNotifications: AppNotification[] = [
    { id: 'n1', title: 'New Order Received', description: 'Order ORD-9055 placed by Sarah Chen — $128.00', type: 'order', icon: 'shopping_bag', read: false, timestamp: '2026-03-21T17:30:00Z', route: ['/orders', 'ORD-9055'] },
    { id: 'n2', title: 'Payment Failed', description: 'Payment for ORD-9048 was declined', type: 'payment', icon: 'credit_card_off', read: false, timestamp: '2026-03-21T16:15:00Z', route: ['/payments', 'PAY-7021'] },
    { id: 'n3', title: 'Low Stock Alert', description: 'Cleanser 100ml has only 3 units remaining', type: 'stock', icon: 'inventory', read: false, timestamp: '2026-03-21T14:00:00Z', route: ['/inventory'] },
    { id: 'n4', title: 'Refund Processed', description: '$30.00 refund issued for ORD-8041', type: 'payment', icon: 'currency_exchange', read: true, timestamp: '2026-03-21T11:45:00Z', route: ['/payments', 'PAY-7018'] },
    { id: 'n5', title: 'Product Published', description: 'Vitamin C Toner is now live in the catalog', type: 'system', icon: 'check_circle', read: true, timestamp: '2026-03-21T09:20:00Z', route: ['/products', '5'] },
    { id: 'n6', title: 'Order Shipped', description: 'ORD-9022 shipped via Express', type: 'order', icon: 'local_shipping', read: true, timestamp: '2026-03-20T18:00:00Z', route: ['/orders', 'ORD-9022'] },
  ];

  unreadCount = signal(0);

  getAll(): Observable<AppNotification[]> {
    return of([...this.mockNotifications]).pipe(
      delay(300),
      tap(list => this.unreadCount.set(list.filter(n => !n.read).length))
    );
  }

  markAsRead(id: string): Observable<void> {
    const n = this.mockNotifications.find(x => x.id === id);
    if (n) n.read = true;
    this.unreadCount.update(c => Math.max(0, c - 1));
    return of(undefined).pipe(delay(100));
  }

  markAllAsRead(): Observable<void> {
    this.mockNotifications.forEach(n => n.read = true);
    this.unreadCount.set(0);
    return of(undefined).pipe(delay(200));
  }
}
