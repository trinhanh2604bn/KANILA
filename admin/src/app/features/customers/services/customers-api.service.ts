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
        const custOrders = orders.data
          .filter(o => {
            const cid = o.customer_id?._id || o.customer_id;
            return String(cid) === id;
          })
          .map(o => ({
            id: o._id,
            orderNumber: o.order_number ?? o.orderNumber,
            total: 0,
            status: o.order_status ?? o.orderStatus,
            createdAt: o.created_at ?? o.createdAt,
          }));
        c.orders = custOrders;
        c.ordersCount = custOrders.length;
        c.lastOrderDate = custOrders.length > 0 ? custOrders[0].createdAt : '';
        return c;
      })
    );
  }

  private isListable(c: Customer): boolean {
    const fromParts = [c.first_name, c.last_name].filter(Boolean).join(' ').trim();
    const name = (c.name || c.full_name || fromParts || '').trim();
    const email = (c.email || '').trim();
    const code = (c.customer_code || '').trim();
    return !!(name || email || code);
  }

  /** Map backend Customer (with populated account_id) to frontend model */
  private mapCustomer(raw: any): Customer {
    const account =
      raw.account_id && typeof raw.account_id === 'object' ? raw.account_id : {};
    const fromParts = [raw.first_name, raw.last_name].filter(Boolean).join(' ').trim();
    const full = (raw.full_name || '').trim();
    const displayName =
      full ||
      fromParts ||
      (raw.customer_code || '').trim() ||
      (account.email ? String(account.email).split('@')[0] : '') ||
      '';
    return {
      id: String(raw._id),
      accountId: account._id ? String(account._id) : raw.account_id ? String(raw.account_id) : '',
      customer_code: raw.customer_code,
      full_name: raw.full_name,
      first_name: raw.first_name || '',
      last_name: raw.last_name || '',
      email: account.email || '',
      phone: account.phone || '',
      avatar_url: raw.avatar_url || '',
      customer_status: raw.customer_status || 'active',
      gender: raw.gender || '',
      date_of_birth: raw.date_of_birth || null,
      registered_at: raw.registered_at || raw.created_at,
      created_at: raw.created_at,
      updated_at: raw.updated_at,
      name: displayName,
      status: raw.customer_status || 'active',
      segment: 'active',
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
