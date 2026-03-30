import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, forkJoin, of } from 'rxjs';
import { Shipment, ShipmentEvent, ShipmentStatus } from '../models/shipment.model';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { environment } from '../../../core/config/environment';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class ShipmentsApiService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<Shipment[]> {
    return this.http.get<ApiResponse<any[]>>(`${API}/shipments`).pipe(
      map(res => res.data.map(s => this.mapShipment(s)))
    );
  }

  getById(id: string): Observable<Shipment> {
    return forkJoin({
      shipment: this.http.get<ApiResponse<any>>(`${API}/shipments/${id}`),
      events: this.http.get<ApiResponse<any[]>>(`${API}/shipment-events/shipment/${id}`),
    }).pipe(
      map(({ shipment, events }) => {
        const s = this.mapShipment(shipment.data);
        s.events = events.data.map(e => this.mapEvent(e));
        return s;
      })
    );
  }

  // ── Admin lifecycle actions ──

  readyToShip(id: string): Observable<Shipment> {
    return this.http.patch<ApiResponse<any>>(`${API}/admin/shipments/${id}/ready-to-ship`, {}).pipe(
      map(res => this.mapShipment(res.data))
    );
  }

  ship(id: string): Observable<Shipment> {
    return this.http.patch<ApiResponse<any>>(`${API}/admin/shipments/${id}/ship`, {}).pipe(
      map(res => this.mapShipment(res.data))
    );
  }

  markInTransit(id: string): Observable<Shipment> {
    return this.http.patch<ApiResponse<any>>(`${API}/admin/shipments/${id}/in-transit`, {}).pipe(
      map(res => this.mapShipment(res.data))
    );
  }

  deliver(id: string): Observable<Shipment> {
    return this.http.patch<ApiResponse<any>>(`${API}/admin/shipments/${id}/deliver`, {}).pipe(
      map(res => this.mapShipment(res.data))
    );
  }

  fail(id: string, reason?: string): Observable<Shipment> {
    return this.http.patch<ApiResponse<any>>(`${API}/admin/shipments/${id}/fail`, { reason: reason || '' }).pipe(
      map(res => this.mapShipment(res.data))
    );
  }

  retry(id: string): Observable<Shipment> {
    return this.fail(id, 'Retrying shipment'); // backend: failed → pending via transition
  }

  private mapShipment(raw: any): Shipment {
    const ord = raw.order_id ?? raw.orderId;
    const ordObj = ord && typeof ord === 'object' ? ord : null;
    return {
      id: raw._id,
      orderId: ordObj?._id?.toString?.() ?? ord?.toString?.() ?? '',
      warehouseId: raw.warehouseId || null,
      shipmentNumber: raw.shipmentNumber,
      carrierCode: raw.carrierCode || '',
      serviceName: raw.serviceName || '',
      trackingNumber: raw.trackingNumber || '',
      shipmentStatus: raw.shipmentStatus || 'pending',
      shippedAt: raw.shippedAt || null,
      deliveredAt: raw.deliveredAt || null,
      failedAt: raw.failedAt || null,
      shippingFeeAmount: raw.shippingFeeAmount || 0,
      currencyCode: raw.currencyCode || 'VND',
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      // UI aliases
      status: raw.shipmentStatus || 'pending',
      carrier: raw.carrierCode || 'N/A',
      estimatedDelivery: '',
      events: [],
      failureReason: '',
      orderNumber: ordObj?.order_number ?? ordObj?.orderNumber ?? '',
    };
  }

  private mapEvent(raw: any): ShipmentEvent {
    return {
      id: raw._id,
      shipmentId: raw.shipmentId,
      eventCode: raw.eventCode,
      eventStatus: raw.eventStatus || '',
      eventDescription: raw.eventDescription || '',
      eventTime: raw.eventTime || raw.createdAt,
      locationText: raw.locationText || '',
      status: (raw.eventStatus || raw.eventCode || '') as any,
    };
  }
}
