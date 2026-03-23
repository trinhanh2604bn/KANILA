import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ReturnRequest, ReturnStatus } from '../models/return.model';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { environment } from '../../../core/config/environment';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class ReturnsApiService {
  private readonly http = inject(HttpClient);

  getReturns(): Observable<ReturnRequest[]> {
    return this.http.get<ApiResponse<unknown[]>>(`${API}/returns`).pipe(
      map((res) => res.data.map((r) => this.mapReturn(r as Record<string, unknown>)))
    );
  }

  getReturn(id: string): Observable<ReturnRequest> {
    return this.http.get<ApiResponse<unknown>>(`${API}/returns/${id}`).pipe(
      map((res) => this.mapReturn(res.data as Record<string, unknown>))
    );
  }

  updateReturnStatus(id: string, status: ReturnStatus): Observable<ReturnRequest> {
    return this.http.put<ApiResponse<unknown>>(`${API}/returns/${id}`, { returnStatus: status }).pipe(
      map((res) => this.mapReturn(res.data as Record<string, unknown>))
    );
  }

  private mapReturn(raw: Record<string, unknown>): ReturnRequest {
    const orderRaw = raw['order_id'] ?? raw['orderId'];
    const order =
      orderRaw && typeof orderRaw === 'object' && orderRaw !== null && '_id' in orderRaw
        ? (orderRaw as { _id?: unknown; order_number?: string; orderNumber?: string })
        : null;

    const orderIdStr =
      order?._id != null
        ? String(order._id)
        : raw['order_id'] != null
          ? String(raw['order_id'])
          : raw['orderId'] != null
            ? String(raw['orderId'])
            : '';

    const orderNumber = (order?.order_number ?? order?.orderNumber ?? '').trim();

    const custRaw = raw['requested_by_customer_id'] ?? raw['requestedByCustomerId'];
    const cust =
      custRaw && typeof custRaw === 'object' && custRaw !== null
        ? (custRaw as { full_name?: string; fullName?: string; email?: string })
        : null;

    const name = (cust?.full_name ?? cust?.fullName ?? '').trim();
    const reasonRaw = raw['returnReason'];
    const reasonStr =
      typeof reasonRaw === 'string' && reasonRaw.trim() ? reasonRaw.trim() : '';

    const noteRaw = raw['note'];
    const noteStr = typeof noteRaw === 'string' ? noteRaw : '';

    const requestedRaw = raw['requestedAt'] ?? raw['createdAt'];
    const createdRaw = raw['createdAt'];
    const updatedRaw = raw['updatedAt'];

    const returnNum = raw['returnNumber'];
    const returnNumber = typeof returnNum === 'string' && returnNum.trim() ? returnNum.trim() : '';

    return {
      id: String(raw['_id'] ?? ''),
      returnNumber,
      orderId: orderIdStr,
      orderNumber: orderNumber || orderIdStr,
      customerName: name || '—',
      customerEmail: (cust?.email ?? '').trim(),
      reason: reasonStr || '—',
      reasonText: noteStr,
      status: this.mapStatus(raw['returnStatus']),
      items: [],
      images: [],
      requestedAt: this.toIso(requestedRaw),
      createdAt: this.toIso(createdRaw),
      updatedAt: this.toIso(updatedRaw),
    };
  }

  private mapStatus(v: unknown): ReturnStatus {
    const s = typeof v === 'string' ? v : 'requested';
    const allowed: ReturnStatus[] = ['requested', 'approved', 'received', 'completed', 'rejected'];
    return (allowed.includes(s as ReturnStatus) ? s : 'requested') as ReturnStatus;
  }

  private toIso(v: unknown): string {
    if (v == null) return '';
    const d = v instanceof Date ? v : new Date(String(v));
    return Number.isNaN(d.getTime()) ? '' : d.toISOString();
  }
}
