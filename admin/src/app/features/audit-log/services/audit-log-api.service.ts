import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { AuditLogEntry } from '../models/audit-log.model';

@Injectable({ providedIn: 'root' })
export class AuditLogApiService {
  private mockLogs: AuditLogEntry[] = [
    { id: 'a1', action: 'Refund Issued', actionType: 'update', user: 'Admin', target: 'ORD-8041', targetType: 'Order', timestamp: '2026-03-21T17:45:00Z', details: 'Refunded $30.00 to customer' },
    { id: 'a2', action: 'Product Created', actionType: 'create', user: 'Admin', target: 'Vitamin C Toner', targetType: 'Product', timestamp: '2026-03-21T15:30:00Z' },
    { id: 'a3', action: 'Order Cancelled', actionType: 'delete', user: 'Staff', target: 'ORD-9010', targetType: 'Order', timestamp: '2026-03-21T14:00:00Z', details: 'Cancelled at customer request' },
    { id: 'a4', action: 'Role Updated', actionType: 'update', user: 'Admin', target: 'Content Manager', targetType: 'Role', timestamp: '2026-03-21T12:15:00Z', details: 'Modified product permissions' },
    { id: 'a5', action: 'Stock Adjusted', actionType: 'update', user: 'Staff', target: 'Cleanser 100ml', targetType: 'Inventory', timestamp: '2026-03-21T10:00:00Z', details: 'Reduced stock by 5 units' },
    { id: 'a6', action: 'User Created', actionType: 'create', user: 'Admin', target: 'jane.doe@kanila.com', targetType: 'Account', timestamp: '2026-03-20T16:20:00Z' },
    { id: 'a7', action: 'Review Rejected', actionType: 'delete', user: 'Admin', target: 'Review #42', targetType: 'Review', timestamp: '2026-03-20T14:10:00Z', details: 'Spam content detected' },
    { id: 'a8', action: 'System Backup', actionType: 'system', user: 'System', target: 'Database', targetType: 'System', timestamp: '2026-03-20T03:00:00Z', details: 'Automated nightly backup completed' },
    { id: 'a9', action: 'Payment Received', actionType: 'create', user: 'System', target: 'PAY-7022', targetType: 'Payment', timestamp: '2026-03-19T22:30:00Z' },
    { id: 'a10', action: 'Product Updated', actionType: 'update', user: 'Staff', target: 'Glow Moisturizer', targetType: 'Product', timestamp: '2026-03-19T11:00:00Z', details: 'Updated pricing from $30 to $32.50' },
  ];

  getAll(): Observable<AuditLogEntry[]> {
    return of([...this.mockLogs]).pipe(delay(500));
  }
}
