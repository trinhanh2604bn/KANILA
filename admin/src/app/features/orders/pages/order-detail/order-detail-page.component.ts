import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrdersApiService } from '../../services/orders-api.service';
import { ToastService } from '../../../../core/services/toast.service';
import { DialogService } from '../../../../core/services/dialog.service';
import { Order, PaymentSummary, ShipmentSummary, ReturnSummary, RefundSummary, StatusHistoryEntry } from '../../models/order.model';

interface ActionDef {
  label: string;
  icon: string;
  action: string;
  variant: 'primary' | 'soft' | 'danger' | 'ghost';
  disabled?: boolean;
  disabledReason?: string;
}

@Component({
  selector: 'app-order-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink, TitleCasePipe, FormsModule],
  templateUrl: './order-detail-page.component.html',
  styleUrl: './order-detail-page.component.css'
})
export class OrderDetailPageComponent implements OnInit {
  private readonly api = inject(OrdersApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(DialogService);

  order = signal<Order | null>(null);
  loading = signal(true);
  updating = signal(false);
  copiedField = signal('');

  // ─── Dialogs ──────────────────────────────────
  showCreateShipment = signal(false);
  showCreateRefund = signal(false);
  showCreateReturn = signal(false);
  newShipment = { carrierCode: '', trackingNumber: '', serviceName: '' };
  newRefund = { amount: 0, reason: '' };
  newReturn = { reason: '' };

  // ─── Computed ─────────────────────────────────

  /** Available actions based on current order state */
  availableActions = computed<ActionDef[]>(() => {
    const o = this.order();
    if (!o) return [];
    const actions: ActionDef[] = [];

    // Order status actions
    if (o.status === 'pending') {
      actions.push({ label: 'Confirm Order', icon: 'check_circle', action: 'confirm', variant: 'primary' });
      actions.push({ label: 'Cancel Order', icon: 'block', action: 'cancel', variant: 'danger' });
    }
    if (o.status === 'confirmed') {
      actions.push({ label: 'Mark Processing', icon: 'settings', action: 'processing', variant: 'primary' });
      actions.push({ label: 'Cancel Order', icon: 'block', action: 'cancel', variant: 'danger' });
    }
    if (o.status === 'processing') {
      actions.push({ label: 'Cancel Order', icon: 'block', action: 'cancel', variant: 'danger' });
    }

    // Payment actions
    if ((o.paymentStatus === 'unpaid' || o.paymentStatus === 'pending') && o.status !== 'cancelled') {
      actions.push({ label: 'Mark COD Paid', icon: 'payments', action: 'mark_cod_paid', variant: 'soft' });
    }

    // Shipment creation
    if (['confirmed', 'processing'].includes(o.status)) {
      actions.push({ label: 'Create Shipment', icon: 'local_shipping', action: 'create_shipment', variant: 'soft' });
    }

    // Return & Refund
    if (o.fulfillmentStatus === 'delivered' || o.status === 'completed') {
      actions.push({ label: 'Create Return', icon: 'assignment_return', action: 'create_return', variant: 'ghost' });
    }
    if (['paid', 'partially_refunded'].includes(o.paymentStatus) && o.status !== 'cancelled') {
      actions.push({ label: 'Create Refund', icon: 'currency_exchange', action: 'create_refund', variant: 'ghost' });
    }

    return actions;
  });

  latestPayment = computed<PaymentSummary | null>(() => this.order()?.payments?.[0] ?? null);
  latestShipment = computed<ShipmentSummary | null>(() => this.order()?.shipments?.[0] ?? null);

  ngOnInit() {
    this.loadOrder();
  }

  private loadOrder() {
    const id = this.route.snapshot.params['id'];
    this.loading.set(true);
    this.api.getById(id).subscribe({
      next: (data) => { this.order.set(data); this.loading.set(false); },
      error: () => { this.toast.error('Order not found'); this.loading.set(false); }
    });
  }

  private reload() {
    const id = this.route.snapshot.params['id'];
    this.api.getById(id).subscribe({
      next: (data) => this.order.set(data),
    });
  }

  // ═══════════════ ACTION HANDLERS ═══════════════

  handleAction(action: string) {
    switch (action) {
      case 'confirm': this.doConfirm(); break;
      case 'processing': this.doMarkProcessing(); break;
      case 'cancel': this.doCancel(); break;
      case 'mark_cod_paid': this.doCodPaid(); break;
      case 'create_shipment': this.showCreateShipment.set(true); break;
      case 'create_return': this.showCreateReturn.set(true); break;
      case 'create_refund': this.showCreateRefund.set(true); break;
    }
  }

  doConfirm() {
    const o = this.order();
    if (!o) return;
    this.updating.set(true);
    this.api.confirmOrder(o.id).subscribe({
      next: () => { this.toast.success('Order confirmed'); this.reload(); this.updating.set(false); },
      error: (e) => { this.toast.error(e?.error?.message || 'Failed to confirm'); this.updating.set(false); },
    });
  }

  doMarkProcessing() {
    const o = this.order();
    if (!o) return;
    this.updating.set(true);
    this.api.markProcessing(o.id).subscribe({
      next: () => { this.toast.success('Order marked as processing'); this.reload(); this.updating.set(false); },
      error: (e) => { this.toast.error(e?.error?.message || 'Failed to update'); this.updating.set(false); },
    });
  }

  async doCancel() {
    const o = this.order();
    if (!o) return;
    const confirmed = await this.dialog.confirm({
      title: 'Cancel Order',
      message: `Are you sure you want to cancel order ${o.orderNumber}?`,
      confirmText: 'Cancel Order', cancelText: 'Keep Order', isDestructive: true
    });
    if (!confirmed) return;

    this.updating.set(true);
    this.api.cancelOrder(o.id, 'Cancelled by admin').subscribe({
      next: () => { this.toast.info('Order cancelled'); this.reload(); this.updating.set(false); },
      error: (e) => { this.toast.error(e?.error?.message || 'Failed to cancel'); this.updating.set(false); },
    });
  }

  doCodPaid() {
    const o = this.order();
    if (!o) return;
    this.updating.set(true);
    this.api.markCodPaid(o.id).subscribe({
      next: () => { this.toast.success('COD payment recorded'); this.reload(); this.updating.set(false); },
      error: (e) => { this.toast.error(e?.error?.message || 'Failed to mark paid'); this.updating.set(false); },
    });
  }

  submitCreateShipment() {
    const o = this.order();
    if (!o) return;
    this.updating.set(true);
    this.api.createShipment(o.id, this.newShipment).subscribe({
      next: () => {
        this.toast.success('Shipment created');
        this.showCreateShipment.set(false);
        this.newShipment = { carrierCode: '', trackingNumber: '', serviceName: '' };
        this.reload();
        this.updating.set(false);
      },
      error: (e) => { this.toast.error(e?.error?.message || 'Failed to create shipment'); this.updating.set(false); },
    });
  }

  submitCreateRefund() {
    const o = this.order();
    if (!o) return;
    this.updating.set(true);
    this.api.createRefund(o.id, { requestedAmount: this.newRefund.amount, refundReason: this.newRefund.reason }).subscribe({
      next: () => {
        this.toast.success('Refund request created');
        this.showCreateRefund.set(false);
        this.newRefund = { amount: 0, reason: '' };
        this.reload();
        this.updating.set(false);
      },
      error: (e) => { this.toast.error(e?.error?.message || 'Failed to create refund'); this.updating.set(false); },
    });
  }

  submitCreateReturn() {
    const o = this.order();
    if (!o) return;
    this.updating.set(true);
    this.api.createReturn(o.id, { returnReason: this.newReturn.reason }).subscribe({
      next: () => {
        this.toast.success('Return request created');
        this.showCreateReturn.set(false);
        this.newReturn = { reason: '' };
        this.reload();
        this.updating.set(false);
      },
      error: (e) => { this.toast.error(e?.error?.message || 'Failed to create return'); this.updating.set(false); },
    });
  }

  // Return actions
  doApproveReturn(returnId: string) {
    this.updating.set(true);
    this.api.approveReturn(returnId).subscribe({
      next: () => { this.toast.success('Return approved'); this.reload(); this.updating.set(false); },
      error: (e) => { this.toast.error(e?.error?.message || 'Failed'); this.updating.set(false); },
    });
  }
  doRejectReturn(returnId: string) {
    this.updating.set(true);
    this.api.rejectReturn(returnId).subscribe({
      next: () => { this.toast.info('Return rejected'); this.reload(); this.updating.set(false); },
      error: (e) => { this.toast.error(e?.error?.message || 'Failed'); this.updating.set(false); },
    });
  }
  doReceiveReturn(returnId: string) {
    this.updating.set(true);
    this.api.receiveReturn(returnId).subscribe({
      next: () => { this.toast.success('Return items received'); this.reload(); this.updating.set(false); },
      error: (e) => { this.toast.error(e?.error?.message || 'Failed'); this.updating.set(false); },
    });
  }
  doCompleteReturn(returnId: string) {
    this.updating.set(true);
    this.api.completeReturn(returnId).subscribe({
      next: () => { this.toast.success('Return completed'); this.reload(); this.updating.set(false); },
      error: (e) => { this.toast.error(e?.error?.message || 'Failed'); this.updating.set(false); },
    });
  }

  // Refund actions
  doApproveRefund(refundId: string) {
    this.updating.set(true);
    this.api.approveRefund(refundId).subscribe({
      next: () => { this.toast.success('Refund approved'); this.reload(); this.updating.set(false); },
      error: (e) => { this.toast.error(e?.error?.message || 'Failed'); this.updating.set(false); },
    });
  }
  doCompleteRefund(refundId: string) {
    this.updating.set(true);
    this.api.completeRefund(refundId).subscribe({
      next: () => { this.toast.success('Refund completed'); this.reload(); this.updating.set(false); },
      error: (e) => { this.toast.error(e?.error?.message || 'Failed'); this.updating.set(false); },
    });
  }

  // ═══════════════ UI HELPERS ═══════════════

  copyToClipboard(text: string, fieldName: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.copiedField.set(fieldName);
      this.toast.info(`${fieldName} copied`);
      setTimeout(() => this.copiedField.set(''), 2000);
    });
  }

  formatPrice(val: number): string { return (val ?? 0).toLocaleString('vi-VN') + '₫'; }

  formatDate(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  formatDateTime(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  }

  getStatusClass(status: string): string {
    const s = (status || '').toLowerCase();
    if (['completed', 'delivered', 'paid', 'success', 'approved', 'restocked'].includes(s)) return 'badge-success';
    if (['pending', 'unfulfilled', 'unpaid', 'requested', 'preparing', 'authorized'].includes(s)) return 'badge-warning';
    if (['confirmed', 'processing', 'shipped', 'in_transit', 'partially_shipped', 'ready_to_ship'].includes(s)) return 'badge-info';
    if (['cancelled', 'failed', 'rejected', 'returned'].includes(s)) return 'badge-danger';
    if (['refunded', 'partially_refunded', 'partially_returned'].includes(s)) return 'badge-muted';
    return 'badge-muted';
  }

  getReturnNextAction(status: string): { label: string, action: string } | null {
    if (status === 'requested') return { label: 'Approve', action: 'approve' };
    if (status === 'approved') return { label: 'Receive', action: 'receive' };
    if (status === 'received') return { label: 'Complete', action: 'complete' };
    return null;
  }

  getRefundNextAction(status: string): { label: string, action: string } | null {
    if (status === 'requested') return { label: 'Approve', action: 'approve' };
    if (status === 'approved') return { label: 'Complete', action: 'complete' };
    return null;
  }
}
