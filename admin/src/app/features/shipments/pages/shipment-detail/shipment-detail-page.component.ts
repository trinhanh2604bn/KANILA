import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ShipmentsApiService } from '../../services/shipments-api.service';
import { ToastService } from '../../../../core/services/toast.service';
import { DialogService } from '../../../../core/services/dialog.service';
import {
  Shipment, ShipmentStatus,
  SHIPMENT_STATUS_FLOW, SHIPMENT_STATUS_LABELS, SHIPMENT_WORKFLOW_STEPS
} from '../../models/shipment.model';

@Component({
  selector: 'app-shipment-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './shipment-detail-page.component.html',
  styleUrl: './shipment-detail-page.component.css'
})
export class ShipmentDetailPageComponent implements OnInit {
  private readonly api = inject(ShipmentsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(DialogService);

  shipment = signal<Shipment | null>(null);
  loading = signal(true);
  updating = signal(false);
  copied = signal(false);

  workflowSteps = SHIPMENT_WORKFLOW_STEPS;

  /** Only valid next statuses are shown */
  nextActions = computed(() => {
    const s = this.shipment();
    if (!s) return [];
    const allowed = SHIPMENT_STATUS_FLOW[s.status];
    return allowed.map((status: ShipmentStatus) => ({
      status,
      label: this.getActionLabel(status),
      icon: this.getStatusIcon(status),
      isRetry: status === 'pending' && s.status === 'failed',
      isDestructive: status === 'failed',
    }));
  });

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.api.getById(id).subscribe({
      next: (data) => {
        this.shipment.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Shipment not found');
        this.loading.set(false);
      }
    });
  }

  async updateStatus(newStatus: ShipmentStatus): Promise<void> {
    const s = this.shipment();
    if (!s || this.updating()) return;

    if (newStatus === 'failed') {
      const confirmed = await this.dialog.confirm({
        title: 'Mark as Failed',
        message: 'Are you sure you want to mark this shipment as failed?',
        confirmText: 'Mark Failed',
        cancelText: 'Cancel',
        isDestructive: true,
      });
      if (!confirmed) return;
    }

    this.updating.set(true);

    // Dispatch to the correct admin endpoint
    const call$ =
      newStatus === 'ready_to_ship' ? this.api.readyToShip(s.id) :
      newStatus === 'shipped' ? this.api.ship(s.id) :
      newStatus === 'in_transit' ? this.api.markInTransit(s.id) :
      newStatus === 'delivered' ? this.api.deliver(s.id) :
      newStatus === 'failed' ? this.api.fail(s.id) :
      newStatus === 'pending' ? this.api.retry(s.id) :
      null;

    if (!call$) { this.updating.set(false); return; }

    call$.subscribe({
      next: (updated) => {
        this.shipment.set(updated);
        this.updating.set(false);
        if (newStatus === 'pending') {
          this.toast.success('Shipment reset for retry');
        } else {
          this.toast.success(`Status updated to ${SHIPMENT_STATUS_LABELS[newStatus]}`);
        }
      },
      error: (e: any) => {
        this.updating.set(false);
        this.toast.error(e?.error?.message || 'Failed to update status');
      }
    });
  }

  copyTracking(): void {
    const s = this.shipment();
    if (!s) return;
    navigator.clipboard.writeText(s.trackingNumber).then(() => {
      this.copied.set(true);
      this.toast.info('Tracking number copied');
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  isStepCompleted(step: ShipmentStatus, currentStatus: ShipmentStatus): boolean {
    if (currentStatus === 'failed') {
      // Show steps up to the last non-failed event
      const s = this.shipment();
      if (!s) return false;
      const completedSteps = s.events
        .filter(e => e.status !== 'failed')
        .map(e => e.status);
      return completedSteps.includes(step);
    }
    return this.workflowSteps.indexOf(step) <= this.workflowSteps.indexOf(currentStatus);
  }

  isStepCurrent(step: ShipmentStatus, currentStatus: ShipmentStatus): boolean {
    if (currentStatus === 'failed') return false;
    return step === currentStatus;
  }

  getStatusBadgeClass(status: ShipmentStatus): string {
    const map: Record<ShipmentStatus, string> = {
      pending: 'badge-warning', ready_to_ship: 'badge-info', shipped: 'badge-info',
      in_transit: 'badge-info', delivered: 'badge-success', failed: 'badge-danger', returned: 'badge-muted',
    };
    return map[status] || 'badge-muted';
  }

  getStatusLabel(status: ShipmentStatus): string {
    return SHIPMENT_STATUS_LABELS[status];
  }

  private getStatusIcon(status: ShipmentStatus): string {
    const map: Record<ShipmentStatus, string> = {
      pending: 'inventory_2', ready_to_ship: 'package_2', shipped: 'local_shipping',
      in_transit: 'flight', delivered: 'check_circle', failed: 'error', returned: 'assignment_return',
    };
    return map[status] || 'info';
  }

  private getActionLabel(status: ShipmentStatus): string {
    if (status === 'pending') return 'Retry Shipment';
    const map: Record<ShipmentStatus, string> = {
      pending: '', ready_to_ship: 'Ready to Ship', shipped: 'Mark as Shipped',
      in_transit: 'Mark In Transit', delivered: 'Mark Delivered',
      failed: 'Mark Failed', returned: 'Mark Returned',
    };
    return map[status] || status;
  }
}
