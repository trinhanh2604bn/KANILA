import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { OrdersApiService } from '../../services/orders-api.service';
import { ToastService } from '../../../../core/services/toast.service';
import { DialogService } from '../../../../core/services/dialog.service';
import { Order, OrderStatus } from '../../models/order.model';

@Component({
  selector: 'app-order-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink, TitleCasePipe],
  templateUrl: './order-detail-page.component.html',
  styleUrl: './order-detail-page.component.css'
})
export class OrderDetailPageComponent implements OnInit {
  private readonly api = inject(OrdersApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(DialogService);

  order = signal<Order | null>(null);
  loading = signal(true);
  updating = signal(false);

  // Workflow rules: Pending -> Confirmed -> Shipped -> Delivered
  nextAvailableAction = computed(() => {
    const status = this.order()?.status;
    if (status === 'pending') return { label: 'Confirm Order', nextStatus: 'confirmed' as OrderStatus, icon: 'check_circle' };
    if (status === 'confirmed') return { label: 'Ship Order', nextStatus: 'shipped' as OrderStatus, icon: 'local_shipping' };
    if (status === 'shipped') return { label: 'Mark as Delivered', nextStatus: 'delivered' as OrderStatus, icon: 'inventory_2' };
    return null;
  });

  workflowSteps = ['pending', 'confirmed', 'shipped', 'delivered'];

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    this.api.getById(id).subscribe({
      next: (data) => {
        this.order.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Order not found');
        this.loading.set(false);
      }
    });
  }

  /** Strictly past steps only (so “Pending” is not shown as completed green while still current). */
  isStepDone(step: string, currentStatus: string): boolean {
    if (currentStatus === 'cancelled') return false;
    const si = this.workflowSteps.indexOf(step);
    const ci = this.workflowSteps.indexOf(currentStatus);
    if (si === -1 || ci === -1) return false;
    return si < ci;
  }

  isStepCurrent(step: string, currentStatus: string): boolean {
    return currentStatus !== 'cancelled' && step === currentStatus;
  }

  /** Connector line after this step is filled when order has moved past this step. */
  isConnectorAfter(step: string, currentStatus: string): boolean {
    if (currentStatus === 'cancelled') return false;
    const si = this.workflowSteps.indexOf(step);
    const ci = this.workflowSteps.indexOf(currentStatus);
    if (si === -1 || ci === -1) return false;
    return ci > si;
  }

  async updateStatus(newStatus: OrderStatus) {
    const current = this.order();
    if (!current) return;

    // Destructive action check
    if (newStatus === 'cancelled') {
      const confirmed = await this.dialog.confirm({
        title: 'Cancel Order',
        message: `Are you sure you want to cancel order ${current.orderNumber}? This cannot be undone.`,
        confirmText: 'Cancel Order',
        cancelText: 'Keep Order',
        isDestructive: true
      });
      if (!confirmed) return;
    }

    this.updating.set(true);
    // store old to allow undo for safe actions
    const oldStatus = current.status;
    
    this.api.updateStatus(current.id, newStatus).subscribe({
      next: (updatedOrder) => {
        this.order.set(updatedOrder);
        this.updating.set(false);
        
        if (newStatus === 'cancelled') {
          this.toast.info('Order has been cancelled.');
        } else {
          this.toast.success(`Order marked as ${newStatus}`, 'Status Updated', () => {
            // Undo Action
            this.updating.set(true);
            this.api.updateStatus(current.id, oldStatus).subscribe(reverted => {
              this.order.set(reverted);
              this.updating.set(false);
              this.toast.info('Action reversed.');
            });
          });
        }
      },
      error: () => {
        this.toast.error('Failed to update status');
        this.updating.set(false);
      }
    });
  }

  formatPrice(val: number): string {
    return val.toLocaleString('vi-VN') + '₫';
  }
}
