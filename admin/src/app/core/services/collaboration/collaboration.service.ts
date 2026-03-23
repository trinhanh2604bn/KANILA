import { Injectable, signal } from '@angular/core';
import { ActiveUser } from './collaboration.model';

@Injectable({ providedIn: 'root' })
export class CollaborationService {
  activeUsers = signal<ActiveUser[]>([
    { id: 'u1', name: 'You', color: '#d4708f', currentPage: 'Dashboard', lastActive: new Date().toISOString() },
    { id: 'u2', name: 'Sarah Chen', color: '#3b82f6', currentPage: 'Products', lastActive: new Date().toISOString() },
    { id: 'u3', name: 'Minh Tran', color: '#8b5cf6', currentPage: 'Orders', lastActive: new Date().toISOString() },
  ]);

  getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }
}
