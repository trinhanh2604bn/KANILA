import { Injectable } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';
import { Role, CreateRolePayload, UpdateRolePayload } from '../models/role.model';

const MOCK_ROLES: Role[] = [
  { id: '1', name: 'Super Admin', description: 'Full access to all system features', permissions: ['accounts.view', 'accounts.create', 'accounts.edit', 'accounts.delete', 'products.view', 'products.create', 'products.edit', 'products.delete', 'orders.view', 'orders.create', 'orders.edit', 'orders.cancel', 'inventory.view', 'inventory.manage', 'promotions.view', 'promotions.manage', 'coupons.view', 'coupons.manage', 'settings.view', 'settings.manage', 'roles.manage'], accountCount: 1, createdAt: '2025-12-01T10:00:00Z', updatedAt: '2025-12-01T10:00:00Z' },
  { id: '2', name: 'Content Manager', description: 'Manage products, categories, and marketing content', permissions: ['products.view', 'products.create', 'products.edit', 'promotions.view', 'promotions.manage', 'coupons.view'], accountCount: 2, createdAt: '2026-01-10T09:00:00Z', updatedAt: '2026-01-10T09:00:00Z' },
  { id: '3', name: 'Warehouse Staff', description: 'Manage inventory and shipments', permissions: ['inventory.view', 'inventory.manage', 'orders.view', 'products.view'], accountCount: 1, createdAt: '2026-01-20T08:00:00Z', updatedAt: '2026-01-20T08:00:00Z' },
  { id: '4', name: 'Support Agent', description: 'View orders and handle customer inquiries', permissions: ['orders.view', 'orders.edit', 'accounts.view', 'products.view'], accountCount: 1, createdAt: '2026-02-15T07:00:00Z', updatedAt: '2026-02-15T07:00:00Z' },
];

@Injectable({ providedIn: 'root' })
export class RolesApiService {
  private roles = [...MOCK_ROLES];

  getAll(): Observable<Role[]> {
    return of([...this.roles]).pipe(delay(500));
  }

  getById(id: string): Observable<Role> {
    const role = this.roles.find((r) => r.id === id);
    if (!role) return throwError(() => new Error('Role not found'));
    return of({ ...role }).pipe(delay(400));
  }

  create(payload: CreateRolePayload): Observable<Role> {
    const newRole: Role = {
      id: String(Date.now()),
      name: payload.name,
      description: payload.description,
      permissions: payload.permissions,
      accountCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.roles.unshift(newRole);
    return of(newRole).pipe(delay(700));
  }

  update(id: string, payload: UpdateRolePayload): Observable<Role> {
    const index = this.roles.findIndex((r) => r.id === id);
    if (index === -1) return throwError(() => new Error('Role not found'));
    this.roles[index] = { ...this.roles[index], ...payload, updatedAt: new Date().toISOString() };
    return of({ ...this.roles[index] }).pipe(delay(600));
  }
}
