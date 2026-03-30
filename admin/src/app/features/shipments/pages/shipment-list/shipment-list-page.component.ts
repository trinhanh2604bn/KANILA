import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShipmentsApiService } from '../../services/shipments-api.service';
import { Shipment, ShipmentStatus, SHIPMENT_STATUS_LABELS } from '../../models/shipment.model';

@Component({
  selector: 'app-shipment-list-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './shipment-list-page.component.html',
  styleUrl: './shipment-list-page.component.css'
})
export class ShipmentListPageComponent implements OnInit {
  private readonly api = inject(ShipmentsApiService);

  shipments = signal<Shipment[]>([]);
  loading = signal(true);
  statusFilter = signal<ShipmentStatus | 'all'>('all');
  searchQuery = signal('');

  filteredShipments = computed(() => {
    let list = this.shipments();
    const s = this.statusFilter();
    const q = this.searchQuery().toLowerCase().trim();
    if (s !== 'all') list = list.filter(sh => sh.status === s);
    if (q) {
      list = list.filter(sh =>
        sh.shipmentNumber.toLowerCase().includes(q) ||
        sh.orderNumber.toLowerCase().includes(q) ||
        sh.trackingNumber.toLowerCase().includes(q) ||
        sh.carrier.toLowerCase().includes(q)
      );
    }
    return list;
  });

  hasActiveFilters = computed(() => this.statusFilter() !== 'all' || this.searchQuery().trim() !== '');

  ngOnInit(): void {
    this.api.getAll().subscribe(data => {
      this.shipments.set(data);
      this.loading.set(false);
    });
  }

  clearFilters(): void {
    this.statusFilter.set('all');
    this.searchQuery.set('');
  }

  getStatusBadgeClass(status: ShipmentStatus): string {
    const map: Record<ShipmentStatus, string> = {
      pending: 'badge-warning',
      ready_to_ship: 'badge-info',
      shipped: 'badge-info',
      in_transit: 'badge-info',
      delivered: 'badge-success',
      failed: 'badge-danger',
      returned: 'badge-muted',
    };
    return map[status];
  }

  getStatusLabel(status: ShipmentStatus): string {
    return SHIPMENT_STATUS_LABELS[status];
  }

  isDelayed(s: Shipment): boolean {
    if (s.status === 'delivered' || s.status === 'failed') return false;
    return new Date(s.estimatedDelivery) < new Date();
  }
}
