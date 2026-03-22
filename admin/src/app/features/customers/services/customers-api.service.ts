import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, forkJoin } from 'rxjs';
import { Customer } from '../models/customer.model';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { environment } from '../../../core/config/environment';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class CustomersApiService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<Customer[]> {
    return this.http.get<ApiResponse<any[]>>(`${API}/customers`).pipe(
      map(res => res.data.map(c => this.mapCustomer(c)).filter(c => this.isListable(c)))
    );
  }

  getById(id: string): Observable<Customer> {
    return forkJoin({
      customer: this.http.get<ApiResponse<any>>(`${API}/customers/${id}`),
      orders: this.http.get<ApiResponse<any[]>>(`${API}/orders`),
    }).pipe(
      map(({ customer, orders }) => {
        const c = this.mapCustomer(customer.data);
        // Filter orders for this customer
        const custOrders = orders.data
          .filter(o => (o.customerId?._id || o.customerId) === id)
          .map(o => ({
            id: o._id,
            orderNumber: o.orderNumber,
            total: 0,
            status: o.orderStatus,
            createdAt: o.createdAt,
          }));
        c.orders = custOrders;
        c.ordersCount = custOrders.length;
        c.lastOrderDate = custOrders.length > 0 ? custOrders[0].createdAt : '';
        return c;
      })
    );
  }

  /** True when the row has something meaningful to show (name, email, or code). */
  private isListable(c: Customer): boolean {
    const fromParts = [c.firstName, c.lastName].filter(Boolean).join(' ').trim();
    const name = (c.name || c.fullName || fromParts || '').trim();
    const email = (c.email || '').trim();
    const code = (c.customerCode || '').trim();
    return !!(name || email || code);
  }

  /** Map backend Customer (with populated accountId) to frontend model */
  private mapCustomer(raw: any): Customer {
    const account = raw.accountId && typeof raw.accountId === 'object' ? raw.accountId : {};
    const fromParts = [raw.firstName, raw.lastName].filter(Boolean).join(' ').trim();
    const full = (raw.fullName || '').trim();
    const displayName =
      full ||
      fromParts ||
      (raw.customerCode || '').trim() ||
      (account.email ? String(account.email).split('@')[0] : '') ||
      '';
    return {
      id: String(raw._id),
      accountId: account._id ? String(account._id) : raw.accountId ? String(raw.accountId) : '',
      customerCode: raw.customerCode,
      fullName: raw.fullName,
      firstName: raw.firstName || '',
      lastName: raw.lastName || '',
      email: account.email || '',
      phone: account.phone || '',
      avatarUrl: raw.avatarUrl || '',
      customerStatus: raw.customerStatus || 'active',
      gender: raw.gender || '',
      dateOfBirth: raw.dateOfBirth || null,
      registeredAt: raw.registeredAt || raw.createdAt,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      // UI fields
      name: displayName,
      status: raw.customerStatus || 'active',
      segment: 'active', // simplified — no segment data in backend
      behaviorLabel: '',
      totalSpent: 0,
      avgOrderValue: 0,
      ordersCount: 0,
      lastOrderDate: '',
      orders: [],
      activities: [],
    };
  }
}
