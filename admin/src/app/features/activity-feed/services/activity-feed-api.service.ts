import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { ActivityItem } from '../models/activity.model';

@Injectable({ providedIn: 'root' })
export class ActivityFeedApiService {
  private items: ActivityItem[] = [
    { id: 'a1', action: 'updated pricing for', actionType: 'update', user: 'Sarah Chen', userColor: '#3b82f6', target: 'Hydrating Serum 30ml', targetType: 'Product', timestamp: '2026-03-21T19:10:00Z' },
    { id: 'a2', action: 'marked order as shipped', actionType: 'update', user: 'Minh Tran', userColor: '#8b5cf6', target: 'ORD-9055', targetType: 'Order', timestamp: '2026-03-21T18:45:00Z' },
    { id: 'a3', action: 'left a comment on', actionType: 'comment', user: 'Sarah Chen', userColor: '#3b82f6', target: 'ORD-9048', targetType: 'Order', timestamp: '2026-03-21T18:20:00Z', detail: '"Customer requested priority shipping"' },
    { id: 'a4', action: 'adjusted stock for', actionType: 'update', user: 'Admin', userColor: '#d4708f', target: 'Cleanser 100ml', targetType: 'Inventory', timestamp: '2026-03-21T17:30:00Z', detail: 'Added 50 units' },
    { id: 'a5', action: 'created new product', actionType: 'create', user: 'Admin', userColor: '#d4708f', target: 'Rose Face Mist', targetType: 'Product', timestamp: '2026-03-21T16:00:00Z' },
    { id: 'a6', action: 'rejected review on', actionType: 'delete', user: 'Admin', userColor: '#d4708f', target: 'Glow Moisturizer', targetType: 'Review', timestamp: '2026-03-21T14:30:00Z', detail: 'Spam content' },
    { id: 'a7', action: 'issued refund for', actionType: 'update', user: 'Minh Tran', userColor: '#8b5cf6', target: 'ORD-8041', targetType: 'Payment', timestamp: '2026-03-20T22:15:00Z', detail: '$30.00 partial refund' },
    { id: 'a8', action: 'approved return request for', actionType: 'update', user: 'Sarah Chen', userColor: '#3b82f6', target: 'ORD-9010', targetType: 'Return', timestamp: '2026-03-20T17:00:00Z' },
    { id: 'a9', action: 'created new account', actionType: 'create', user: 'Admin', userColor: '#d4708f', target: 'jane.doe@kanila.com', targetType: 'Account', timestamp: '2026-03-20T11:30:00Z' },
    { id: 'a10', action: 'performed system backup', actionType: 'system', user: 'System', userColor: '#6b7280', target: 'Database', targetType: 'System', timestamp: '2026-03-20T03:00:00Z' },
  ];

  getAll(): Observable<ActivityItem[]> {
    return of([...this.items]).pipe(delay(400));
  }
}
